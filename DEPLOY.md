# Gym Tracker — Deployment Guide

> **Legend**
> - 🙋 **YOU** — do this manually yourself
> - 🤖 **AI** — ask Claude to create/do this
> - ✅ **Done** — mark this when complete

---

## PHASE 0 — Accounts & Credentials Setup

> Do this once before anything else. No code involved.

---

### Step 0.1 — Docker Hub account 🙋

1. Go to https://hub.docker.com and sign up (or log in)
2. Create two public repositories:
   - `YOUR_USERNAME/gym-tracker-server`
   - `YOUR_USERNAME/gym-tracker-web`
3. Go to **Account Settings → Security → New Access Token**
   - Name it: `github-actions`
   - Copy the token — you won't see it again

**Save these:**
```
DOCKERHUB_USERNAME = _______________
DOCKERHUB_TOKEN    = _______________
```

---

### Step 0.2 — Oracle VM: note your details 🙋

SSH into your Oracle VM and run:

```bash
whoami          # note your username (usually 'ubuntu' or 'opc')
hostname -I     # note the public IP
```

**Save these:**
```
ORACLE_HOST     = _______________   (public IP of your VM)
ORACLE_USER     = _______________   (e.g. ubuntu)
```

---

### Step 0.3 — GitHub repo secrets 🙋

In your GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**

Add these 5 secrets:

| Secret Name         | Value                          |
|---------------------|--------------------------------|
| `DOCKERHUB_USERNAME`| your Docker Hub username       |
| `DOCKERHUB_TOKEN`   | token from step 0.1            |
| `ORACLE_HOST`       | VM public IP from step 0.2     |
| `ORACLE_USER`       | VM username from step 0.2      |
| `ORACLE_SSH_KEY`    | contents of your `~/.ssh/id_rsa` (private key) |

> **How to get your private key content:**
> ```bash
> cat ~/.ssh/id_rsa
> # Copy everything including -----BEGIN----- and -----END----- lines
> ```
> If you don't have an SSH key pair yet:
> ```bash
> ssh-keygen -t rsa -b 4096 -C "github-actions"
> # Then add the PUBLIC key to Oracle VM's ~/.ssh/authorized_keys
> ```

---

## PHASE 1 — Oracle VM: One-Time Server Setup

> SSH into your Oracle VM and run these commands once.
> Nothing to do with code — just preparing the server.

---

### Step 1.1 — Install Docker 🙋

```bash
# Connect to your Oracle VM
ssh ubuntu@YOUR_ORACLE_IP

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Log out and back in for group change to apply
exit
ssh ubuntu@YOUR_ORACLE_IP

# Verify
docker --version
docker compose version
```

---

### Step 1.2 — Open firewall ports 🙋

**Part A — Oracle Cloud Console (web UI):**
1. Go to Oracle Cloud → Networking → Virtual Cloud Networks
2. Click your VCN → Security Lists → Default Security List
3. Add Ingress Rules:
   - Port 80 (HTTP) — Source: 0.0.0.0/0, Protocol: TCP
   - Port 443 (HTTPS) — Source: 0.0.0.0/0, Protocol: TCP

**Part B — Inside the VM (iptables):**
```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

> If `netfilter-persistent` is not found:
> ```bash
> sudo apt install iptables-persistent -y
> ```

---

### Step 1.3 — Point your domain to Oracle VM 🙋

In your domain registrar (GoDaddy / Namecheap / etc):

Add a DNS A record:
```
Type:  A
Name:  @   (or your subdomain, e.g. gym)
Value: YOUR_ORACLE_PUBLIC_IP
TTL:   3600
```

Wait 5–30 minutes for DNS to propagate, then verify:
```bash
ping yourdomain.com
# Should resolve to your Oracle IP
```

---

### Step 1.4 — Install Certbot (SSL) 🙋

```bash
sudo apt update
sudo apt install certbot -y

# Get SSL certificate (replace with your actual domain)
sudo certbot certonly --standalone -d yourdomain.com

