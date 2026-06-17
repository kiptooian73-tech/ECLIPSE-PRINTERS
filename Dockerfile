FROM node:18-alpine
WORKDIR /app

# Install build deps and app
COPY package*.json ./
RUN npm ci --only=production

COPY . .

ENV NODE_ENV=production
ENV PORT=3000

EXPOSE 3000

USER node
CMD ["node", "server.js"]
