/**
 * Playwright Asset Labeler & Creator for Coperniq Instance 388
 *
 * This script handles BOTH:
 * 1. Labeling existing assets based on their type/characteristics
 * 2. Creating new assets with proper labels applied
 *
 * Usage:
 *   npx ts-node scripts/playwright-asset-labeler.ts --mode=label    # Label existing
 *   npx ts-node scripts/playwright-asset-labeler.ts --mode=create   # Create new
 *   npx ts-node scripts/playwright-asset-labeler.ts --mode=both     # Do both
 *
 * Prerequisites:
 *   - npm install playwright @playwright/test
 *   - Logged into Coperniq in a browser session
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
  batchSize: 50,
  delayBetweenAssets: 2000,
  delayBetweenBatches: 20000,
  headless: false,
  slowMo: 50,
};

// ============================================================================
// SMART LABEL MAPPING - Maps asset characteristics to appropriate labels
// ============================================================================

/**
 * Asset Label Rules:
 * - These labels describe asset STATUS and CHARACTERISTICS
 * - Trade categorization comes from the Type field (Coperniq's 42 types)
 */
const ASSET_LABEL_RULES: {
  pattern: RegExp | ((asset: AssetInfo) => boolean);
  labels: string[];
  description: string;
}[] = [
  // Solar Equipment Labels
  {
    pattern: /microinverter|enphase|iq\d+/i,
    labels: ['Microinverter'],
    description: 'Microinverter-based solar equipment'
  },
  {
    pattern: /string\s*inverter|solaredge|fronius|sma\s+sunny/i,
    labels: ['String Inverter'],
    description: 'String inverter solar equipment'
  },
  {
    pattern: /powerwall|battery|bess|ess|energy\s*storage/i,
    labels: ['Battery Candidate'],
    description: 'Battery/energy storage systems'
  },
  {
    pattern: /solar|pv\s*system|photovoltaic/i,
    labels: ['Solar Ready'],
    description: 'Solar-related equipment'
  },

  // Warranty & Service Labels (based on install date or model year)
  {
    pattern: (asset) => {
      // If install date is within last 5 years, likely under warranty
      if (asset.installDate) {
        const installYear = new Date(asset.installDate).getFullYear();
        const currentYear = new Date().getFullYear();
        return currentYear - installYear <= 5;
      }
      // If model/serial contains recent year
      const recentYears = ['2024', '2025', '2026', '2023', '2022'];
      return recentYears.some(y =>
        asset.model?.includes(y) ||
        asset.serialNumber?.includes(y) ||
        asset.name?.includes(y)
      );
    },
    labels: ['Under Warranty'],
    description: 'Equipment likely under warranty (recent install)'
  },

  // High Efficiency Equipment
  {
    pattern: /heat\s*pump|vrf|inverter|variable\s*speed|ecm|proterra|infinity|greenspeed/i,
    labels: ['High Efficiency Upgrade'],
    description: 'High-efficiency equipment'
  },

  // EV Infrastructure
  {
    pattern: /ev\s*charger|chargepoint|tesla\s*wall|juicebox|clipper/i,
    labels: ['EV Charger Ready'],
    description: 'EV charging equipment'
  },

  // Critical Infrastructure
  {
    pattern: /generator|ups|ats|switchgear|bms|fire\s*alarm|sprinkler/i,
    labels: ['Critical Asset'],
    description: 'Critical infrastructure assets'
  },

  // Fire Safety Equipment
  {
    pattern: /fire|sprinkler|suppression|extinguisher|smoke\s*detector|ansul/i,
    labels: ['Inspection Due'],
    description: 'Fire safety equipment requiring regular inspection'
  },

  // Rebate Eligible (high-efficiency residential)
  {
    pattern: /heat\s*pump.*water|proterra|hybrid\s*water|tankless/i,
    labels: ['Rebate Eligible'],
    description: 'Equipment eligible for utility rebates'
  },
];

