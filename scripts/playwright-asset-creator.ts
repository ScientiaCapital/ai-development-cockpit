/**
 * Playwright Asset Creator for Coperniq Instance 388
 *
 * This script automates bulk asset creation in Coperniq using Playwright.
 * Assets cannot be created via API - they require manual UI entry.
 *
 * Usage:
 *   npx ts-node scripts/playwright-asset-creator.ts
 *
 * Prerequisites:
 *   - npm install playwright @playwright/test
 *   - Logged into Coperniq in a browser session (uses existing auth)
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
  coperniqUrl: 'https://app.coperniq.io/388/asset-portfolio',
  assetsDir: path.join(__dirname, 'data/assets'),
  batchSize: 50,          // Assets per batch before pause
  delayBetweenAssets: 3000, // 3 seconds between assets
  delayBetweenBatches: 30000, // 30 seconds between batches
  headless: false,        // Set true to run without browser window
  slowMo: 100,            // Slow down actions for visibility
};

// ============================================================================
// TYPE MAPPINGS: Our JSON types → Coperniq's 42 built-in types
// ============================================================================

const COPERNIQ_TYPE_MAP: Record<string, { category: string; type: string }> = {
  // HVAC - Mechanical
  'Split System AC': { category: 'Mechanical', type: 'Air Conditioner' },
  'Gas Furnace': { category: 'Mechanical', type: 'Boiler' },
  'Heat Pump': { category: 'Mechanical', type: 'Heat Pump' },
  'Mini Split': { category: 'Mechanical', type: 'Air Conditioner' },
  'Thermostat': { category: 'Mechanical', type: 'Thermostat' },
  'Air Handler': { category: 'Mechanical', type: 'Air Handling Unit (AHU)' },
  'Package Unit': { category: 'Mechanical', type: 'Rooftop Unit (RTU)' },
  'PTAC Unit': { category: 'Mechanical', type: 'Air Conditioner' },
  'VRF Outdoor Unit': { category: 'Mechanical', type: 'Heat Pump' },
  'VRF Indoor Unit': { category: 'Mechanical', type: 'Fan' },
  'Water Source Heat Pump': { category: 'Mechanical', type: 'Heat Pump' },
  'Rooftop Unit': { category: 'Mechanical', type: 'Rooftop Unit (RTU)' },
  'Chiller': { category: 'Mechanical', type: 'Chiller' },
  'Cooling Tower': { category: 'Mechanical', type: 'Cooling Tower' },
  'Air Handling Unit': { category: 'Mechanical', type: 'Air Handling Unit (AHU)' },
  'VAV Box': { category: 'Mechanical', type: 'Fan' },
  'Fan Coil Unit': { category: 'Mechanical', type: 'Fan' },
  'Exhaust Fan': { category: 'Mechanical', type: 'Fan' },
  'MAU': { category: 'Mechanical', type: 'Make-Up Air Unit (MAU)' },
  'Boiler': { category: 'Mechanical', type: 'Boiler' },
  'Pump': { category: 'Mechanical', type: 'Pump' },

  // Electrical
  'Panel': { category: 'Electrical', type: 'Panelboard' },
  'Panelboard': { category: 'Electrical', type: 'Panelboard' },
  'Transformer': { category: 'Electrical', type: 'Transformer' },
  'Generator': { category: 'Electrical', type: 'Generator' },
  'UPS': { category: 'Electrical', type: 'Uninterruptible Power Supply (UPS)' },
  'ATS': { category: 'Electrical', type: 'Automatic Transfer Switch (ATS)' },
  'Switchgear': { category: 'Electrical', type: 'Switchgear' },
  'Lighting Panel': { category: 'Electrical', type: 'Lighting Panel' },
  'Breaker': { category: 'Electrical', type: 'Breaker' },
  'Disconnect': { category: 'Electrical', type: 'Disconnect Switch' },
  'Meter': { category: 'Electrical', type: 'Electric Meter' },
  'String Inverter': { category: 'Electrical', type: 'Transformer' },
  'Central Inverter': { category: 'Electrical', type: 'Transformer' },
  'Microinverter': { category: 'Electrical', type: 'Transformer' },
  'Battery Storage': { category: 'Electrical', type: 'Uninterruptible Power Supply (UPS)' },
  'BESS': { category: 'Electrical', type: 'Uninterruptible Power Supply (UPS)' },

  // Plumbing
  'Water Heater': { category: 'Plumbing', type: 'Water Heater' },
  'Tankless Water Heater': { category: 'Plumbing', type: 'Water Heater' },
  'Booster Pump': { category: 'Plumbing', type: 'Booster Pump' },
  'Sump Pump': { category: 'Plumbing', type: 'Sump Pump' },
  'Backflow Preventer': { category: 'Plumbing', type: 'Backflow Preventer' },
  'Water Softener': { category: 'Plumbing', type: 'Water Softener' },
  'Water Filtration': { category: 'Plumbing', type: 'Water Filtration System' },
  'Grease Trap': { category: 'Plumbing', type: 'Grease Interceptor' },
  'Storage Tank': { category: 'Plumbing', type: 'Storage Tank' },
  'PRV': { category: 'Plumbing', type: 'Valve' },
  'Valve': { category: 'Plumbing', type: 'Valve' },

  // Low Voltage
  'Security Camera': { category: 'Low Voltage', type: 'Camera' },
  'Camera': { category: 'Low Voltage', type: 'Camera' },
  'NVR': { category: 'Low Voltage', type: 'Network Video Recorder (NVR)' },
  'Access Control Panel': { category: 'Low Voltage', type: 'Access Controller' },
  'Card Reader': { category: 'Low Voltage', type: 'Card Reader' },
  'Door Strike': { category: 'Low Voltage', type: 'Door Strike' },
  'Maglock': { category: 'Low Voltage', type: 'Maglock' },
  'Network Switch': { category: 'Low Voltage', type: 'Network Switch' },
  'WAP': { category: 'Low Voltage', type: 'Wireless Access Point (WAP)' },
  'BMS Controller': { category: 'Low Voltage', type: 'Automation Controller' },
  'Sensor': { category: 'Low Voltage', type: 'Sensor' },
  'VFD': { category: 'Mechanical', type: 'Variable Frequency Drive (VFD)' },

  // Fire Protection (mapped to closest types + use Labels)
  'Fire Alarm Panel': { category: 'Low Voltage', type: 'Automation Controller' },
  'Sprinkler System': { category: 'Plumbing', type: 'Valve' },
  'Fire Extinguisher': { category: 'Plumbing', type: 'Storage Tank' },
  'Fire Pump': { category: 'Plumbing', type: 'Booster Pump' },
  'Smoke Detector': { category: 'Low Voltage', type: 'Sensor' },
  'Kitchen Hood Suppression': { category: 'Plumbing', type: 'Storage Tank' },

  // Solar (mapped to Electrical types + use Labels)
  'Rooftop PV System': { category: 'Electrical', type: 'Transformer' },
  'Ground Mount PV': { category: 'Electrical', type: 'Transformer' },
  'Solar Carport': { category: 'Electrical', type: 'Transformer' },
  'Utility Scale PV': { category: 'Electrical', type: 'Transformer' },
  'Residential Rooftop PV': { category: 'Electrical', type: 'Transformer' },
  'Commercial Rooftop PV': { category: 'Electrical', type: 'Transformer' },

  // Roofing (mapped to generic types + use Labels)
  'Roof Section': { category: 'Mechanical', type: 'Heat Exchanger' },
  'Gutter System': { category: 'Plumbing', type: 'Valve' },
};

// Labels for trades that don't have dedicated categories
const TRADE_LABELS: Record<string, string[]> = {
  'fire-safety': ['Fire Safety', 'NFPA'],
  'solar': ['Solar', 'Renewable'],
  'roofing': ['Roofing'],
};

// ============================================================================
// ASSET INTERFACE
// ============================================================================

interface Asset {
  id: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  size?: string;
  installDate?: string;
  siteId?: number;
  siteName?: string;
  location?: string;
  [key: string]: unknown;
}

interface AssetFile {
  trade: string;
  count: number;
  residential?: { assets: Asset[] };
  resimercial?: { assets: Asset[] };
  commercial?: { assets: Asset[] };
  industrial?: { assets: Asset[] };
  assets?: Asset[];
  segments?: Record<string, { assets: Asset[] }>;
}

// ============================================================================
// MAIN AUTOMATION CLASS
// ============================================================================

class CoperniqAssetCreator {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private createdCount = 0;
  private errorCount = 0;
  private errors: { asset: string; error: string }[] = [];

  async initialize(): Promise<void> {
    console.log('🚀 Launching browser...');
    this.browser = await chromium.launch({
      headless: CONFIG.headless,
      slowMo: CONFIG.slowMo,
    });

    const context = await this.browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });

    this.page = await context.newPage();

    console.log('📍 Navigating to Coperniq...');
    await this.page.goto(CONFIG.coperniqUrl);
    await this.page.waitForLoadState('networkidle');

    // Check if we need to log in
    const loginButton = await this.page.$('button:has-text("Log in")');
    if (loginButton) {
      console.log('⚠️  Not logged in. Please log in manually...');
      await this.page.waitForURL('**/asset-portfolio', { timeout: 120000 });
    }

    console.log('✅ Ready to create assets');
  }

  async createAsset(asset: Asset, trade: string): Promise<boolean> {
    if (!this.page) throw new Error('Page not initialized');

    try {
      // Click "Asset" button to open creation dialog
      await this.page.click('button:has-text("Asset")');
      await this.page.waitForSelector('text=Create Asset', { timeout: 5000 });

      // Click "Create manually"
      await this.page.click('button:has-text("Create manually")');
      await this.page.waitForSelector('[data-test-id="field-client"]', { timeout: 5000 });

      // Select Client (use siteName or fallback to first available)
      await this.selectDropdownOption('client', asset.siteName || '');
      await this.page.waitForTimeout(500);

      // Select Site (after client is selected)
      await this.selectDropdownOption('site', '');
      await this.page.waitForTimeout(500);

      // Select Type
      const typeMapping = COPERNIQ_TYPE_MAP[asset.type] || { category: 'Mechanical', type: 'Heat Exchanger' };
      await this.selectDropdownOption('type', typeMapping.type);
      await this.page.waitForTimeout(300);

      // Fill Manufacturer
      await this.page.fill('[data-test-id="field-manufacturer"] input', asset.manufacturer);

      // Fill Model
      await this.page.fill('[data-test-id="field-model"] input', asset.model);

      // Fill Serial Number
      await this.page.fill('input[name="serialNumber"]', asset.serialNumber);

      // Fill Size if available
      if (asset.size) {
        const sizeInput = await this.page.$('[data-test-id="field-size"] input');
        if (sizeInput) {
          await sizeInput.fill(asset.size.replace(/[^0-9.]/g, '') || '0');
        }
      }

      // Add Labels for trade identification
      const tradeLabels = TRADE_LABELS[trade];
      if (tradeLabels) {
        await this.addLabels(tradeLabels);
      }

      // Click Create
      await this.page.click('button:has-text("Create"):not([disabled])');

      // Wait for dialog to close
      await this.page.waitForSelector('text=Create Asset', { state: 'hidden', timeout: 10000 });

      this.createdCount++;
      console.log(`  ✅ Created: ${asset.name} (${this.createdCount} total)`);
      return true;

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.errorCount++;
      this.errors.push({ asset: asset.name, error: errorMsg });
      console.log(`  ❌ Failed: ${asset.name} - ${errorMsg}`);

      // Try to close any open dialogs
      try {
        await this.page.click('button:has-text("Cancel")');
      } catch {
        // Ignore if no cancel button
      }

      return false;
    }
  }

  private async selectDropdownOption(field: string, searchText: string): Promise<void> {
    if (!this.page) return;

    // Click the dropdown open button
    await this.page.click(`[data-test-id="field-${field}"] button[aria-label="Open"], [data-test-id="field-${field}"] button:has-text("Open")`);
    await this.page.waitForTimeout(500);

    // If searchText provided, try to find matching option
    if (searchText) {
      const options = await this.page.$$('role=option');
      for (const option of options) {
        const text = await option.textContent();
        if (text?.toLowerCase().includes(searchText.toLowerCase())) {
          await option.click();
          return;
        }
      }
    }

    // Otherwise, select first option
    const firstOption = await this.page.$('role=option');
    if (firstOption) {
      await firstOption.click();
    }
  }

  private async addLabels(labels: string[]): Promise<void> {
    if (!this.page) return;

    try {
      await this.page.click('[data-test-id="field-labels"] button[aria-label="Open"]');
      await this.page.waitForTimeout(300);

      for (const label of labels) {
        // Type label name to search/create
        await this.page.fill('[data-test-id="field-labels"] input', label);
        await this.page.waitForTimeout(300);

        // Try to select existing or create new
        const option = await this.page.$(`role=option:has-text("${label}")`);
        if (option) {
          await option.click();
        }
      }

      // Click away to close dropdown
      await this.page.keyboard.press('Escape');
    } catch {
      // Labels are optional, continue if fails
    }
  }

  async processAssetFile(filename: string): Promise<void> {
    const filePath = path.join(CONFIG.assetsDir, filename);
    console.log(`\n📂 Processing: ${filename}`);

    const data: AssetFile = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const trade = data.trade;

    // Collect all assets from different segments
    const allAssets: Asset[] = [];

    if (data.residential?.assets) allAssets.push(...data.residential.assets);
    if (data.resimercial?.assets) allAssets.push(...data.resimercial.assets);
    if (data.commercial?.assets) allAssets.push(...data.commercial.assets);
    if (data.industrial?.assets) allAssets.push(...data.industrial.assets);
    if (data.assets) allAssets.push(...data.assets);
    if (data.segments) {
      for (const segment of Object.values(data.segments)) {
        if (segment.assets) allAssets.push(...segment.assets);
      }
    }

    console.log(`  Found ${allAssets.length} assets for ${trade}`);

    // Process in batches
    for (let i = 0; i < allAssets.length; i++) {
      const asset = allAssets[i];

      // Batch pause
      if (i > 0 && i % CONFIG.batchSize === 0) {
        console.log(`\n⏸️  Batch complete. Pausing ${CONFIG.delayBetweenBatches / 1000}s...`);
        await new Promise(r => setTimeout(r, CONFIG.delayBetweenBatches));
      }

      await this.createAsset(asset, trade);
      await new Promise(r => setTimeout(r, CONFIG.delayBetweenAssets));
    }
  }

  async processAllAssets(): Promise<void> {
    const files = fs.readdirSync(CONFIG.assetsDir).filter(f => f.endsWith('.json'));

    console.log(`\n📊 Found ${files.length} asset files to process`);

    for (const file of files) {
      await this.processAssetFile(file);
    }

    this.printSummary();
  }

  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 ASSET CREATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Created: ${this.createdCount}`);
    console.log(`❌ Failed:  ${this.errorCount}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      for (const { asset, error } of this.errors.slice(0, 10)) {
        console.log(`  - ${asset}: ${error}`);
      }
      if (this.errors.length > 10) {
        console.log(`  ... and ${this.errors.length - 10} more`);
      }
    }

    console.log('='.repeat(60));
  }

  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  const creator = new CoperniqAssetCreator();

  try {
    await creator.initialize();
    await creator.processAllAssets();
  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await creator.cleanup();
  }
}

// Run if executed directly
main().catch(console.error);

export { CoperniqAssetCreator, CONFIG, COPERNIQ_TYPE_MAP };
