# setup-vibemaster.ps1
# Run with: .\setup-vibemaster.ps1

Write-Host "🚀 Setting up VibeMaster Studio..." -ForegroundColor Cyan

# Create folders
Write-Host "📁 Creating folder structure..." -ForegroundColor Yellow
$folders = @(
    "assets\images",
    "assets\icons", 
    "assets\fonts",
    "css",
    "js",
    "docs",
    "examples",
    "server",
    ".vscode"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
    Write-Host "  ✓ Created $folder" -ForegroundColor Green
}

# Create .gitignore
Write-Host "📝 Creating .gitignore..." -ForegroundColor Yellow
@"
# Dependencies
node_modules/
npm-debug.log

# Environment variables
.env
.env.local

# OS files
.DS_Store
Thumbs.db

# IDE files
.vscode/*
!.vscode/settings.json
!.vscode/extensions.json
.idea/

# Build files
dist/
build/

# Temporary files
*.tmp
*.log
.cache/

# API keys
*-api-key.txt
secrets/
"@ | Out-File -FilePath ".gitignore" -Encoding UTF8

# Create VS Code settings
Write-Host "⚙️  Creating VS Code settings..." -ForegroundColor Yellow
@"
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "files.autoSave": "onFocusChange",
  "liveServer.settings.port": 5500,
  "liveServer.settings.CustomBrowser": "chrome",
  "html.format.indentInnerHtml": true,
  "css.validate": true,
  "javascript.validate.enable": true
}
"@ | Out-File -FilePath ".vscode\settings.json" -Encoding UTF8

# Create README
Write-Host "📄 Creating README.md..." -ForegroundColor Yellow
@"
# 🎙️ VibeMaster Studio

Voice-driven game content creation tool.

## Quick Start

1. Open index.html in a browser
2. Click "Record Voice"
3. Describe your game scene
4. Export JSON

## Development

Open in VS Code and use Live Server extension.

## Documentation

See /docs folder for complete documentation.
"@ | Out-File -FilePath "README.md" -Encoding UTF8

# Create package.json
Write-Host "📦 Creating package.json..." -ForegroundColor Yellow
@"
{
  "name": "vibemaster-studio",
  "version": "1.0.0",
  "description": "Voice-driven game content creation tool",
  "main": "index.html",
  "scripts": {
    "start": "live-server --port=5500"
  },
  "keywords": ["gamedev", "voice", "ai", "decentraland"],
  "author": "Your Name",
  "license": "MIT"
}
"@ | Out-File -FilePath "package.json" -Encoding UTF8

# Initialize Git
Write-Host "🔧 Initializing Git..." -ForegroundColor Yellow
git init | Out-Null
git add . | Out-Null
git commit -m "Initial VibeMaster Studio setup" | Out-Null

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Copy your vibemaster-studio.html to index.html"
Write-Host "  2. Run: code ." -ForegroundColor Yellow
Write-Host "  3. Install Live Server extension in VS Code"
Write-Host "  4. Right-click index.html → 'Open with Live Server'"
Write-Host ""