# Use Node base image
FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy app source
COPY . .

# Build the application
RUN npm run build

# Expose ports for HTTP and HTTPS
EXPOSE 8080
EXPOSE 8443

# Start the server
CMD ["npm", "run", "serve:local"]