/**
 * Coperniq Asset Update Automation Script
 *
 * This script automates bulk updates to existing assets in Coperniq Instance 388.
 * It reads asset data from asset-data-spec.json and fills in:
 * - Size
 * - Expected Lifetime
 * - Installation Date
 * - Manufacturing Date
 * - Labels
 * - Status change from Draft to Active
 *
 * Usage: npx playwright test scripts/update-assets.ts
 */

import { chromium, Browser, Page } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';

// Load asset data specification
const assetDataPath = path.join(__dirname, '../src/config/asset-data-spec.json');
const assetData = JSON.parse(fs.readFileSync(assetDataPath, 'utf-8'));

const COPERNIQ_BASE_URL = 'https://app.coperniq.io/388';
const ASSETS_URL = `${COPERNIQ_BASE_URL}/asset-portfolio`;

// Delay helper for rate limiting and UI stabilization
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

async function updateAsset(page: Page, asset: AssetSpec, assetIndex: number) {
  console.log(`\n📦 Updating Asset #${asset.id}: ${asset.name}`);

  // Navigate to asset detail by clicking on the row
  // The asset URL pattern is /388/asset-portfolio/assets/{assetDbId}
  // We need to click on the asset row in the table

  const assetRowSelector = `text="#${asset.id}:"`;

  try {
    // Click on the asset row to open detail panel
    await page.click(assetRowSelector, { timeout: 5000 });
    await delay(1000);

    // Update Size field (if not already set)
    const sizeValue = asset.size.replace(/[^0-9.]/g, ''); // Extract numeric value
    if (sizeValue) {
      console.log(`  📏 Setting Size: ${sizeValue}`);
      const sizeField = page.locator('text="Size"').locator('..').locator('[cursor=pointer]').last();
      await sizeField.click();
      await delay(300);

      // Find the spinbutton or input field
      const sizeInput = page.locator('spinbutton').or(page.locator('input[type="number"]')).first();
      if (await sizeInput.isVisible()) {
        await sizeInput.fill(sizeValue);
        await page.keyboard.press('Enter');
        await delay(500);
      }
    }

    // Update Expected Lifetime
    const lifetimeYears = asset.expectedLifetime.replace(/[^0-9]/g, '');
    if (lifetimeYears) {
      console.log(`  ⏱️  Setting Expected Lifetime: ${lifetimeYears} years`);
      const lifetimeField = page.locator('text="Expected lifetime"').locator('..').locator('text="-"').or(
        page.locator('text="Expected lifetime"').locator('..').locator('[cursor=pointer]').last()
      );

      try {
        await lifetimeField.click({ timeout: 2000 });
        await delay(300);
        const lifetimeInput = page.locator('spinbutton').first();
        if (await lifetimeInput.isVisible()) {
          await lifetimeInput.fill(lifetimeYears);
          await page.keyboard.press('Enter');
          await delay(500);
        }
      } catch (e) {
        console.log(`  ⚠️  Expected lifetime field already set or not editable`);
      }
    }

    // Update Installation Date
    if (asset.installationDate) {
      console.log(`  📅 Setting Installation Date: ${asset.installationDate}`);
      await setDateField(page, 'Installation date', asset.installationDate);
    }

    // Update Manufacturing Date
    if (asset.manufacturingDate) {
      console.log(`  🏭 Setting Manufacturing Date: ${asset.manufacturingDate}`);
      await setDateField(page, 'Manufacturing date', asset.manufacturingDate);
    }

    // Update Label
    if (asset.label && asset.label !== '-') {
      console.log(`  🏷️  Setting Label: ${asset.label}`);
      await setLabel(page, asset.label);
    }

    // Close the detail panel
    await page.keyboard.press('Escape');
    await delay(500);

    console.log(`  ✅ Asset #${asset.id} updated successfully`);

  } catch (error) {
    console.error(`  ❌ Error updating Asset #${asset.id}:`, error);
    // Try to recover by pressing Escape
    await page.keyboard.press('Escape');
    await delay(500);
  }
}

