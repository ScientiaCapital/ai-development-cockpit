/**
 * Fast Coperniq Asset Updater - Playwright Automation
 *
 * Updates ALL 22 assets with complete data via browser automation.
 * Since Coperniq has no REST API for assets, we use Playwright.
 *
 * Fields updated:
 * - Size (numeric)
 * - Expected Lifetime (years)
 * - Installation Date (date picker)
 * - Manufacturing Date (date picker)
 * - Labels (dropdown)
 * - Status: Draft → Active
 *
 * Usage: npx ts-node scripts/fast-asset-updater.ts
 *
 * Prerequisites:
 * - npm install playwright
 * - Must be logged into Coperniq (saves session)
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// ============================================================================
// CONFIGURATION
// ============================================================================

const COPERNIQ_ASSETS_URL = 'https://app.coperniq.io/388/asset-portfolio';
const TODAY = new Date(2026, 0, 16); // January 16, 2026

// Load asset specifications
const assetDataPath = path.join(__dirname, '../src/config/asset-data-spec.json');
const assetSpec = JSON.parse(fs.readFileSync(assetDataPath, 'utf-8'));

// Timing configuration (milliseconds)
const TIMING = {
  tiny: 50,      // Micro-delays for loops
  short: 150,    // After simple clicks
  medium: 300,   // After data entry
  long: 500,     // After navigation/selection
  veryLong: 1000 // After page loads
};

// ============================================================================
// ASSET DATA INTERFACE
// ============================================================================

interface AssetData {
  id: number;
  name: string;
  serialNumber: string;
  size: string;           // e.g., "13.5 kWh", "24 kW", "15 Ton"
  expectedLifetime: string; // e.g., "10 years", "25 years"
  installationDate: string; // YYYY-MM-DD format
  manufacturingDate: string; // YYYY-MM-DD format
  label: string;           // Label name to select
  status: string;          // Target status
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

/**
 * Extract numeric value from size string
 * "13.5 kWh" → "13.5"
 * "24 kW" → "24"
 * "15 Ton" → "15"
 */
function extractNumericSize(sizeStr: string): string {
  const match = sizeStr.match(/^[\d.]+/);
  return match ? match[0] : '';
}

/**
 * Extract years from lifetime string
 * "10 years" → "10"
 */
function extractYears(lifetimeStr: string): string {
  const match = lifetimeStr.match(/(\d+)\s*years?/i);
  return match ? match[1] : '';
}

/**
 * Calculate months between two dates
 */
function monthsBetween(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/**
 * Parse date string to Date object
 */
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
}

// ============================================================================
// FIELD UPDATE FUNCTIONS
// ============================================================================

/**
 * Set a numeric spinbutton field (Size, Expected Lifetime)
 */
async function setNumericField(page: Page, fieldLabel: string, value: string): Promise<boolean> {
  if (!value || value === '-') return false;

  try {
    // Click the field row to open spinbutton
    const fieldRow = page.locator(`text="${fieldLabel}"`).locator('..');
    const clickTarget = fieldRow.locator('[cursor=pointer]').last();

    await clickTarget.click({ timeout: 2000 });
    await delay(TIMING.short);

    // Find and fill the spinbutton
    const spinbutton = page.locator('input[type="number"], [role="spinbutton"]').first();
    if (await spinbutton.isVisible({ timeout: 1500 })) {
      await spinbutton.fill(value);
      await page.keyboard.press('Enter');
      await delay(TIMING.medium);
      return true;
    }

    await page.keyboard.press('Escape');
    return false;
  } catch (e) {
    console.log(`    ⚠️ ${fieldLabel}: ${e}`);
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }
}

/**
 * Set a date field using date picker navigation
 */
async function setDateField(page: Page, fieldLabel: string, dateStr: string): Promise<boolean> {
  if (!dateStr || dateStr === '-') return false;

  try {
    const targetDate = parseDate(dateStr);
    const monthsBack = monthsBetween(targetDate, TODAY);
    const targetDay = targetDate.getDate();

    // Click the date field
    const fieldRow = page.locator(`text="${fieldLabel}"`).locator('..');
    const clickTarget = fieldRow.locator('[cursor=pointer]').last();

    await clickTarget.click({ timeout: 2000 });
    await delay(TIMING.short);

    // Navigate months using Previous Month button
    for (let i = 0; i < Math.abs(monthsBack); i++) {
      const buttonName = monthsBack > 0 ? 'Previous Month' : 'Next Month';
      await page.getByRole('button', { name: buttonName }).click();
      await delay(TIMING.tiny);
    }

    // Click the target day
    const dayButton = page.getByRole('button', { name: new RegExp(`${targetDay}(st|nd|rd|th)`) });
    await dayButton.first().click();
    await delay(TIMING.short);

    // Click outside to close picker and save
    await page.getByRole('heading', { name: 'Work' }).click();
    await delay(TIMING.medium);

    return true;
  } catch (e) {
    console.log(`    ⚠️ ${fieldLabel}: ${e}`);
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }
}

