FROM node:20-alpine
WORKDIR /app

COPY apps/server/package.json ./package.json
RUN npm install --omit=dev

COPY apps/server/src ./src

EXPOSE 4000
CMD ["node", "src/index.js"]
