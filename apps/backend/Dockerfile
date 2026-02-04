FROM node:18-alpine

WORKDIR /app

# Copy root package.json and yarn.lock for workspaces
COPY package.json yarn.lock ./
COPY packages ./packages

# Copy backend package.json
COPY apps/backend/package.json ./apps/backend/

# Install dependencies (workspace aware)
RUN yarn install --frozen-lockfile

# Copy backend source code
COPY apps/backend ./apps/backend

# Build the application
WORKDIR /app/apps/backend
RUN yarn build

# Expose port
EXPOSE 5000

# Start the application
CMD ["yarn", "start:prod"]
