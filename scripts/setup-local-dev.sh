#!/bin/bash

set -e

echo "🚀 Setting up LIAM local development environment..."

if [ ! -f .env ]; then
  echo "📝 Creating .env file from template..."
  cp .env.template .env
  echo "✅ Created .env file"
else
  echo "✅ .env file already exists"
fi

echo "📦 Installing dependencies..."
corepack enable
corepack prepare
pnpm install

echo ""
echo "✅ Setup complete! You can now start the development server:"
echo ""
echo "   pnpm dev"
echo ""
echo "🌐 The application will be available at:"
echo "   • Main app: http://localhost:3001"
echo "   • CLI app: http://localhost:5173"
