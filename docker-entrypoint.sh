#!/bin/sh
set -e

# $BACKEND_URL needs to be replaced with actual environment variable
# This allows Railway to inject the backend URL at runtime
envsubst '$BACKEND_URL' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Print configuration for debugging
echo "Nginx configuration:"
echo "Backend URL: $BACKEND_URL"

# Start nginx in foreground
exec nginx -g 'daemon off;'
