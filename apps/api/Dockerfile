FROM node:20

WORKDIR /app

# postgresql-client-16 (matching the server's exact major version via the
# official PGDG apt repo, not Debian's default — a mismatched client/server
# version is a common source of subtle pg_dump/psql failures).
RUN apt-get update && apt-get install -y wget gnupg lsb-release ca-certificates && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && apt-get install -y postgresql-client-16 && \
    rm -rf /var/lib/apt/lists/*

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY jest.config.js ./
COPY .env.test ./

RUN npm install

COPY src ./src
COPY prisma ./prisma
RUN ls -la /app/prisma/migrations/

RUN npm run prisma:generate
RUN npm run build

EXPOSE 3001

CMD ["node", "dist/main.js"]