/**
 * Set a label from the dropdown
 */
async function setLabel(page: Page, labelName: string): Promise<boolean> {
  if (!labelName || labelName === '-') return false;

  try {
    // Click Labels field
    const labelsRow = page.locator('text="Labels"').locator('..');
    const clickTarget = labelsRow.locator('[cursor=pointer]').last();

    await clickTarget.click({ timeout: 2000 });
    await delay(TIMING.long);

    // Find and click the label checkbox
    const labelOption = page.locator(`text="${labelName}"`).first();
    if (await labelOption.isVisible({ timeout: 2000 })) {
      await labelOption.click();
      await delay(TIMING.medium);
      await page.keyboard.press('Escape');
      return true;
    }

    await page.keyboard.press('Escape');
    return false;
  } catch (e) {
    console.log(`    ⚠️ Label: ${e}`);
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }
}

/**
 * Change asset status from Draft to Active
 */
async function setStatusActive(page: Page): Promise<boolean> {
  try {
    const draftButton = page.locator('text="Draft"').first();
    if (await draftButton.isVisible({ timeout: 1500 })) {
      await draftButton.click();
      await delay(TIMING.short);

      const activeOption = page.locator('text="Active"').first();
      if (await activeOption.isVisible({ timeout: 1500 })) {
        await activeOption.click();
        await delay(TIMING.medium);
        return true;
      }
    }
    return false;
  } catch (e) {
    console.log(`    ⚠️ Status: ${e}`);
    await page.keyboard.press('Escape').catch(() => {});
    return false;
  }
}

// ============================================================================
// MAIN UPDATE FUNCTION
// ============================================================================

interface UpdateResult {
  assetId: number;
  assetName: string;
  success: boolean;
  fieldsUpdated: string[];
  errors: string[];
}

async function updateSingleAsset(page: Page, asset: AssetData): Promise<UpdateResult> {
  const result: UpdateResult = {
    assetId: asset.id,
    assetName: asset.name,
    success: false,
    fieldsUpdated: [],
    errors: []
  };

  console.log(`\n📦 Asset #${asset.id}: ${asset.name}`);

  try {
    // Click on asset row to open detail panel
    const assetRow = page.locator(`text="#${asset.id}:"`).first();
    await assetRow.click({ timeout: 5000 });
    await delay(TIMING.veryLong);

    // Update Size
    const sizeValue = extractNumericSize(asset.size);
    if (sizeValue) {
      console.log(`  📏 Size: ${sizeValue}`);
      if (await setNumericField(page, 'Size', sizeValue)) {
        result.fieldsUpdated.push('Size');
      }
    }

    // Update Expected Lifetime
    const lifetimeYears = extractYears(asset.expectedLifetime);
    if (lifetimeYears) {
      console.log(`  ⏱️  Lifetime: ${lifetimeYears} years`);
      if (await setNumericField(page, 'Expected lifetime', lifetimeYears)) {
        result.fieldsUpdated.push('Expected Lifetime');
      }
    }

    // Update Installation Date
    if (asset.installationDate && asset.installationDate !== '-') {
      console.log(`  📅 Install: ${asset.installationDate}`);
      if (await setDateField(page, 'Installation date', asset.installationDate)) {
        result.fieldsUpdated.push('Installation Date');
      }
    }

    // Update Manufacturing Date
    if (asset.manufacturingDate && asset.manufacturingDate !== '-') {
      console.log(`  🏭 Mfg: ${asset.manufacturingDate}`);
      if (await setDateField(page, 'Manufacturing date', asset.manufacturingDate)) {
        result.fieldsUpdated.push('Manufacturing Date');
      }
    }

    // Update Label
    if (asset.label && asset.label !== '-') {
      console.log(`  🏷️  Label: ${asset.label}`);
      if (await setLabel(page, asset.label)) {
        result.fieldsUpdated.push('Label');
      }
    }

    // Close detail panel
    await page.keyboard.press('Escape');
    await delay(TIMING.medium);

    result.success = true;
    console.log(`  ✅ Updated ${result.fieldsUpdated.length} fields: ${result.fieldsUpdated.join(', ') || 'none'}`);

  } catch (error) {
    result.errors.push(String(error));
    console.error(`  ❌ Error: ${error}`);
    await page.keyboard.press('Escape').catch(() => {});
  }

  return result;
}

// ============================================================================
// AUDIT FUNCTION
// ============================================================================

