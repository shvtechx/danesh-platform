# Install Web Scraper Dependencies (Windows PowerShell)

Write-Host "🔧 Installing web scraper dependencies..." -ForegroundColor Cyan

npm install axios cheerio robots-parser

Write-Host "📦 Installing TypeScript types..." -ForegroundColor Cyan

npm install --save-dev @types/cheerio @types/robots-parser

Write-Host "✅ Installation complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run 'npx prisma generate' to regenerate Prisma client"
Write-Host "2. Navigate to /en/admin/scraper to initialize content sources"
Write-Host "3. Start scraping educational content!"
