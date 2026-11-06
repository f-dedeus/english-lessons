FROM node:24-slim

WORKDIR /app

# Dependencies first, so Docker can reuse this layer when only the code changes
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ENV NODE_ENV=production
EXPOSE 3333

# Applies any pending database migrations, then starts the API
CMD ["sh", "-c", "node_modules/.bin/tsx src/db/migrate.ts && node_modules/.bin/tsx src/server.ts"]