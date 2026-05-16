# Gym Tracker — Real Deployment Journal

> This is not a clean guide. This is exactly what happened, what broke, why it broke, and how we fixed it.
> Follow this if you are deploying from scratch or debugging a broken deploy.

---

## Stack Overview

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite |
| Backend | Node.js + Express |
| Reverse proxy | nginx |
| Containerization | Docker + Docker Compose |
| SSL | Let's Encrypt (Certbot) |
| Hosting | Oracle Cloud VM (AMD64 / x86_64) |
| CI/CD | GitHub Actions |
| Image registry | Docker Hub |

---

## Architecture: How Everything Connects

```
User Browser
     │
     │ https://gym.voicelogger.online (port 443)
     ▼
┌─────────────────────────────┐
│  gym-web container (nginx)  │
│  - serves React static files│
│  - proxies /api → server    │
└────────────┬────────────────┘
             │ http://gym-server:4000  (internal Docker network)
             ▼
┌─────────────────────────────┐
│  gym-server container       │
│  (Node.js / Express API)    │
│  - reads credentials.json   │
│  - uses .env for config     │
└─────────────────────────────┘
```

Key points:
- `gym-server` is NEVER exposed to the outside world directly — only nginx talks to it
- `gym-server` is the Docker container name — Docker's internal DNS resolves it inside the network
- nginx lives inside `gym-web` container (it's a multi-stage build: Vite builds React → nginx serves it)
- SSL certs from `/etc/letsencrypt` on the host VM are mounted into the nginx container

---

## Phase 1 — Local Docker Testing

### Goal
Get the app running via Docker on your local machine before touching the VM.

### What the nginx.conf does (explained simply)

The nginx.conf has two server blocks:

**Block 1 — HTTP (port 80):**
- In production: immediately redirects everything to HTTPS (`return 301`)
- In local testing: serves the app directly (no SSL needed)

**Block 2 — HTTPS (port 443):**
- Only used in production
- Loads SSL certs from `/etc/letsencrypt`
- Serves React static files from `/usr/share/nginx/html`
- Proxies any request starting with `/api` to `http://gym-server:4000`

### Problem: Port 80 is reserved on Linux

**What happened:** Running `docker compose up` with `ports: "80:80"` failed or required root on Linux.

**Why:** Linux reserves ports below 1024 for root only.

**Fix:** Change the port mapping in `docker-compose.yml` for local testing:
```yaml
ports:
  - "8080:80"   # host:container — reach it at http://localhost:8080
```
nginx inside the container still listens on 80 — you just reach it from port 8080 outside.

### Problem: nginx crashes locally because SSL certs don't exist

**What happened:** Container exited immediately on startup.

**Why:** `docker-compose.yml` mounts `/etc/letsencrypt` from the host, which doesn't exist on a local machine.

**Fix:** Comment out the letsencrypt volume for local testing:
```yaml
volumes:
  - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
  # - /etc/letsencrypt:/etc/letsencrypt:ro   ← comment this out locally
```

### Problem: nginx.conf in SSL-only mode crashes locally

**What happened:** Even with certs commented out, nginx still tried to load the HTTPS block and failed.

**Fix:** Switch nginx.conf to local mode — comment out `return 301` and the entire HTTPS server block, uncomment the HTTP serving block:

```nginx
server {
    listen 80;
    server_name gym.voicelogger.online;

    # return 301 https://$host$request_uri;  ← commented out for local

    root /usr/share/nginx/html;
    index index.html;
    location / {
        try_files $uri $uri/ /index.html;
    }
    location /api {
        proxy_pass http://gym-server:4000;
        ...
    }
}

# entire HTTPS block commented out for local
```

### Problem: ALLOWED_ORIGIN mismatch causes CORS errors

**What happened:** API calls from the browser were blocked by CORS.

**Why:** The Express server only allows requests from origins listed in `ALLOWED_ORIGIN`. Locally the app runs on `http://localhost:8080` but `.env` still had `http://localhost:5173` (Vite dev server).

**Fix:** Update `.env` to match where the app is actually served from:
```env
ALLOWED_ORIGIN=http://localhost:8080
```

### Local test command
```bash
docker compose up --build
# Open http://localhost:8080
```

---

## Phase 2 — Oracle VM Setup

### Step 1 — Install Docker on the VM

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
exit   # log out
# log back in — the group change only applies to new sessions
docker --version
docker compose version
```

### Step 2 — Get SSL Certificate (Certbot)

Run certbot BEFORE starting any Docker containers (certbot needs port 80 free):

```bash
sudo certbot certonly --standalone -d gym.voicelogger.online
```

---

### PROBLEM 1 — nginx already running on port 80

**Error:**
```
Could not bind TCP port 80 because it is already in use by another process
```

**Why:** Oracle VMs come with nginx pre-installed and running as a system service.

**Diagnosis:**
```bash
sudo ss -tlnp | grep :80
# Output showed: nginx pid=4432 listening on :80
```

**Fix:**
```bash
sudo systemctl stop nginx      # stop nginx
sudo systemctl disable nginx   # prevent it from starting again on reboot
```

Then retry certbot.

---

### PROBLEM 2 — Certbot still fails after stopping nginx

**Error:**
```
Detail: Fetching http://gym.voicelogger.online/.well-known/acme-challenge/...: Error getting validation data
```

**Why:** Let's Encrypt's server tried to reach your VM on port 80 to verify domain ownership, but couldn't connect at all.

**Diagnosis — check from local machine:**
```bash
curl -v http://gym.voicelogger.online
# Output: connect to 144.24.96.163 port 80 failed: No route to host
```

"No route to host" = connection actively rejected, not just timed out. This points to a firewall issue.

**Checked the Oracle Cloud Security List** (web console → VCN → subnet → Security Rules):
- Port 80 ✅ already added
- Port 443 ✅ already added

So the cloud firewall was fine. Checked iptables inside the VM:

```bash
sudo iptables -L INPUT -n --line-numbers
```

**Output:**
```
num  target     prot opt source               destination
1    ACCEPT     ...  RELATED,ESTABLISHED
2    ACCEPT     ...  (ICMP)
3    ACCEPT     ...  (all)
4    ACCEPT     6    ...  dpt:22
5    REJECT     0    --  0.0.0.0/0   0.0.0.0/0   reject-with icmp-host-prohibited  ← PROBLEM
6    ACCEPT     6    ...  dpt:443
7    ACCEPT     6    ...  dpt:80
```

**Root cause:** Port 80 and 443 ACCEPT rules were at lines 6 and 7, but the REJECT rule was at line 5. iptables processes rules top to bottom — traffic hit REJECT before reaching the ACCEPT rules.

**Why this happened:** The DEPLOY.md guide says to insert rules at position 6 with `iptables -I INPUT 6`, but the REJECT rule was already at position 5, so new rules ended up after it.

**Fix:** Delete the wrongly positioned rules and re-insert them before the REJECT rule:

```bash
# Delete rules at lines 6 and 7 (port 443 and 80)
sudo iptables -D INPUT 7
sudo iptables -D INPUT 6

# Re-insert at line 5 (before the REJECT at line 5, which shifts down)
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 5 -m state --state NEW -p tcp --dport 80 -j ACCEPT

# Verify — port 80 and 443 must appear BEFORE the REJECT rule
sudo iptables -L INPUT -n --line-numbers

# Save rules so they survive reboot
sudo netfilter-persistent save
```

**Certbot then succeeded:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/gym.voicelogger.online/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/gym.voicelogger.online/privkey.pem
This certificate expires on 2026-08-14.
```

---

## Phase 3 — Deploy to Oracle VM

### Revert files to production mode before copying

**nginx.conf** — production mode (undo local changes):
- Uncomment `return 301 https://$host$request_uri;`
- Comment out the HTTP serving block body
- Uncomment the entire HTTPS server block

**docker-compose.yml** — production mode:
```yaml
ports:
  - "80:80"
  - "443:443"
volumes:
  - ./nginx.conf:/etc/nginx/conf.d/default.conf:ro
  - /etc/letsencrypt:/etc/letsencrypt:ro   # uncomment this
```

### Copy files to the VM

Run from your local machine (project root):

```bash
scp docker-compose.yml ubuntu@144.24.96.163:~/gym-tracker/
scp nginx.conf ubuntu@144.24.96.163:~/gym-tracker/
scp apps/server/credentials.json ubuntu@144.24.96.163:~/gym-tracker/credentials.json
```

### Create .env on the VM

```bash
nano ~/gym-tracker/.env
```

```env
SPREADSHEET_ID=1Ogg_xQ6injMTN9NJtauPWErwdRT72dFGKOhpSV9KUWA
ALLOWED_ORIGIN=https://gym.voicelogger.online
PORT=4000
GOOGLE_SERVICE_ACCOUNT_EMAIL=gym-tracker@gym-tracker-0001.iam.gserviceaccount.com
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json
```

### Build and push Docker images

**IMPORTANT: Build for AMD64** — Oracle VM is x86_64, not ARM.

> We initially built for `linux/arm64` (the DEPLOY.md default), which caused a pull failure on the VM. Always verify VM architecture with `uname -m` first.

```bash
# One-time buildx setup
docker buildx create --use --name arm-builder

docker login

# Server image
docker buildx build \
  --platform linux/amd64 \
  -f apps/server/Dockerfile \
  -t mukesh20120/gym-tracker-server:latest \
  --push .

# Web image
docker buildx build \
  --platform linux/amd64 \
  -f apps/client/Dockerfile \
  -t mukesh20120/gym-tracker-web:latest \
  --push .
```

---

### PROBLEM 3 — Docker permission denied on VM

**Error:**
```
permission denied while trying to connect to the Docker daemon socket at unix:///var/run/docker.sock
```

**Why:** The `ubuntu` user wasn't in the `docker` group yet (the `usermod` command was run but the session wasn't refreshed).

