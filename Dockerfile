FROM node:22-alpine AS development-dependencies
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM development-dependencies AS build
COPY tsconfig.json tsconfig.build.json nest-cli.json ./
COPY src ./src
RUN npm run build

FROM node:22-alpine AS production
ENV NODE_ENV=production
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
RUN mkdir -p /app/uploads /app/logs && chown node:node /app/uploads /app/logs
USER node
EXPOSE 4321
CMD ["node", "dist/main.js"]
