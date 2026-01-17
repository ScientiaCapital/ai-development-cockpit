/**
 * Coperniq Bulk Asset Updater
 *
 * Efficiently updates all 22 assets with complete data:
 * - Size (numeric spinbutton)
 * - Expected Lifetime (years spinbutton)
 * - Installation Date (date picker with month navigation)
 * - Manufacturing Date (date picker with month navigation)
 * - Labels (dropdown selection)
 *
 * Usage: npx ts-node scripts/bulk-asset-updater.ts
 *
 * Prerequisites:
 * - npm install playwright @types/node
 * - Logged into Coperniq in a browser session
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Load asset data specification
const assetDataPath = path.join(__dirname, '../src/config/asset-data-spec.json');
const assetData = JSON.parse(fs.readFileSync(assetDataPath, 'utf-8'));

const COPERNIQ_BASE_URL = 'https://app.coperniq.io/388';
const ASSETS_URL = `${COPERNIQ_BASE_URL}/asset-portfolio`;

// Delays for UI stabilization
const DELAYS = {
  short: 300,
  medium: 500,
  long: 1000,
  navigation: 2000,
};

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface AssetSpec {
  id: number;
  name: string;
  serialNumber: string;
  client: string;
  type: string;
  size: string;
  expectedLifetime: string;
  installationDate: string;
  manufacturingDate: string;
  label: string;
  status: string;
  notes: string;
}

/**
 * Calculate months between two dates
 */
function monthsDifference(from: Date, to: Date): number {
  return (to.getFullYear() - from.getFullYear()) * 12 + (to.getMonth() - from.getMonth());
}

/**
 * Navigate date picker to target month/year
 */
async function navigateToMonth(page: Page, targetDate: string): Promise<boolean> {
  const [year, month, day] = targetDate.split('-').map(Number);
  const targetMonth = new Date(year, month - 1, 1);
  const currentMonth = new Date(); // Date picker starts at current month

  const monthsToGo = monthsDifference(targetMonth, currentMonth);

  console.log(`    📅 Navigating ${Math.abs(monthsToGo)} months ${monthsToGo > 0 ? 'back' : 'forward'}`);

  // Click Previous Month button the required number of times
  for (let i = 0; i < Math.abs(monthsToGo); i++) {
    const buttonSelector = monthsToGo > 0 ? 'button:has-text("Previous Month")' : 'button:has-text("Next Month")';
    try {
      await page.click(buttonSelector, { timeout: 2000 });
      await delay(DELAYS.short);
    } catch (e) {
      // Try alternate selector
      const altSelector = monthsToGo > 0 ? '[aria-label="Previous Month"]' : '[aria-label="Next Month"]';
      await page.click(altSelector, { timeout: 2000 });
      await delay(DELAYS.short);
    }
  }

  // Click the target day
  const dayButton = page.locator(`button:has-text("${day}")`).first();
  if (await dayButton.isVisible({ timeout: 2000 })) {
    await dayButton.click();
    await delay(DELAYS.medium);
    return true;
  }

  return false;
}

/**
 * Set a date field using the date picker
 */
async function setDateField(page: Page, fieldLabel: string, dateStr: string): Promise<boolean> {
  try {
    // Find and click the date field
    const fieldLocator = page.locator(`text="${fieldLabel}"`).locator('..').locator('[cursor=pointer]').last();

    if (!(await fieldLocator.isVisible({ timeout: 3000 }))) {
      console.log(`    ⚠️  ${fieldLabel} field not visible`);
      return false;
    }

    await fieldLocator.click();
    await delay(DELAYS.medium);

    // Navigate date picker to correct month
    const success = await navigateToMonth(page, dateStr);

    // Close picker
    await page.keyboard.press('Escape');
    await delay(DELAYS.short);

    return success;
  } catch (error) {
    console.log(`    ⚠️  Could not set ${fieldLabel}: ${error}`);
    await page.keyboard.press('Escape');
    await delay(DELAYS.short);
    return false;
  }
}

/**
 * Set a numeric spinbutton field
 */
