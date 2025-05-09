# Use Nginx to serve static files
FROM node:18

COPY package*.json ./

RUN npm install

#.dockerignore excludes node_modules from being copied (they will be built inside the container)
COPY . .

# RUN npm run build

# Expose port 80
EXPOSE 8080

# Start the server
CMD ["npm", "run", "serve:local"]
