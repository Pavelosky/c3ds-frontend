#!/bin/sh
set -e

# Default to port 80 if PORT not set
export PORT=${PORT:-80}

# Replace environment variables in nginx config
envsubst '$BACKEND_URL $PORT' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Print configuration for debugging
echo "Nginx configuration:"
echo "Backend URL: $BACKEND_URL"
echo "Listening on port: $PORT"

# Start nginx in foreground
exec nginx -g 'daemon off;'
