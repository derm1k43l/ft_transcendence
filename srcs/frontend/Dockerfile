# Use Nginx to serve static files
FROM nginx:alpine

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy static site files into nginx html directory
COPY public/ /usr/share/nginx/html/

# Expose port 80
EXPOSE 80
