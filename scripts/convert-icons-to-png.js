#!/usr/bin/env node

/**
 * Convert SVG icons to PNG format for better PWA compatibility
 * This script creates simple placeholder PNG icons using Canvas API (if available)
 * For production, use proper tools like ImageMagick, Sharp, or online converters
 */

const fs = require('fs')
const path = require('path')

// Create basic placeholder PNG data (1x1 transparent pixel)
function createPlaceholderPNG() {
  // Minimal PNG header for a 1x1 transparent pixel
  const pngData = Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
    0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x01, // Width: 1
    0x00, 0x00, 0x00, 0x01, // Height: 1
    0x08, 0x06, 0x00, 0x00, 0x00, // Bit depth: 8, Color type: 6 (RGBA), Compression: 0, Filter: 0, Interlace: 0
    0x1F, 0x15, 0xC4, 0x89, // CRC
    0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
    0x49, 0x44, 0x41, 0x54, // IDAT
    0x78, 0x9C, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01, // Compressed image data
    0xE2, 0x21, 0xBC, 0x33, // CRC
    0x00, 0x00, 0x00, 0x00, // IEND chunk length
    0x49, 0x45, 0x4E, 0x44, // IEND
    0xAE, 0x42, 0x60, 0x82  // CRC
  ])
  return pngData
}

function convertIcons() {
  const publicDir = path.join(__dirname, '..', 'public')
  const iconSizes = [192, 256, 384, 512]
  
  // Create placeholder PNG icons
  const placeholderPNG = createPlaceholderPNG()
  
  iconSizes.forEach(size => {
    // AI Dev Cockpit theme
    const swaggyPngPath = path.join(publicDir, 'icons', 'arcade', `icon-${size}x${size}.png`)
    fs.writeFileSync(swaggyPngPath, placeholderPNG)
    
    // Enterprise theme
    const enterprisePngPath = path.join(publicDir, 'icons', 'enterprise', `icon-${size}x${size}.png`)
    fs.writeFileSync(enterprisePngPath, placeholderPNG)
    
    console.log(`✅ Created placeholder PNG icons for ${size}x${size}`)
  })
  
  // Create favicon.ico and apple-touch-icon.png
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), placeholderPNG)
  
  console.log('📝 Created placeholder PNG icons.')
  console.log('🎨 For production, replace these with proper conversions using:')
  console.log('   - ImageMagick: convert icon.svg -resize 192x192 icon-192x192.png')
  console.log('   - Sharp (Node.js): sharp("icon.svg").resize(192, 192).png().toFile("icon-192x192.png")')
  console.log('   - Online tools: CloudConvert, SVGPNG.com, or similar')
}

// Create a proper PWA test script
function createPWATestScript() {
  const testScript = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PWA Test</title>
    <link rel="manifest" href="/api/manifest?theme=terminal">
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 20px;
            background: #000;
            color: #00ff00;
        }
        .test-section {
            margin: 20px 0;
            padding: 15px;
            border: 1px solid #00ff00;
            border-radius: 5px;
        }
        button {
            background: #00ff00;
            color: #000;
            border: none;
            padding: 10px 20px;
            margin: 5px;
            cursor: pointer;
            border-radius: 3px;
        }
        .result {
            margin: 10px 0;
            padding: 10px;
            background: #001100;
            border-left: 3px solid #00ff00;
        }
    </style>
</head>
<body>
    <h1>🚀 PWA Test Dashboard</h1>
    
    <div class="test-section">
        <h2>Service Worker Status</h2>
        <div id="sw-status" class="result">Checking...</div>
        <button onclick="checkServiceWorker()">Check Service Worker</button>
    </div>
    
    <div class="test-section">
        <h2>Manifest Test</h2>
        <div id="manifest-status" class="result">Checking...</div>
        <button onclick="checkManifest()">Check Manifest</button>
    </div>
    
    <div class="test-section">
        <h2>Install Prompt</h2>
        <div id="install-status" class="result">Waiting for prompt...</div>
        <button onclick="testInstall()">Test Install</button>
    </div>
    
    <div class="test-section">
        <h2>Background Sync</h2>
        <div id="sync-status" class="result">Ready to test</div>
        <button onclick="testBackgroundSync()">Test Background Sync</button>
    </div>

    <script>
        async function checkServiceWorker() {
            const status = document.getElementById('sw-status');
            if ('serviceWorker' in navigator) {
                try {
                    const registration = await navigator.serviceWorker.getRegistration();
                    if (registration) {
                        status.innerHTML = \`✅ Service Worker active: \${registration.scope}\`;
                    } else {
                        status.innerHTML = '❌ Service Worker not registered';
                    }
                } catch (error) {
                    status.innerHTML = \`❌ Error: \${error.message}\`;
                }
            } else {
                status.innerHTML = '❌ Service Worker not supported';
            }
        }
        
        async function checkManifest() {
            const status = document.getElementById('manifest-status');
            try {
                const response = await fetch('/api/manifest?theme=terminal');
                const manifest = await response.json();
                status.innerHTML = \`✅ Manifest loaded: \${manifest.name}\`;
            } catch (error) {
                status.innerHTML = \`❌ Manifest error: \${error.message}\`;
            }
        }
        
        function testInstall() {
            const status = document.getElementById('install-status');
            if (window.deferredPrompt) {
                window.deferredPrompt.prompt();
                status.innerHTML = '🔄 Install prompt shown';
            } else {
                status.innerHTML = '⏳ No install prompt available (may already be installed)';
            }
        }
        
        async function testBackgroundSync() {
            const status = document.getElementById('sync-status');
            if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
                try {
                    const registration = await navigator.serviceWorker.ready;
                    await registration.sync.register('test-sync');
                    status.innerHTML = '✅ Background sync registered';
                } catch (error) {
                    status.innerHTML = \`❌ Sync error: \${error.message}\`;
                }
            } else {
                status.innerHTML = '❌ Background sync not supported';
            }
        }
        
        // Auto-run checks on page load
        window.addEventListener('load', () => {
            checkServiceWorker();
            checkManifest();
        });
        
        // Listen for beforeinstallprompt
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window.deferredPrompt = e;
            document.getElementById('install-status').innerHTML = '✅ Install prompt ready';
        });
    </script>
</body>
</html>`

  const testPath = path.join(__dirname, '..', 'public', 'pwa-test.html')
  fs.writeFileSync(testPath, testScript)
  console.log('🧪 Created PWA test page at /pwa-test.html')
}

// Run the conversion
convertIcons()
createPWATestScript()

console.log('\n🎉 PWA setup complete!')
console.log('📱 Test your PWA at: http://localhost:3001/pwa-test.html')
console.log('🔍 Check these URLs:')
console.log('   - Terminal manifest: http://localhost:3001/api/manifest?theme=terminal')
console.log('   - Corporate manifest: http://localhost:3001/api/manifest?theme=corporate') 
console.log('   - Offline page: http://localhost:3001/offline')
console.log('   - Service worker: http://localhost:3001/sw.js')