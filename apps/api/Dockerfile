FROM node:20

WORKDIR /app

# PostgreSQL client
RUN apt-get update && apt-get install -y wget gnupg lsb-release ca-certificates && \
    wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /usr/share/keyrings/postgresql.gpg && \
    echo "deb [signed-by=/usr/share/keyrings/postgresql.gpg] http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list && \
    apt-get update && apt-get install -y postgresql-client-16 && \
    rm -rf /var/lib/apt/lists/*

# Chromium + Arabic fonts for Puppeteer
RUN apt-get update && apt-get install -y --no-install-recommends \
    chromium \
    fonts-noto-core \
    fontconfig \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_DOWNLOAD=true
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

COPY package*.json ./
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY jest.config.js ./
COPY .env.test ./

RUN npm install

COPY src ./src
COPY prisma ./prisma
COPY create-admin.js ./

RUN npm run prisma:generate
RUN npm run build

EXPOSE 3001

# Development must not apply migration history to an existing local database
# automatically. Fresh or legacy local data is preserved; migrations are an
# explicit developer action after a reviewed backup/baseline decision.
CMD ["node", "dist/main.js"]