# Verify certs were created
ls /etc/letsencrypt/live/yourdomain.com/
# Should show: fullchain.pem  privkey.pem
```

> Certbot auto-renews. Certs expire every 90 days but renew automatically.

---

### Step 1.5 — Create project folder on VM 🙋

```bash
mkdir -p ~/gym-tracker
cd ~/gym-tracker
```

---

### Step 1.6 — Upload credentials.json to VM 🙋

Run this from **your local machine** (not the VM):

```bash
scp apps/server/credentials.json ubuntu@YOUR_ORACLE_IP:~/gym-tracker/credentials.json
```

---

### Step 1.7 — Create .env file on VM 🙋

```bash
# On the Oracle VM:
nano ~/gym-tracker/.env
```

Paste this content (fill in your real values):
```env
SPREADSHEET_ID=1Ogg_xQ6injMTN9NJtauPWErwdRT72dFGKOhpSV9KUWA
ALLOWED_ORIGIN=https://yourdomain.com
PORT=4000
```

---

## PHASE 2 — Local Docker Setup & Test

> Back on your local machine. Goal: get the app running in Docker locally.

---

### Step 2.1 — Create server Dockerfile 🤖

Tell Claude:
> "Create apps/server/Dockerfile for the Express server (ARM64, CommonJS, Node 20)"

---

### Step 2.2 — Create client Dockerfile 🤖

Tell Claude:
> "Create apps/client/Dockerfile — multi-stage: Vite build then nginx to serve static files"

---

### Step 2.3 — Create nginx.conf 🤖

Tell Claude:
> "Create nginx.conf — serve React SPA on /, proxy /api to server:4000, SSL with certbot certs"
> Provide your domain name.

---

### Step 2.4 — Create docker-compose.yml 🤖

Tell Claude:
> "Create docker-compose.yml with nginx + gym-server, mount credentials.json and .env, mount certbot certs"
> Provide your Docker Hub username.

---

### Step 2.5 — Test locally 🙋

```bash
# From project root
docker compose up --build

# Open browser
open http://localhost
```

Verify:
- [ ] Dashboard loads
- [ ] Log Workout works
- [ ] History page works
- [ ] API calls return data (no CORS errors)

If anything fails → fix before moving to Phase 3.

---

## PHASE 3 — Push Images to Docker Hub & Test on Oracle

> Goal: confirm ARM64 images work on real Oracle hardware before automating.

---

### Step 3.1 — Login to Docker Hub locally 🙋

```bash
docker login
# Enter your Docker Hub username and token from Step 0.1
```

---

### Step 3.2 — Build & push ARM64 images 🙋

```bash
# Set up buildx for ARM64 (one-time)
docker buildx create --use --name arm-builder

# Build and push server image
docker buildx build \
  --platform linux/arm64 \
  -f apps/server/Dockerfile \
  -t YOUR_USERNAME/gym-tracker-server:latest \
  --push .

# Build and push web (nginx + React) image
docker buildx build \
  --platform linux/arm64 \
  -f apps/client/Dockerfile \
  -t YOUR_USERNAME/gym-tracker-web:latest \
  --push .
```

---

### Step 3.3 — Deploy manually to Oracle VM (first time) 🙋

```bash
# SSH into Oracle VM
ssh ubuntu@YOUR_ORACLE_IP

cd ~/gym-tracker

# Copy docker-compose.yml and nginx.conf from your local machine first:
# (run from local machine)
scp docker-compose.yml ubuntu@YOUR_ORACLE_IP:~/gym-tracker/
scp nginx.conf ubuntu@YOUR_ORACLE_IP:~/gym-tracker/

# Then on the VM:
docker compose pull
docker compose up -d

# Check containers are running
docker compose ps
docker compose logs
```

---

### Step 3.4 — Verify live site 🙋

Open `https://yourdomain.com` in your browser.

- [ ] HTTPS works (green padlock)
- [ ] App loads correctly
- [ ] Log a test workout — check it saves to Google Sheet
- [ ] History page shows data

---

## PHASE 4 — GitHub Actions CI/CD

> Automate everything from Phase 3 so it happens on git tag push.

---

### Step 4.1 — Create CI workflow 🤖

