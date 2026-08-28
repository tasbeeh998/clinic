FROM node:20

WORKDIR /app

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
