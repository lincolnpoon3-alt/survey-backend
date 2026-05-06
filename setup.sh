#!/bin/bash

# Quick Start Script for Customer Survey System

echo "🚀 Customer Survey System - Quick Setup"
echo "========================================"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed"
echo ""

# Check for .env file
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Copying from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "📝 IMPORTANT: Edit .env and configure:"
    echo "   - FEISHU_ACCESS_TOKEN (required for Feishu integration)"
    echo "   - SMTP credentials (optional, for email sending)"
    echo ""
fi

# Create public directory if needed
if [ ! -d public ]; then
    echo "📁 Creating public directory..."
    mkdir -p public
    if [ -f index.html ]; then
        mv index.html public/
    fi
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Edit .env file with your Feishu access token"
echo "   2. (Optional) Configure SMTP settings for email sending"
echo "   3. Run: npm start"
echo "   4. Open: http://localhost:3000"
echo ""
echo "📖 For detailed instructions, see README.md"
echo ""