async function setDateField(page: Page, fieldLabel: string, dateStr: string) {
  try {
    // Parse date: "2024-01-20" -> { year: 2024, month: 1, day: 20 }
    const [year, month, day] = dateStr.split('-').map(Number);

    // Click on the date field
    const dateField = page.locator(`text="${fieldLabel}"`).locator('..').locator('text="-"').or(
      page.locator(`text="${fieldLabel}"`).locator('..').locator('[cursor=pointer]').last()
    );

    await dateField.click({ timeout: 2000 });
    await delay(500);

    // Try to type date directly in the textbox
    const dateInput = page.locator('input[type="text"]').or(page.locator('textbox')).first();
    if (await dateInput.isVisible()) {
      // Format as MM/DD/YYYY for US date format
      const formattedDate = `${month.toString().padStart(2, '0')}/${day.toString().padStart(2, '0')}/${year}`;
      await dateInput.fill(formattedDate);
      await delay(300);

      // Click outside to close picker and save
      await page.keyboard.press('Tab');
      await delay(500);
    }

  } catch (error) {
    console.log(`  ⚠️  Could not set ${fieldLabel}: ${error}`);
    await page.keyboard.press('Escape');
    await delay(300);
  }
}

async function setLabel(page: Page, labelName: string) {
  try {
    // Click on Labels field
    const labelField = page.locator('text="Labels"').locator('..').locator('text="-"').or(
      page.locator('text="Labels"').locator('..').locator('[cursor=pointer]').last()
    );

    await labelField.click({ timeout: 2000 });
    await delay(500);

    // Look for the label in dropdown/modal
    const labelOption = page.locator(`text="${labelName}"`).first();
    if (await labelOption.isVisible({ timeout: 2000 })) {
      await labelOption.click();
      await delay(300);
    }

    // Close dropdown
    await page.keyboard.press('Escape');
    await delay(300);

  } catch (error) {
    console.log(`  ⚠️  Could not set label: ${error}`);
    await page.keyboard.press('Escape');
    await delay(300);
  }
}

async function changeStatusToActive(page: Page, assetId: number) {
  console.log(`  🔄 Changing Asset #${assetId} status to Active`);

  try {
    // Click on the Status field (showing "Draft")
    const statusField = page.locator('text="Draft"').first();
    await statusField.click({ timeout: 2000 });
    await delay(500);

    // Select "Active" from dropdown
    const activeOption = page.locator('text="Active"').first();
    if (await activeOption.isVisible({ timeout: 2000 })) {
      await activeOption.click();
      await delay(500);
    }

    console.log(`  ✅ Status changed to Active`);

  } catch (error) {
    console.log(`  ⚠️  Could not change status: ${error}`);
    await page.keyboard.press('Escape');
    await delay(300);
  }
}

async function main() {
  console.log('🚀 Starting Coperniq Asset Update Automation');
  console.log(`📊 Found ${assetData.assets.length} assets to update`);

  // Launch browser in non-headless mode to see what's happening
  const browser: Browser = await chromium.launch({
    headless: false, // Set to true for background execution
    slowMo: 100, // Slow down actions for visibility
  });

  const context = await browser.newContext({
    // Load existing session cookies if available
    storageState: process.env.COPERNIQ_SESSION_FILE || undefined,
  });

  const page: Page = await context.newPage();

  try {
    // Navigate to assets page
    console.log('\n📍 Navigating to Coperniq Assets page...');
    await page.goto(ASSETS_URL, { waitUntil: 'networkidle' });
    await delay(2000);

    // Check if we need to login
    if (page.url().includes('login')) {
      console.log('⚠️  Login required. Please login manually in the browser window.');
      console.log('   Press Enter in the terminal once logged in...');

      // Wait for user to login
      await new Promise<void>((resolve) => {
        process.stdin.once('data', () => resolve());
      });

      // Navigate back to assets after login
      await page.goto(ASSETS_URL, { waitUntil: 'networkidle' });
      await delay(2000);
    }

    // Show all assets (change pagination)
    console.log('\n📋 Setting pagination to show all assets...');
    const paginationCombo = page.locator('text="Assets per page"').locator('..').locator('combobox');
    if (await paginationCombo.isVisible()) {
      await paginationCombo.click();
      await delay(300);
      // Select higher number or "All"
      const option50 = page.locator('text="50"').first();
      if (await option50.isVisible({ timeout: 1000 })) {
        await option50.click();
        await delay(1000);
      }
    }

    // Process each asset
    for (let i = 0; i < assetData.assets.length; i++) {
      const asset = assetData.assets[i] as AssetSpec;
      await updateAsset(page, asset, i);

      // Small delay between assets to avoid rate limiting
      await delay(500);
    }

    console.log('\n✅ All assets updated successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Total assets processed: ${assetData.assets.length}`);
    console.log(`   Labels applied: ${assetData.assets.filter((a: AssetSpec) => a.label && a.label !== '-').length}`);

  } catch (error) {
    console.error('\n❌ Error during automation:', error);
  } finally {
    // Keep browser open for verification
    console.log('\n🔍 Browser kept open for verification. Close manually when done.');
    // await browser.close();
  }
}

// Run the script
main().catch(console.error);