**Fix:**
```bash
sudo usermod -aG docker $USER
newgrp docker   # apply group change without logging out
```

---

### PROBLEM 4 — Wrong image platform (ARM vs AMD)

**Error:**
```
no matching manifest for linux/amd64 in the manifest list entries
```

**Why:** Images were built for `linux/arm64` but the Oracle VM is `x86_64` (AMD64).

**Diagnosis:**
```bash
uname -m
# Output: x86_64  ← AMD64, not ARM
```

**Fix:** Rebuild and push with `--platform linux/amd64` (see build commands above).

---

### Deploy on the VM

```bash
cd ~/gym-tracker
docker compose pull
docker compose up -d

# Verify
docker compose ps
docker compose logs
```

---

## Phase 4 — GitHub Actions CI/CD

Two workflows:

### CI (`.github/workflows/ci.yml`)
- Triggers on every push to `main`
- Builds both Docker images for `linux/amd64`
- Does NOT push — just validates the build succeeds

### Deploy (`.github/workflows/deploy.yml`)
- Triggers on git tag push matching `v*.*.*`
- Builds and pushes both images to Docker Hub
- SSHs into Oracle VM and runs `docker compose pull && docker compose up -d`

### Required GitHub Secrets

Go to GitHub repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | `mukesh20120` |
| `DOCKERHUB_TOKEN` | Docker Hub access token (not your password) |
| `ORACLE_HOST` | `144.24.96.163` |
| `ORACLE_USER` | `ubuntu` |
| `ORACLE_SSH_KEY` | contents of `~/.ssh/id_rsa` (full private key including header/footer lines) |

