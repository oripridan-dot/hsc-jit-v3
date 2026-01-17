#!/bin/bash
# HSC-JIT V3.7 Development Environment Startup

echo "🚀 Starting HSC-JIT V3.7 Development Environment..."

# Start Redis
echo "📦 Starting Redis server..."
sudo service redis-server start

# Check Redis status
if sudo service redis-server status > /dev/null 2>&1; then
    echo "✅ Redis is running"
else
    echo "⚠️  Redis failed to start - check logs with: sudo service redis-server status"
fi

echo ""
echo "✅ Environment ready!"
echo ""
echo "📚 Quick Start Guide:"
echo "   → See docs/getting-started/quick-start.md"
echo ""
echo "🧪 Test the system:"
echo "   cd backend && python test_hierarchy.py"
echo ""
echo "🚀 Run the pipeline:"
echo "   cd backend && python orchestrate_brand.py --brand roland --max-products 50"
echo ""