async function setSpinbuttonField(page: Page, fieldLabel: string, value: string): Promise<boolean> {
  try {
    // Extract numeric value
    const numericValue = value.replace(/[^0-9.]/g, '');
    if (!numericValue) return false;

    // Find the field row and click the editable area
    const fieldRow = page.locator(`text="${fieldLabel}"`).locator('..');
    const editableArea = fieldRow.locator('[cursor=pointer]').last();

    if (!(await editableArea.isVisible({ timeout: 3000 }))) {
      console.log(`    ⚠️  ${fieldLabel} field not visible`);
      return false;
    }

    await editableArea.click();
    await delay(DELAYS.short);

    // Find the spinbutton and fill it
    const spinbutton = page.locator('spinbutton').first();
    if (await spinbutton.isVisible({ timeout: 2000 })) {
      await spinbutton.fill(numericValue);
      await page.keyboard.press('Enter');
      await delay(DELAYS.medium);
      return true;
    }

    // Try input[type="number"] as fallback
    const numberInput = page.locator('input[type="number"]').first();
    if (await numberInput.isVisible({ timeout: 2000 })) {
      await numberInput.fill(numericValue);
      await page.keyboard.press('Enter');
      await delay(DELAYS.medium);
      return true;
    }

    return false;
  } catch (error) {
    console.log(`    ⚠️  Could not set ${fieldLabel}: ${error}`);
    await page.keyboard.press('Escape');
    await delay(DELAYS.short);
    return false;
  }
}

/**
 * Set a label from dropdown
 */
async function setLabel(page: Page, labelName: string): Promise<boolean> {
  try {
    // Find and click the Labels field
    const labelsField = page.locator('text="Labels"').locator('..').locator('[cursor=pointer]').last();

    if (!(await labelsField.isVisible({ timeout: 3000 }))) {
      console.log(`    ⚠️  Labels field not visible`);
      return false;
    }

    await labelsField.click();
    await delay(DELAYS.medium);

    // Look for the label option in the dropdown
    const labelOption = page.locator(`text="${labelName}"`).first();
    if (await labelOption.isVisible({ timeout: 3000 })) {
      await labelOption.click();
      await delay(DELAYS.medium);

      // Close dropdown
      await page.keyboard.press('Escape');
      await delay(DELAYS.short);
      return true;
    }

    console.log(`    ⚠️  Label "${labelName}" not found in dropdown`);
    await page.keyboard.press('Escape');
    await delay(DELAYS.short);
    return false;
  } catch (error) {
    console.log(`    ⚠️  Could not set label: ${error}`);
    await page.keyboard.press('Escape');
    await delay(DELAYS.short);
    return false;
  }
}

/**
 * Update a single asset with all its data
 */
