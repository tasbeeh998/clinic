# Vite/Rollup's native optional dependency in the repository lockfile targets
# GNU libc. Use the Debian Node image in development rather than Alpine/musl.
FROM node:20

WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci --include=optional

COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

EXPOSE 3000

CMD ["npm", "run", "dev", "--workspace=apps/web", "--", "--host", "0.0.0.0"]
