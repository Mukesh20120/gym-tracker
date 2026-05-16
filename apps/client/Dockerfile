FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json ./
COPY apps/client/package.json apps/client/
COPY apps/server/package.json apps/server/
RUN npm ci

COPY apps/client/ apps/client/
RUN npm run build -w apps/client

FROM nginx:stable-alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html
EXPOSE 80 443
CMD ["nginx", "-g", "daemon off;"]
