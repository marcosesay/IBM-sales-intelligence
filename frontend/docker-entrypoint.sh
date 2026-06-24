#!/bin/sh
set -e

if [ -z "$BACKEND_URL" ]; then
  echo "ERROR: BACKEND_URL environment variable is not set." >&2
  exit 1
fi

# Render the template into the live config (template is read-only; write to a new file)
sed "s|BACKEND_URL_PLACEHOLDER|${BACKEND_URL}|g" \
  /etc/nginx/conf.d/nginx.conf.template \
  > /etc/nginx/conf.d/default.conf

exec "$@"
