# Checkmate — Next.js + Socket.IO on Fly.io (or any Docker host)
FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy app and build
COPY . .
RUN npx prisma generate
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000
ENV PORT=3000

CMD ["node", "server.js"]
