#!/usr/bin/env bash
set -e

# Clean dist
rm -rf dist

for entry in task-list task-detail task-create; do
  echo "Building $entry..."
  MCP_VIEW_ENTRY="$entry" vite build
  # Move the nested output to flat file
  if [ -f "dist/src/$entry/index.html" ]; then
    mv "dist/src/$entry/index.html" "dist/$entry.html"
  fi
done

# Clean up nested src directories
rm -rf dist/src

echo "Build complete. Output:"
ls -la dist/
