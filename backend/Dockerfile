# Use Node base image
FROM node:18

# Create app directory
WORKDIR /app

COPY package*.json ./
RUN npm install

# Install OpenSSL to handle certificates
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

# Create directories for certificates and uploads
RUN mkdir -p /app/certs
RUN mkdir -p /app/uploads
RUN mkdir -p /app/db

#.dockerignore excludes node_modules from being copied (they will be built inside the container)
COPY . .

# Expose backend port for both HTTP and HTTPS
EXPOSE 3000
EXPOSE 3443

# Start the server
CMD [ "node", "server.js" ]
