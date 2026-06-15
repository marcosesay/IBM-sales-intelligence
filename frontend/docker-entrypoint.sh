#!/bin/sh
set -e

# Replace the backend URL placeholder with the runtime env var
# BACKEND_URL must be set to the full base URL of the backend Code Engine app
# e.g. https://my-backend.abcdef.us-south.codeengine.appdomain.cloud
if [ -z "$BACKEND_URL" ]; then
  echo "ERROR: BACKEND_URL environment variable is not set." >&2
  exit 1
fi

sed -i "s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf

exec "$@"
