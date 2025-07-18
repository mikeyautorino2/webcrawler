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

# Build frontend
echo "🏗️ Building frontend..."
npm run build
cd ..

echo "✅ Build completed successfully!"
