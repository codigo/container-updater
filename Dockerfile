# Use an official Node.js runtime as the base image
FROM node:22-alpine

# Install Docker CLI
RUN apk add --no-cache docker-cli

# Add node user to docker group
RUN addgroup -g 998 docker
RUN adduser node docker

# Set the working directory in the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm -g install typescript
RUN npm ci --only=production

# Copy the rest of the application code
COPY --chown=node:node . .

# Build the TypeScript code
RUN npm run build

# Use non-root user
USER node

# Expose the port the app runs on
EXPOSE 3000

# Run the application
CMD ["npm run start"]
