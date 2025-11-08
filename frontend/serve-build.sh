#!/bin/bash
cd /app/frontend
# Build if build directory doesn't exist or is empty
if [ ! -d "build" ] || [ -z "$(ls -A build 2>/dev/null)" ]; then
    echo "Building production assets..."
    DISABLE_ESLINT_PLUGIN=true yarn build
fi
# Serve the build directory
npx serve -s build -l 3000
