FROM node:22-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy everything at once
COPY . .

# Verify critical files exist
RUN ls client/src/main.tsx || (echo "ERROR: client/src/main.tsx missing from build context!" && exit 1)

# Install dependencies
RUN pnpm install

# Build application
RUN pnpm build

# Expose port
EXPOSE 3000

# Start server
CMD ["pnpm", "start"]
