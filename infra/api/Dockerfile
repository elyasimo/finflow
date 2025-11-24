# Backend API Dockerfile
FROM node:18-alpine AS base

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source
COPY . .

# Development stage
FROM base AS development
EXPOSE 8080
CMD ["npm", "run", "dev"]

# Production build stage
FROM base AS build
RUN npm run build

# Production stage
FROM node:18-alpine AS production
WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --only=production

# Copy built files
COPY --from=build /app/dist ./dist
COPY --from=build /app/drizzle ./drizzle

EXPOSE 8080

# Run migrations and start server
CMD ["sh", "-c", "npm run migrate && node dist/server.js"]
