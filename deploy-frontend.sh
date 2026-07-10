#!/bin/bash
set -e
APP=sales-intelligence-data-ai-frontend
echo ">>> Deleting $APP..."
ibmcloud ce application delete --name $APP --force
echo ">>> Recreating from main..."
ibmcloud ce application create --name $APP \
  --build-source https://github.com/marcosesay/IBM-sales-intelligence \
  --revision main --build-context-dir frontend --strategy dockerfile \
  --port 8080 --min-scale 1 --max-scale 3 --cpu 0.5 --memory 1G \
  --env BACKEND_URL=http://sales-intelligence-data-ai-backend.23ij0n2ztu5p.svc.cluster.local \
  --no-wait
echo ">>> Done. Follow the build with the buildrun logs command printed above."