### How to trigger a deploy

```bash
git tag v1.0.0
git push origin v1.0.0
```

---

## Daily Dev Workflow (Phase 5)

```
Write code locally
      ↓
git add . && git commit -m "feat: something"
git push origin main
      ↓
CI runs (build check only — no deploy)
      ↓
... more commits ...
      ↓
Ready to release?
      ↓
git tag v1.2.0
git push origin v1.2.0
      ↓
GitHub deploys automatically ✅
```

---

## Switching Between Local and Production

### Going local (for development/testing)

**nginx.conf:**
- Comment out `return 301 https://...`
- Uncomment the HTTP serving block (root, location /, location /api)
- Comment out the entire HTTPS server block

**docker-compose.yml:**
- Change `"80:80"` → `"8080:80"`
- Comment out `"443:443"`
- Comment out `/etc/letsencrypt` volume mount

**.env:**
- `ALLOWED_ORIGIN=http://localhost:8080`

```bash
docker compose up --build
# Open http://localhost:8080
```

### Going production (before scp to VM)

**nginx.conf:**
- Uncomment `return 301 https://...`
- Comment out the HTTP serving block
- Uncomment the entire HTTPS server block

**docker-compose.yml:**
- Change back to `"80:80"` and `"443:443"`
- Uncomment `/etc/letsencrypt` volume mount

**.env on VM:**
- `ALLOWED_ORIGIN=https://gym.voicelogger.online`

---

## Useful Commands

### On the Oracle VM

```bash
# Check running containers
docker compose ps

# Stream logs
docker compose logs -f

# Restart everything
docker compose restart

# Manual deploy (pull latest images)
docker compose pull && docker compose up -d

# Check iptables rules with line numbers
sudo iptables -L INPUT -n --line-numbers

# Check what's using a port
sudo ss -tlnp | grep :80

# Verify SSL cert exists
ls /etc/letsencrypt/live/gym.voicelogger.online/

# Renew cert manually (auto-renews but just in case)
sudo certbot renew
```

### On local machine

```bash
# Test if VM port is reachable
curl -v http://gym.voicelogger.online

# Copy files to VM
scp docker-compose.yml ubuntu@144.24.96.163:~/gym-tracker/
scp nginx.conf ubuntu@144.24.96.163:~/gym-tracker/
scp apps/server/credentials.json ubuntu@144.24.96.163:~/gym-tracker/credentials.json
```

---

## Quick Troubleshooting Reference

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| `No route to host` on port 80/443 | iptables REJECT rule before ACCEPT rules | Re-insert ACCEPT rules before REJECT rule |
| Certbot fails — port 80 in use | nginx system service running | `sudo systemctl stop nginx && sudo systemctl disable nginx` |
| Certbot fails — validation error | iptables blocking Let's Encrypt servers | Fix iptables rule order (see Problem 2) |
| `permission denied` on docker | User not in docker group | `sudo usermod -aG docker $USER && newgrp docker` |
| `no matching manifest for linux/amd64` | Built for ARM64, VM is AMD64 | Rebuild with `--platform linux/amd64` |
| CORS errors in browser | ALLOWED_ORIGIN doesn't match app URL | Update `.env` ALLOWED_ORIGIN to match |
| nginx container crashes on startup | SSL cert path doesn't exist locally | Comment out letsencrypt volume in docker-compose.yml |
| App loads but API returns 502 | gym-server container not running | `docker compose logs gym-server` to diagnose |