Tell Claude:
> "Create .github/workflows/ci.yml — runs on every push to main, builds both Docker images but does not push"

---

### Step 4.2 — Create deploy workflow 🤖

Tell Claude:
> "Create .github/workflows/deploy.yml — triggers on git tag push (v*.*.*), builds ARM64 images, pushes to Docker Hub, SSHs into Oracle VM and runs docker compose pull + up -d"
> Provide your Docker Hub username.

---

### Step 4.3 — Commit and push workflows 🙋

```bash
git add .github/ apps/server/Dockerfile apps/client/Dockerfile docker-compose.yml nginx.conf
git commit -m "add Docker + CI/CD pipeline"
git push origin main
```

Go to GitHub → **Actions** tab → watch the CI workflow run.
- [ ] CI workflow passes ✅

---

### Step 4.4 — Test full deploy with a git tag 🙋

```bash
git tag v1.0.0
git push origin v1.0.0
```

Go to GitHub → **Actions** tab → watch the deploy workflow:
1. [ ] Builds ARM64 images
2. [ ] Pushes to Docker Hub
3. [ ] SSHs into Oracle VM
4. [ ] Pulls and restarts containers

Open `https://yourdomain.com` — verify the live site updated.

---

## PHASE 5 — Ongoing: Normal Dev Workflow

> From now on, this is your daily flow.

```
Write code locally
      ↓
git add . && git commit -m "feat: something"
git push origin main
      ↓
CI runs automatically (build check) — no deploy
      ↓
... more commits ...
      ↓
Ready to release?
      ↓
git tag v1.2.0
git push origin v1.2.0
      ↓
GitHub deploys automatically to Oracle ✅
```

---

## Quick Reference

### Useful commands on Oracle VM

```bash
# Check running containers
docker compose ps

# View logs
docker compose logs -f

# Restart everything
docker compose restart

# Pull latest images and restart (manual deploy)
docker compose pull && docker compose up -d

# Roll back to previous tag
docker compose down
# Edit docker-compose.yml → change image tag to v1.1.0
docker compose up -d
```

### Roll back a bad deploy 🙋

```bash
# On Oracle VM
cd ~/gym-tracker
# Edit docker-compose.yml — change :latest to :v1.1.0 for both images
nano docker-compose.yml
docker compose pull
docker compose up -d
```

---

## Summary Table

| Phase | Step | Who | Status |
|-------|------|-----|--------|
| 0 | Docker Hub account + repos | 🙋 You | ⬜ |
| 0 | Note Oracle VM details | 🙋 You | ⬜ |
| 0 | Add GitHub repo secrets | 🙋 You | ⬜ |
| 1 | Install Docker on Oracle VM | 🙋 You | ⬜ |
| 1 | Open ports 80/443 | 🙋 You | ⬜ |
| 1 | Point domain DNS to Oracle IP | 🙋 You | ⬜ |
| 1 | Install Certbot + get SSL cert | 🙋 You | ⬜ |
| 1 | Create ~/gym-tracker folder | 🙋 You | ⬜ |
| 1 | Upload credentials.json | 🙋 You | ⬜ |
| 1 | Create .env on Oracle VM | 🙋 You | ⬜ |
| 2 | Create server Dockerfile | 🤖 AI | ⬜ |
| 2 | Create client Dockerfile | 🤖 AI | ⬜ |
| 2 | Create nginx.conf | 🤖 AI | ⬜ |
| 2 | Create docker-compose.yml | 🤖 AI | ⬜ |
| 2 | Test locally with docker compose | 🙋 You | ⬜ |
| 3 | Login to Docker Hub locally | 🙋 You | ⬜ |
| 3 | Build + push ARM64 images | 🙋 You | ⬜ |
| 3 | First manual deploy to Oracle | 🙋 You | ⬜ |
| 3 | Verify live site works | 🙋 You | ⬜ |
| 4 | Create CI workflow | 🤖 AI | ⬜ |
| 4 | Create deploy workflow | 🤖 AI | ⬜ |
| 4 | Push workflows + test CI | 🙋 You | ⬜ |
| 4 | Test tag-based deploy | 🙋 You | ⬜ |