async function updateAsset(page: Page, asset: AssetSpec): Promise<{ success: boolean; fieldsUpdated: string[] }> {
  const fieldsUpdated: string[] = [];

  console.log(`\n📦 Asset #${asset.id}: ${asset.name}`);

  try {
    // Click on the asset row to open detail panel
    const assetRowSelector = `text="#${asset.id}:"`;
    await page.click(assetRowSelector, { timeout: 5000 });
    await delay(DELAYS.long);

    // Update Size
    if (asset.size && asset.size !== '-') {
      console.log(`  📏 Setting Size: ${asset.size}`);
      if (await setSpinbuttonField(page, 'Size', asset.size)) {
        fieldsUpdated.push('Size');
      }
    }

    // Update Expected Lifetime
    if (asset.expectedLifetime && asset.expectedLifetime !== '-') {
      const years = asset.expectedLifetime.replace(/[^0-9]/g, '');
      console.log(`  ⏱️  Setting Expected Lifetime: ${years} years`);
      if (await setSpinbuttonField(page, 'Expected lifetime', years)) {
        fieldsUpdated.push('Expected Lifetime');
      }
    }

    // Update Installation Date
    if (asset.installationDate && asset.installationDate !== '-') {
      console.log(`  📅 Setting Installation Date: ${asset.installationDate}`);
      if (await setDateField(page, 'Installation date', asset.installationDate)) {
        fieldsUpdated.push('Installation Date');
      }
    }

    // Update Manufacturing Date
    if (asset.manufacturingDate && asset.manufacturingDate !== '-') {
      console.log(`  🏭 Setting Manufacturing Date: ${asset.manufacturingDate}`);
      if (await setDateField(page, 'Manufacturing date', asset.manufacturingDate)) {
        fieldsUpdated.push('Manufacturing Date');
      }
    }

    // Update Label (only if not already set)
    if (asset.label && asset.label !== '-') {
      console.log(`  🏷️  Setting Label: ${asset.label}`);
      if (await setLabel(page, asset.label)) {
        fieldsUpdated.push('Label');
      }
    }

    // Close the detail panel
    await page.keyboard.press('Escape');
    await delay(DELAYS.medium);

    console.log(`  ✅ Updated ${fieldsUpdated.length} fields: ${fieldsUpdated.join(', ') || 'none'}`);
    return { success: true, fieldsUpdated };

  } catch (error) {
    console.error(`  ❌ Error: ${error}`);
    await page.keyboard.press('Escape');
    await delay(DELAYS.medium);
    return { success: false, fieldsUpdated };
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Coperniq Bulk Asset Updater');
  console.log(`📊 Found ${assetData.assets.length} assets to update\n`);

  // Launch browser
  const browser: Browser = await chromium.launch({
    headless: false,
    slowMo: 50,
  });

  const context = await browser.newContext({
    storageState: process.env.COPERNIQ_SESSION_FILE || undefined,
  });

  const page: Page = await context.newPage();

  // Statistics
  const stats = {
    total: assetData.assets.length,
    processed: 0,
    successful: 0,
    failed: 0,
    fieldsUpdated: 0,
  };

  try {
    // Navigate to assets page
    console.log('📍 Navigating to Coperniq Assets page...');
    await page.goto(ASSETS_URL, { waitUntil: 'networkidle' });
    await delay(DELAYS.navigation);

    // Check for login
    if (page.url().includes('login')) {
      console.log('\n⚠️  Login required!');
      console.log('   Please login manually in the browser window.');
      console.log('   Press Enter in terminal once logged in...\n');

      await new Promise<void>((resolve) => {
        process.stdin.once('data', () => resolve());
      });

      await page.goto(ASSETS_URL, { waitUntil: 'networkidle' });
      await delay(DELAYS.navigation);
    }

    // Increase assets per page
    console.log('📋 Configuring pagination...');
    try {
      const paginationCombo = page.locator('combobox').first();
      if (await paginationCombo.isVisible({ timeout: 3000 })) {
        await paginationCombo.click();
        await delay(DELAYS.short);

        const option50 = page.locator('text="50"').first();
        if (await option50.isVisible({ timeout: 2000 })) {
          await option50.click();
          await delay(DELAYS.long);
        }
      }
    } catch (e) {
      console.log('   Pagination already set or not available');
    }

    // Process each asset
    console.log('\n' + '='.repeat(60));
    console.log('Starting bulk update...');
    console.log('='.repeat(60));

    for (const asset of assetData.assets as AssetSpec[]) {
      const result = await updateAsset(page, asset);

      stats.processed++;
      if (result.success) {
        stats.successful++;
        stats.fieldsUpdated += result.fieldsUpdated.length;
      } else {
        stats.failed++;
      }

      // Progress indicator
      const progress = Math.round((stats.processed / stats.total) * 100);
      console.log(`  📊 Progress: ${stats.processed}/${stats.total} (${progress}%)`);

      // Delay between assets
      await delay(DELAYS.medium);
    }

    // Print summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 BULK UPDATE COMPLETE');
    console.log('='.repeat(60));
    console.log(`   Total assets:      ${stats.total}`);
    console.log(`   Successfully updated: ${stats.successful}`);
    console.log(`   Failed:            ${stats.failed}`);
    console.log(`   Fields updated:    ${stats.fieldsUpdated}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    console.log('\n🔍 Browser kept open for verification.');
    console.log('   Close manually when done.');
  }
}

// Run
main().catch(console.error);
