# --- Stage 1: Build Stage ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm ci

# Copy source code and build TypeScript output
COPY . .
RUN npm run build

# --- Stage 2: Production Stage ---
FROM node:20-alpine AS production

WORKDIR /app

# Copy package files and install production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy compiled JavaScript from builder stage
COPY --from=builder /app/dist ./dist

# Expose server port
EXPOSE 5000

# Start server
CMD ["node", "dist/index.js"]