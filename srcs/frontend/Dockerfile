# Use Nginx to serve static files
FROM node:18

# Install dependencies
COPY package*.json ./

# Copy rest of the code
COPY . .

RUN npm install

RUN npm run build

# Expose port 80
EXPOSE 8080

# Start the server
CMD ["npm", "run", "serve:local"]
