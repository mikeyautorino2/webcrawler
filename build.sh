#!/bin/bash

# Build script for Vercel deployment

echo "🔨 Starting build process..."

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client
npm install

# Build frontend with CI=false to prevent warnings being treated as errors
echo "🏗️ Building frontend..."
CI=false npm run build
cd ..

echo "✅ Build completed successfully!"
