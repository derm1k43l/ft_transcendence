# Use Node base image
FROM node:18

# Create app directory
WORKDIR /app

COPY package*.json ./
RUN npm install

#.dockerignore excludes node_modules from being copied (they will be built inside the container)
COPY . .

# Expose backend port
EXPOSE 3000

# Start the server
CMD [ "node", "server.js" ]
