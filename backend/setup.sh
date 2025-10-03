#!/bin/bash

# Product Management API Backend Setup Script

echo "🚀 Setting up Product Management API Backend..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file from template..."
    cp config.env.template .env
    echo "✅ .env file created successfully!"
    echo "📋 Please review and update the .env file with your configuration."
else
    echo "✅ .env file already exists."
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📚 Next steps:"
echo "1. Review and update the .env file if needed"
echo "2. Start the infrastructure services:"
echo "   cd .. && docker-compose up -d postgres redis zookeeper kafka localstack"
echo "3. Start the API server:"
echo "   npm run dev (for development)"
echo "   npm start (for production)"
echo ""
echo "🔗 API will be available at: http://localhost:3001"
echo "📖 Health check: http://localhost:3001/health"
echo "📋 API documentation: See ../docs/openapi.yaml"
echo ""
