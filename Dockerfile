# ---------- build stage ----------
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
COPY knexfile.cjs ./knexfile.cjs
RUN npm run build
RUN mkdir -p dist/web && cp -r src/web/* dist/web

# ---------- runtime stage ----------
FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production
ENV TZ=Asia/Almaty

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=build /app/dist ./dist
COPY knexfile.cjs ./knexfile.cjs

COPY src/postgres/migrations ./src/postgres/migrations
COPY src/postgres/seeds ./src/postgres/seeds

EXPOSE 3000
CMD ["node", "dist/index.js"]
