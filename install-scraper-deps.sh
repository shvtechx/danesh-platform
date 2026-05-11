#!/bin/bash
# Install Web Scraper Dependencies

echo "🔧 Installing web scraper dependencies..."

npm install axios cheerio robots-parser

echo "📦 Installing TypeScript types..."

npm install --save-dev @types/cheerio @types/robots-parser

echo "✅ Installation complete!"
echo ""
echo "Next steps:"
echo "1. Run 'npx prisma generate' to regenerate Prisma client"
echo "2. Navigate to /en/admin/scraper to initialize content sources"
echo "3. Start scraping educational content!"
