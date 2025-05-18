#!/bin/bash

# Create certs directory if it doesn't exist
mkdir -p certs

# Generate self-signed certificates
echo "Generating self-signed SSL certificates..."
openssl req -x509 -newkey rsa:4096 -keyout certs/priv-key.pem -out certs/certificate.pem -days 365 -nodes -subj "/CN=localhost"

echo "SSL certificate generated successfully in ./certs directory"