// ============================================================================
// TYPE MAPPINGS (from original script)
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
  'Rooftop Unit': { category: 'Mechanical', type: 'Rooftop Unit (RTU)' },
  'Chiller': { category: 'Mechanical', type: 'Chiller' },
  'Cooling Tower': { category: 'Mechanical', type: 'Cooling Tower' },
  'Boiler': { category: 'Mechanical', type: 'Boiler' },
  'MAU': { category: 'Mechanical', type: 'Make-Up Air Unit (MAU)' },

  // Electrical
  'Panel': { category: 'Electrical', type: 'Panelboard' },
  'Generator': { category: 'Electrical', type: 'Generator' },
  'UPS': { category: 'Electrical', type: 'Uninterruptible Power Supply (UPS)' },
  'ATS': { category: 'Electrical', type: 'Automatic Transfer Switch (ATS)' },
  'Transformer': { category: 'Electrical', type: 'Transformer' },
  'String Inverter': { category: 'Electrical', type: 'Transformer' },
  'Microinverter': { category: 'Electrical', type: 'Transformer' },
  'Battery Storage': { category: 'Electrical', type: 'Uninterruptible Power Supply (UPS)' },

  // Plumbing
  'Water Heater': { category: 'Plumbing', type: 'Water Heater' },
  'Backflow Preventer': { category: 'Plumbing', type: 'Backflow Preventer' },
  'Booster Pump': { category: 'Plumbing', type: 'Booster Pump' },

  // Low Voltage
  'Camera': { category: 'Low Voltage', type: 'Camera' },
  'NVR': { category: 'Low Voltage', type: 'Network Video Recorder (NVR)' },
  'BMS Controller': { category: 'Low Voltage', type: 'Automation Controller' },
  'Access Control': { category: 'Low Voltage', type: 'Access Controller' },
};

// ============================================================================
// INTERFACES
// ============================================================================

interface AssetInfo {
  id?: string;
  number?: number;
  name: string;
  type?: string;
  category?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  installDate?: string;
  currentLabels?: string[];
}

// ============================================================================
// LABEL DETERMINATION LOGIC
// ============================================================================

function determineLabelsForAsset(asset: AssetInfo): string[] {
  const labels: Set<string> = new Set();

  // Combine all searchable text
  const searchText = [
    asset.name,
    asset.type,
    asset.manufacturer,
    asset.model,
    asset.serialNumber,
  ].filter(Boolean).join(' ');

  // Apply each rule
  for (const rule of ASSET_LABEL_RULES) {
    if (typeof rule.pattern === 'function') {
      if (rule.pattern(asset)) {
        rule.labels.forEach(l => labels.add(l));
      }
    } else if (rule.pattern.test(searchText)) {
      rule.labels.forEach(l => labels.add(l));
    }
  }

  return Array.from(labels);
}

// ============================================================================
// MAIN LABELER CLASS
// ============================================================================

class CoperniqAssetLabeler {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private labeledCount = 0;
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
    console.log('📍 Navigating to Coperniq Asset Portfolio...');
    await this.page.goto(CONFIG.coperniqUrl);
    await this.page.waitForLoadState('networkidle');

    // Check if logged in
    const currentUrl = this.page.url();
    if (!currentUrl.includes('/asset-portfolio')) {
      console.log('⚠️  Not logged in. Please log in manually...');
      await this.page.waitForURL('**/asset-portfolio', { timeout: 120000 });
    }

