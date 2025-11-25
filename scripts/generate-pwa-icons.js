#!/usr/bin/env node

/**
 * PWA Icon Generator for Dual-Theme Platform
 * Creates basic SVG icons for AI Dev Cockpit (terminal) and Enterprise (corporate) themes
 */

const fs = require('fs')
const path = require('path')

// Icon sizes to generate
const iconSizes = [192, 256, 384, 512]

// Terminal theme SVG (AI Dev Cockpit)
const createTerminalIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#000000"/>
  <rect x="${size * 0.1}" y="${size * 0.1}" width="${size * 0.8}" height="${size * 0.8}" 
        fill="none" stroke="#00ff00" stroke-width="${size * 0.02}" rx="${size * 0.05}"/>
  
  <!-- Terminal prompt symbol -->
  <text x="${size * 0.2}" y="${size * 0.4}" 
        font-family="monospace" 
        font-size="${size * 0.15}" 
        fill="#00ff00" 
        font-weight="bold">$</text>
  
  <!-- Cursor -->
  <rect x="${size * 0.3}" y="${size * 0.32}" 
        width="${size * 0.03}" 
        height="${size * 0.15}" 
        fill="#00ff00">
    <animate attributeName="opacity" 
             values="1;0;1" 
             dur="1s" 
             repeatCount="indefinite"/>
  </rect>
  
  <!-- Code brackets -->
  <text x="${size * 0.4}" y="${size * 0.65}" 
        font-family="monospace" 
        font-size="${size * 0.12}" 
        fill="#00ff00">&lt;/&gt;</text>
</svg>`

// Corporate theme SVG (Enterprise)
const createCorporateIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="corpGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#6366F1;stop-opacity:1" />
    </linearGradient>
  </defs>
  
  <rect width="${size}" height="${size}" fill="url(#corpGrad)"/>
  
  <!-- Chart bars -->
  <rect x="${size * 0.2}" y="${size * 0.6}" width="${size * 0.08}" height="${size * 0.25}" fill="white" opacity="0.9"/>
  <rect x="${size * 0.35}" y="${size * 0.45}" width="${size * 0.08}" height="${size * 0.4}" fill="white" opacity="0.9"/>
  <rect x="${size * 0.5}" y="${size * 0.3}" width="${size * 0.08}" height="${size * 0.55}" fill="white" opacity="0.9"/>
  <rect x="${size * 0.65}" y="${size * 0.4}" width="${size * 0.08}" height="${size * 0.45}" fill="white" opacity="0.9"/>
  
  <!-- Arrow trending up -->
  <path d="M ${size * 0.15} ${size * 0.7} L ${size * 0.8} ${size * 0.2} L ${size * 0.75} ${size * 0.25} L ${size * 0.8} ${size * 0.2} L ${size * 0.75} ${size * 0.15}" 
        stroke="white" 
        stroke-width="${size * 0.015}" 
        fill="none" 
        stroke-linecap="round"/>
  
  <!-- Dollar sign -->
  <text x="${size * 0.1}" y="${size * 0.25}" 
        font-family="Arial, sans-serif" 
        font-size="${size * 0.12}" 
        fill="white" 
        font-weight="bold">$</text>
</svg>`

// Convert SVG to different formats and save
function generateIcons() {
  const publicDir = path.join(__dirname, '..', 'public')
  
  // Create directories if they don't exist
  const swaggyDir = path.join(publicDir, 'icons', 'arcade')
  const enterpriseDir = path.join(publicDir, 'icons', 'enterprise')
  
  if (!fs.existsSync(swaggyDir)) {
    fs.mkdirSync(swaggyDir, { recursive: true })
  }
  
  if (!fs.existsSync(enterpriseDir)) {
    fs.mkdirSync(enterpriseDir, { recursive: true })
  }

  // Generate icons for each size
  iconSizes.forEach(size => {
    // Terminal theme icons
    const terminalSvg = createTerminalIcon(size)
    fs.writeFileSync(
      path.join(swaggyDir, `icon-${size}x${size}.svg`),
      terminalSvg
    )
    
    // Corporate theme icons  
    const corporateSvg = createCorporateIcon(size)
    fs.writeFileSync(
      path.join(enterpriseDir, `icon-${size}x${size}.svg`),
      corporateSvg
    )
    
    console.log(`✅ Generated ${size}x${size} icons for both themes`)
  })

  // Generate favicon.ico equivalent
  const faviconSvg = createTerminalIcon(32)
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), faviconSvg)
  
  // Generate Apple touch icons
  const appleTouchIcon = createTerminalIcon(180)
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), appleTouchIcon)
  
  console.log('🎉 PWA icons generated successfully!')
  console.log('📱 Terminal theme (AI Dev Cockpit): Black background with green terminal elements')
  console.log('🏢 Corporate theme (Enterprise): Purple gradient with white chart elements')
  console.log('\n📋 Next steps:')
  console.log('1. Convert SVG icons to PNG format for better browser support')
  console.log('2. Optimize icons with tools like ImageOptim or TinyPNG')
  console.log('3. Test PWA installation on mobile devices')
  console.log('4. Verify icons appear correctly in app drawer/home screen')
}

// Run the generator
generateIcons()