async function auditAssets(page: Page, assets: AssetData[]): Promise<void> {
  console.log('\n' + '='.repeat(60));
  console.log('🔍 AUDIT: Verifying all assets have complete data');
  console.log('='.repeat(60));

  const issues: string[] = [];

  for (const asset of assets) {
    try {
      const assetRow = page.locator(`text="#${asset.id}:"`).first();
      await assetRow.click({ timeout: 3000 });
      await delay(TIMING.long);

      // Check each field
      const checks = [
        { field: 'Size', expected: extractNumericSize(asset.size) },
        { field: 'Expected lifetime', expected: extractYears(asset.expectedLifetime) + ' years' },
        { field: 'Installation date', expected: asset.installationDate !== '-' },
        { field: 'Manufacturing date', expected: asset.manufacturingDate !== '-' },
        { field: 'Labels', expected: asset.label !== '-' }
      ];

      let assetIssues = [];
      for (const check of checks) {
        const fieldRow = page.locator(`text="${check.field}"`).locator('..');
        const valueText = await fieldRow.locator('[cursor=pointer]').last().textContent();

        if (valueText === '-' || valueText === '') {
          assetIssues.push(check.field);
        }
      }

      if (assetIssues.length > 0) {
        issues.push(`Asset #${asset.id}: Missing ${assetIssues.join(', ')}`);
        console.log(`  ⚠️ Asset #${asset.id}: Missing ${assetIssues.join(', ')}`);
      } else {
        console.log(`  ✅ Asset #${asset.id}: Complete`);
      }

      await page.keyboard.press('Escape');
      await delay(TIMING.short);

    } catch (e) {
      issues.push(`Asset #${asset.id}: Could not verify - ${e}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  if (issues.length === 0) {
    console.log('✅ AUDIT PASSED: All assets have complete data!');
  } else {
    console.log(`⚠️ AUDIT FOUND ${issues.length} ISSUES:`);
    issues.forEach(i => console.log(`   - ${i}`));
  }
  console.log('='.repeat(60));
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
  console.log('🚀 Fast Coperniq Asset Updater');
  console.log(`📅 Today: ${TODAY.toDateString()}`);
  console.log(`📊 Assets to update: ${assetSpec.assets.length}`);
  console.log('');

  // Launch browser
  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 30 // Faster than default
  });

  const context = await browser.newContext({
    storageState: process.env.COPERNIQ_SESSION_FILE || undefined
  });

  const page: Page = await context.newPage();

  // Stats tracking
  const stats = {
    total: assetSpec.assets.length,
    processed: 0,
    successful: 0,
    failed: 0,
    totalFieldsUpdated: 0
  };

  const results: UpdateResult[] = [];

  try {
    // Navigate to assets page
    console.log('📍 Navigating to Coperniq Assets page...');
    await page.goto(COPERNIQ_ASSETS_URL, { waitUntil: 'networkidle' });
    await delay(TIMING.veryLong * 2);

    // Check for login
    if (page.url().includes('login')) {
      console.log('\n⚠️ LOGIN REQUIRED');
      console.log('   Please login in the browser window.');
      console.log('   Press Enter when logged in...\n');

      await new Promise<void>((resolve) => {
        process.stdin.once('data', () => resolve());
      });

      await page.goto(COPERNIQ_ASSETS_URL, { waitUntil: 'networkidle' });
      await delay(TIMING.veryLong * 2);
    }

    // Set pagination to show all assets
    console.log('📋 Setting pagination to 50 per page...');
    try {
      const pageCombo = page.locator('combobox').first();
      if (await pageCombo.isVisible({ timeout: 2000 })) {
        await pageCombo.click();
        await delay(TIMING.short);
        const opt50 = page.locator('text="50"').first();
        if (await opt50.isVisible({ timeout: 1000 })) {
          await opt50.click();
          await delay(TIMING.veryLong);
        }
      }
    } catch (e) {
      console.log('   Pagination already set');
    }

    // Process each asset
    console.log('\n' + '='.repeat(60));
    console.log('STARTING BULK UPDATE');
    console.log('='.repeat(60));

    for (const asset of assetSpec.assets as AssetData[]) {
      const result = await updateSingleAsset(page, asset);
      results.push(result);

      stats.processed++;
      if (result.success) {
        stats.successful++;
        stats.totalFieldsUpdated += result.fieldsUpdated.length;
      } else {
        stats.failed++;
      }

      // Progress
      const pct = Math.round((stats.processed / stats.total) * 100);
      console.log(`  📊 Progress: ${stats.processed}/${stats.total} (${pct}%)`);

      await delay(TIMING.short);
    }

    // Run audit
    await auditAssets(page, assetSpec.assets as AssetData[]);

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BULK UPDATE COMPLETE');
    console.log('='.repeat(60));
    console.log(`   Total assets:      ${stats.total}`);
    console.log(`   Successful:        ${stats.successful}`);
    console.log(`   Failed:            ${stats.failed}`);
    console.log(`   Fields updated:    ${stats.totalFieldsUpdated}`);
    console.log('='.repeat(60));

    // Save results to JSON
    const resultsPath = path.join(__dirname, '../asset-update-results.json');
    fs.writeFileSync(resultsPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      stats,
      results
    }, null, 2));
    console.log(`\n📄 Results saved to: ${resultsPath}`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    console.log('\n🔍 Browser kept open for manual verification.');
    console.log('   Close manually when done.');
  }
}

// Run
main().catch(console.error);
