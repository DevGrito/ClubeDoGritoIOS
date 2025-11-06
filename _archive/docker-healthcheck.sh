#!/bin/sh

# Simple health check for Docker container
# Tests if the application is responding

# Check if the application is responding on port 5000
curl -f http://localhost:5000/api/health 2>/dev/null || curl -f http://localhost:5000/ 2>/dev/null || exit 1