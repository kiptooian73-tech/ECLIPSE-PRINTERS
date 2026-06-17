#!/bin/bash
# Quick start script for RubberStamp Shop

set -e

echo "🏪 RubberStamp Shop - Quick Start"
echo "=================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Install from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install
echo "✅ Dependencies installed"
echo ""

# Setup .env
if [ ! -f .env ]; then
    echo "⚙️  Setting up .env file..."
    cp .env.example .env
    echo "✅ Created .env (edit with your details)"
else
    echo "✅ .env already configured"
fi

echo ""
echo "🚀 Starting server..."
echo "📍 Open http://localhost:3000 in your browser"
echo ""

npm start
