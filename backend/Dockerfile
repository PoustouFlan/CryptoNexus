FROM node:20-slim

# Install dependencies for Prisma (openssl, etc.)
RUN apt-get update && apt-get install -y \
    openssl \
    libc6 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm install -g @nestjs/cli && npm install

COPY . .

# Generate Prisma client inside container
RUN npx prisma generate

EXPOSE 4000
CMD ["npm", "run", "start:dev"]
