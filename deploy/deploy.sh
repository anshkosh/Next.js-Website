#!/bin/bash
set -e

echo "Starting deployment process..."

# Navigate to app directory
cd /var/www/anshkosh || exit 1

# Pull latest changes
echo "Pulling from git..."
git pull origin main

# Install dependencies
echo "Installing dependencies..."
npm ci

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

# Build the application
echo "Building Next.js application..."
npm run build

# Restart PM2 processes
echo "Restarting PM2 processes..."
pm2 reload ecosystem.config.js

echo "Deployment complete! 🚀"
