#!/bin/bash

# 1. Run the Architect to fix file structure BEFORE anything else
echo "🏗️  Running System Architect..."
python3 system_architect.py

# 2. Run the Mass Ingestion Protocol (if you want to scrape/update)
# Uncomment the line below if you want it to run on every save (might be slow)
# echo "🚀 Updating Data Skeleton..."
# python3 backend/mass_ingest_protocol.py

# 3. Validation Check
if [ -d "frontend/public/data/product_images/brand_gen_1" ]; then
    echo "❌ WARNING: Garbage Generated Images Detected!"
else
    echo "✨ Asset Library Clean."
fi

echo "✅ System Optimized. Ready for Development."
