# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm install

# Copy source code (including migrations)
COPY src ./src

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files and install production dependencies ONLY (omit devDependencies)
# We need ts-node for the migrate script if we run it from source, 
# or we can rely on compiled JS. Let's make it robust.
COPY package*.json ./
RUN npm install --omit=dev && npm install ts-node typescript @types/node

# Copy built assets
COPY --from=builder /app/dist ./dist
# Copy source files needed for migrations if run via ts-node
COPY --from=builder /app/src ./src
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Default environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Expose the API port
EXPOSE 3000

# The command is overridden by Render for the Worker service
CMD ["npm", "start"]