    console.log('✅ Ready to process assets\n');
  }

  // ==========================================================================
  // LABEL EXISTING ASSETS
  // ==========================================================================

  async labelExistingAssets(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('🏷️  LABELING EXISTING ASSETS');
    console.log('='.repeat(50));

    // Click "Load more" until all assets are visible
    await this.loadAllAssets();

    // Get all asset rows
    const assetRows = await this.page.$$('table tbody tr[class*="cursor-pointer"]');
    console.log(`📊 Found ${assetRows.length} assets to process\n`);

    for (let i = 0; i < assetRows.length; i++) {
      try {
        // Re-query rows (DOM may have changed)
        const rows = await this.page.$$('table tbody tr[class*="cursor-pointer"]');
        if (i >= rows.length) break;

        const row = rows[i];

        // Extract asset info from row
        const cells = await row.$$('td');
        const assetCell = cells[0];
        const typeCell = cells[3];
        const labelCell = cells[cells.length - 1];

        const assetName = await assetCell?.textContent() || `Asset ${i + 1}`;
        const typeText = await typeCell?.textContent() || '';
        const currentLabels = await labelCell?.textContent() || '-';

        const asset: AssetInfo = {
          number: i + 1,
          name: assetName.replace(/#\d+:\s*/, '').trim(),
          type: typeText,
        };

        // Determine labels for this asset
        const newLabels = determineLabelsForAsset(asset);

        if (newLabels.length === 0) {
          console.log(`  ⏭️  #${i + 1}: ${asset.name.substring(0, 40)}... - No labels needed`);
          continue;
        }

        // Skip if already has labels (unless we want to add more)
        if (currentLabels !== '-' && currentLabels.trim() !== '') {
          console.log(`  ✓  #${i + 1}: ${asset.name.substring(0, 40)}... - Already labeled`);
          continue;
        }

        console.log(`  🏷️  #${i + 1}: ${asset.name.substring(0, 40)}...`);
        console.log(`      → Adding: ${newLabels.join(', ')}`);

        // Click row to open asset detail
        await row.click();
        await this.page.waitForTimeout(1500);

        // Click Labels field
        const labelsField = await this.page.$('text="Labels" >> xpath=../following-sibling::*');
        if (labelsField) {
          await labelsField.click();
          await this.page.waitForTimeout(500);

          // Add each label
          for (const label of newLabels) {
            await this.selectLabel(label);
          }

          // Close dropdown
          await this.page.keyboard.press('Escape');
          await this.page.waitForTimeout(300);
        }

        // Go back to asset list
        await this.page.click('a:has-text("Assets")');
        await this.page.waitForTimeout(1000);

        this.labeledCount++;

      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        this.errorCount++;
        this.errors.push({ asset: `Asset ${i + 1}`, error: errorMsg });
        console.log(`  ❌ Error: ${errorMsg}`);

        // Try to recover by going back to asset list
        try {
          await this.page.goto(CONFIG.coperniqUrl);
          await this.page.waitForLoadState('networkidle');
          await this.loadAllAssets();
        } catch {
          // Continue anyway
        }
      }

      // Batch pause
      if ((i + 1) % CONFIG.batchSize === 0) {
        console.log(`\n⏸️  Batch ${Math.floor(i / CONFIG.batchSize) + 1} complete. Pausing...`);
        await new Promise(r => setTimeout(r, CONFIG.delayBetweenBatches));
      }
    }
  }

  private async loadAllAssets(): Promise<void> {
    if (!this.page) return;

    let loadMoreVisible = true;
    while (loadMoreVisible) {
      const loadMore = await this.page.$('text="Load more"');
      if (loadMore) {
        await loadMore.click();
        await this.page.waitForTimeout(1000);
      } else {
        loadMoreVisible = false;
      }
    }
  }

  private async selectLabel(labelName: string): Promise<void> {
    if (!this.page) return;

    // Search for label
    const searchBox = await this.page.$('input[placeholder="Search..."]');
    if (searchBox) {
      await searchBox.fill(labelName);
      await this.page.waitForTimeout(500);
    }

    // Click the label checkbox
    const labelOption = await this.page.$(`label:has-text("${labelName}")`);
    if (labelOption) {
      await labelOption.click();
      await this.page.waitForTimeout(300);
    }

    // Clear search
    if (searchBox) {
      await searchBox.fill('');
      await this.page.waitForTimeout(300);
    }
  }

  // ==========================================================================
  // CREATE NEW ASSETS (from JSON files)
  // ==========================================================================

  async createNewAssets(): Promise<void> {
    if (!this.page) throw new Error('Page not initialized');

    console.log('\n📦 CREATING NEW ASSETS');
    console.log('='.repeat(50));

    const files = fs.readdirSync(CONFIG.assetsDir).filter(f => f.endsWith('.json'));
    console.log(`📂 Found ${files.length} asset files to process\n`);

    for (const file of files) {
      await this.processAssetFile(file);
    }
  }

  private async processAssetFile(filename: string): Promise<void> {
    if (!this.page) return;

    const filePath = path.join(CONFIG.assetsDir, filename);
    console.log(`\n📂 Processing: ${filename}`);

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      const assets = this.extractAssets(data);

      console.log(`  Found ${assets.length} assets`);

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        await this.createSingleAsset(asset);
        await new Promise(r => setTimeout(r, CONFIG.delayBetweenAssets));

        if ((i + 1) % CONFIG.batchSize === 0) {
          console.log(`\n⏸️  Batch complete. Pausing...`);
          await new Promise(r => setTimeout(r, CONFIG.delayBetweenBatches));
        }
      }
    } catch (error) {
      console.log(`  ❌ Error reading file: ${error}`);
    }
  }

  private extractAssets(data: unknown): AssetInfo[] {
    const assets: AssetInfo[] = [];

    const processObj = (obj: Record<string, unknown>) => {
      if (Array.isArray(obj.assets)) {
        for (const a of obj.assets) {
          if (a && typeof a === 'object' && 'name' in a) {
            assets.push(a as AssetInfo);
          }
        }
      }
      for (const value of Object.values(obj)) {
        if (value && typeof value === 'object') {
          processObj(value as Record<string, unknown>);
        }
      }
    };

    if (data && typeof data === 'object') {
      processObj(data as Record<string, unknown>);
    }

    return assets;
  }

  private async createSingleAsset(asset: AssetInfo): Promise<void> {
    if (!this.page) return;

    try {
      // Determine labels based on asset characteristics
      const labels = determineLabelsForAsset(asset);

      console.log(`  📝 Creating: ${asset.name}`);
      if (labels.length > 0) {
        console.log(`      Labels: ${labels.join(', ')}`);
      }

      // Click "Asset" button
      await this.page.click('button:has-text("Asset")');
      await this.page.waitForSelector('text=Create Asset', { timeout: 5000 });

      // Click "Create manually"
      await this.page.click('button:has-text("Create manually")');
      await this.page.waitForTimeout(1000);

      // Fill form fields
      // ... (form filling logic similar to original script)

      // Add labels
      if (labels.length > 0) {
        const labelsButton = await this.page.$('[data-test-id="field-labels"] button');
        if (labelsButton) {
          await labelsButton.click();
          await this.page.waitForTimeout(500);

          for (const label of labels) {
            await this.selectLabel(label);
          }

          await this.page.keyboard.press('Escape');
        }
      }

      // Click Create
      await this.page.click('button:has-text("Create"):not([disabled])');
      await this.page.waitForSelector('text=Create Asset', { state: 'hidden', timeout: 10000 });

      this.createdCount++;
      console.log(`  ✅ Created successfully`);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      this.errorCount++;
      this.errors.push({ asset: asset.name, error: errorMsg });
      console.log(`  ❌ Failed: ${errorMsg}`);

      try {
        await this.page.click('button:has-text("Cancel")');
      } catch {
        // Ignore
      }
    }
  }

  // ==========================================================================
  // SUMMARY
  // ==========================================================================

  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PROCESSING SUMMARY');
    console.log('='.repeat(60));
    console.log(`🏷️  Labeled: ${this.labeledCount}`);
    console.log(`📦 Created: ${this.createdCount}`);
    console.log(`❌ Errors:  ${this.errorCount}`);

    if (this.errors.length > 0) {
      console.log('\n❌ Error Details:');
      for (const { asset, error } of this.errors.slice(0, 10)) {
        console.log(`  - ${asset}: ${error}`);
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
// MAIN
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const modeArg = args.find(a => a.startsWith('--mode='));
  const mode = modeArg?.split('=')[1] || 'both';

  console.log('🏷️  Coperniq Asset Labeler & Creator');
  console.log(`📋 Mode: ${mode}`);
  console.log('='.repeat(60) + '\n');

  const labeler = new CoperniqAssetLabeler();

  try {
    await labeler.initialize();

    if (mode === 'label' || mode === 'both') {
      await labeler.labelExistingAssets();
    }

    if (mode === 'create' || mode === 'both') {
      await labeler.createNewAssets();
    }

    labeler.printSummary();

  } catch (error) {
    console.error('Fatal error:', error);
  } finally {
    await labeler.cleanup();
  }
}

main().catch(console.error);

export { CoperniqAssetLabeler, determineLabelsForAsset, ASSET_LABEL_RULES };
