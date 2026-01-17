#!/usr/bin/env npx tsx
/**
 * Kipper Energy Solutions - 12-Month Demo Data Seeder
 *
 * Seeds Coperniq Instance 388 with:
 * - 156 customer contacts
 * - Sites for each customer
 * - 600+ work orders across 12 months
 * - Equipment assets
 *
 * CRITICAL: Uses 1000ms delay between API calls to avoid rate limiting
 *
 * Usage:
 *   COPERNIQ_API_KEY=xxx npx tsx scripts/seed-demo-company.ts
 *
 * Options:
 *   --dry-run    Preview without creating data
 *   --customers  Seed only customers
 *   --sites      Seed only sites
 *   --projects   Seed only work orders
 */

import * as fs from 'fs';
import * as path from 'path';

// Configuration
const COPERNIQ_API_URL = 'https://api.coperniq.io/v1';
const INSTANCE_ID = '388';
const REQUEST_DELAY = 1000; // 1 second between requests

// Load environment
const API_KEY = process.env.COPERNIQ_API_KEY;

// Color helpers for CLI output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(msg: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${msg}${colors.reset}`);
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Types
interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  trade?: string;
  coperniq_role: string;
}

interface Customer {
  id: string;
  type: string;
  subtype: string;
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipcode: string;
  notes?: string;
  preferred_tech?: string;
  equipment?: Array<{
    type: string;
    brand: string;
    model: string;
    installed?: string;
    tonnage?: number;
    size_kw?: number;
  }>;
}

interface WorkOrderTemplate {
  id: string;
  title: string;
  description: string;
  priority: string;
  estimated_hours: number;
  category: string;
  seasonal_weight: { summer: number; spring: number; fall: number; winter: number };
  requires_permit?: boolean;
  common_causes?: string[];
  parts_commonly_needed?: string[];
  checklist?: string[];
}

interface TradeTemplates {
  trade: string;
  templates: WorkOrderTemplate[];
}

interface MonthlyGrowth {
  month: string;
  target_jobs: number;
  notes: string;
}

interface TradeDistribution {
  percentage: number;
  seasonal_peak: string[];
}

interface TeamRoster {
  company: {
    name: string;
    coperniq_instance: number;
    address: string;
    city: string;
    state: string;
    zipcode: string;
    phone: string;
    email: string;
    timezone: string;
  };
  office_staff: TeamMember[];
  field_staff: TeamMember[];
  trade_distribution: Record<string, TradeDistribution>;
  monthly_growth: MonthlyGrowth[];
}

interface CustomerData {
  metadata: {
    total_customers: number;
  };
  customers: Customer[];
}

// Load data files
function loadJson<T>(filename: string): T {
  const filePath = path.join(__dirname, 'data', filename);
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content) as T;
}

function loadTemplates(): Map<string, TradeTemplates> {
  const templatesDir = path.join(__dirname, 'data', 'work-order-templates');
  const templates = new Map<string, TradeTemplates>();

  const files = fs.readdirSync(templatesDir).filter(f => f.endsWith('.json'));
  for (const file of files) {
    const filePath = path.join(templatesDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(content) as TradeTemplates;
    templates.set(data.trade, data);
  }

  return templates;
}

// API helpers
async function coperniqPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T | null> {
  if (!API_KEY) {
    log('ERROR: COPERNIQ_API_KEY not set', 'red');
    return null;
  }

  try {
    const response = await fetch(`${COPERNIQ_API_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
      body: JSON.stringify(body),
    });

    if (response.status === 429) {
      log(`  Rate limited on ${endpoint}, waiting 5s...`, 'yellow');
      await delay(5000);
      return coperniqPost(endpoint, body); // Retry
    }

    if (!response.ok) {
      const errorText = await response.text();
      log(`  ERROR ${response.status}: ${errorText}`, 'red');
      return null;
    }

    return (await response.json()) as T;
  } catch (error) {
    log(`  Network error: ${error}`, 'red');
    return null;
  }
}

async function coperniqGet<T>(endpoint: string): Promise<T | null> {
  if (!API_KEY) {
    log('ERROR: COPERNIQ_API_KEY not set', 'red');
    return null;
  }

  try {
    const response = await fetch(`${COPERNIQ_API_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
      },
    });

    if (response.status === 429) {
      log(`  Rate limited on ${endpoint}, waiting 5s...`, 'yellow');
      await delay(5000);
      return coperniqGet(endpoint);
    }

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

// Season helper
function getSeason(month: number): 'winter' | 'spring' | 'summer' | 'fall' {
  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

// Generate work orders based on monthly distribution
function generateWorkOrders(
  customers: Customer[],
  templates: Map<string, TradeTemplates>,
  teamRoster: TeamRoster,
  year: number
): Array<{
  customer: Customer;
  template: WorkOrderTemplate;
  trade: string;
  scheduledDate: Date;
  technician: TeamMember;
}> {
  const workOrders: Array<{
    customer: Customer;
    template: WorkOrderTemplate;
    trade: string;
    scheduledDate: Date;
    technician: TeamMember;
  }> = [];

  const trades = Object.keys(teamRoster.trade_distribution);

  // Generate work orders for each month
  for (let month = 0; month < 12; month++) {
    const monthData = teamRoster.monthly_growth[month];
    const targetJobs = monthData.target_jobs;
    const season = getSeason(month + 1);

    // Distribute jobs across trades
    for (const trade of trades) {
      const distribution = teamRoster.trade_distribution[trade];
      let tradeJobs = Math.round(targetJobs * (distribution.percentage / 100));

      // Boost for seasonal peak months
      const monthName = monthData.month;
      if (distribution.seasonal_peak.includes(monthName)) {
        tradeJobs = Math.round(tradeJobs * 1.3);
      }

      // Get templates for this trade
      const tradeTemplates = templates.get(trade);
      if (!tradeTemplates) continue;

      // Find technician for this trade
      const technician = teamRoster.field_staff.find(t => t.trade === trade);
      if (!technician) continue;

      // Generate jobs
      for (let j = 0; j < tradeJobs; j++) {
        // Select random customer
        const customer = customers[Math.floor(Math.random() * customers.length)];

        // Select template weighted by season
        const weightedTemplates = tradeTemplates.templates.filter(t => {
          const weight = t.seasonal_weight[season] || 1;
          return Math.random() < weight / 5;
        });

        const template =
          weightedTemplates.length > 0
            ? weightedTemplates[Math.floor(Math.random() * weightedTemplates.length)]
            : tradeTemplates.templates[Math.floor(Math.random() * tradeTemplates.templates.length)];

        // Generate random date within month
        const day = Math.floor(Math.random() * 28) + 1;
        const scheduledDate = new Date(year, month, day);

        // Skip weekends
        if (scheduledDate.getDay() === 0) scheduledDate.setDate(scheduledDate.getDate() + 1);
        if (scheduledDate.getDay() === 6) scheduledDate.setDate(scheduledDate.getDate() + 2);

        workOrders.push({
          customer,
          template,
          trade,
          scheduledDate,
          technician,
        });
      }
    }
  }

  return workOrders;
}

// Main seeding functions
async function seedCustomers(customers: Customer[], dryRun: boolean): Promise<Map<string, number>> {
  log('\n📋 Seeding Customers...', 'cyan');
  const customerMap = new Map<string, number>();

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    log(`  [${i + 1}/${customers.length}] ${customer.name}`, 'blue');

    if (!dryRun) {
      const result = await coperniqPost<{ id: number }>('/clients', {
        name: customer.name,
        title: customer.name,
        primaryEmail: customer.email,
        primaryPhone: customer.phone,
        clientType: customer.type === 'commercial' ? 'COMMERCIAL' : 'RESIDENTIAL',
        street: customer.address,
        city: customer.city,
        state: customer.state,
        zipcode: customer.zipcode,
        notes: customer.notes,
        source: 'SEED_SCRIPT',
      });

      if (result) {
        customerMap.set(customer.id, result.id);
        log(`    ✓ Created client ID: ${result.id}`, 'green');
      }

      await delay(REQUEST_DELAY);
    } else {
      customerMap.set(customer.id, i + 1000); // Fake ID for dry run
    }
  }

  log(`\n✅ Created ${customerMap.size} customers`, 'green');
  return customerMap;
}

async function seedSites(
  customers: Customer[],
  customerMap: Map<string, number>,
  dryRun: boolean
): Promise<Map<string, number>> {
  log('\n🏠 Seeding Sites...', 'cyan');
  const siteMap = new Map<string, number>();

  for (let i = 0; i < customers.length; i++) {
    const customer = customers[i];
    const clientId = customerMap.get(customer.id);
    if (!clientId) continue;

    log(`  [${i + 1}/${customers.length}] ${customer.address}`, 'blue');

    if (!dryRun) {
      const result = await coperniqPost<{ id: number }>('/sites', {
        name: customer.name,
        clientId: clientId,
        street: customer.address,
        city: customer.city,
        state: customer.state,
        zipcode: customer.zipcode,
        siteType: customer.type === 'commercial' ? 'COMMERCIAL' : 'RESIDENTIAL',
      });

      if (result) {
        siteMap.set(customer.id, result.id);
        log(`    ✓ Created site ID: ${result.id}`, 'green');
      }

      await delay(REQUEST_DELAY);
    } else {
      siteMap.set(customer.id, i + 2000);
    }
  }

  log(`\n✅ Created ${siteMap.size} sites`, 'green');
  return siteMap;
}

async function seedWorkOrders(
  workOrders: Array<{
    customer: Customer;
    template: WorkOrderTemplate;
    trade: string;
    scheduledDate: Date;
    technician: TeamMember;
  }>,
  customerMap: Map<string, number>,
  siteMap: Map<string, number>,
  dryRun: boolean
): Promise<number> {
  log('\n📝 Seeding Work Orders...', 'cyan');
  let created = 0;

  // Sort by date for realistic creation order
  const sorted = workOrders.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime());

  for (let i = 0; i < sorted.length; i++) {
    const wo = sorted[i];
    const clientId = customerMap.get(wo.customer.id);
    const siteId = siteMap.get(wo.customer.id);

    // Progress update every 50 records
    if (i % 50 === 0) {
      log(`  [${i + 1}/${sorted.length}] Processing ${wo.template.title}...`, 'blue');
    }

    if (!dryRun && clientId && siteId) {
      const result = await coperniqPost<{ id: number }>('/projects', {
        title: `${wo.template.title} - ${wo.customer.name}`,
        description: wo.template.description,
        clientId: clientId,
        siteId: siteId,
        trade: wo.trade.toUpperCase(),
        status: 'ACTIVE',
        priority: wo.template.priority?.toUpperCase() || 'NORMAL',
        startDate: wo.scheduledDate.toISOString().split('T')[0],
        estimatedHours: wo.template.estimated_hours,
        projectType: wo.template.category?.toUpperCase() || 'SERVICE',
      });

      if (result) {
        created++;
        if (created % 50 === 0) {
          log(`    ✓ Created ${created} work orders so far...`, 'green');
        }
      }

      await delay(REQUEST_DELAY);
    } else if (dryRun) {
      created++;
    }
  }

  log(`\n✅ Created ${created} work orders`, 'green');
  return created;
}

async function seedAssets(
  customers: Customer[],
  customerMap: Map<string, number>,
  siteMap: Map<string, number>,
  dryRun: boolean
): Promise<number> {
  log('\n⚙️ Seeding Equipment Assets...', 'cyan');
  let created = 0;

  for (const customer of customers) {
    if (!customer.equipment) continue;

    const clientId = customerMap.get(customer.id);
    const siteId = siteMap.get(customer.id);
    if (!clientId || !siteId) continue;

    for (const equip of customer.equipment) {
      log(`  ${equip.brand} ${equip.model} @ ${customer.name}`, 'blue');

      if (!dryRun) {
        const result = await coperniqPost<{ id: number }>('/assets', {
          name: `${equip.brand} ${equip.model}`,
          type: equip.type?.toUpperCase() || 'EQUIPMENT',
          manufacturer: equip.brand,
          model: equip.model,
          siteId: siteId,
          installDate: equip.installed,
          status: 'ACTIVE',
        });

        if (result) {
          created++;
          log(`    ✓ Created asset ID: ${result.id}`, 'green');
        }

        await delay(REQUEST_DELAY);
      } else {
        created++;
      }
    }
  }

  log(`\n✅ Created ${created} assets`, 'green');
  return created;
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const customersOnly = args.includes('--customers');
  const sitesOnly = args.includes('--sites');
  const projectsOnly = args.includes('--projects');

  log('═══════════════════════════════════════════════════════════', 'cyan');
  log('    Kipper Energy Solutions - 12-Month Demo Seeder', 'cyan');
  log('═══════════════════════════════════════════════════════════', 'cyan');

  if (dryRun) {
    log('\n🔵 DRY RUN MODE - No data will be created\n', 'yellow');
  }

  if (!API_KEY && !dryRun) {
    log('\n❌ ERROR: COPERNIQ_API_KEY environment variable not set', 'red');
    log('   Usage: COPERNIQ_API_KEY=xxx npx tsx scripts/seed-demo-company.ts', 'yellow');
    process.exit(1);
  }

  // Load data
  log('\n📂 Loading data files...', 'cyan');
  const teamRoster = loadJson<TeamRoster>('team-roster.json');
  const customerData = loadJson<CustomerData>('customer-personas.json');
  const templates = loadTemplates();

  log(`   ✓ Company: ${teamRoster.company.name}`, 'green');
  log(`   ✓ Customers: ${customerData.metadata.total_customers}`, 'green');
  log(`   ✓ Trade templates: ${templates.size}`, 'green');

  // Test API connection
  if (!dryRun) {
    log('\n🔌 Testing Coperniq API connection...', 'cyan');
    const testResult = await coperniqGet<unknown>('/clients?limit=1');
    if (testResult === null) {
      log('   ❌ Could not connect to Coperniq API', 'red');
      process.exit(1);
    }
    log('   ✓ API connection successful', 'green');
  }

  // Calculate work orders
  const currentYear = new Date().getFullYear();
  const workOrders = generateWorkOrders(customerData.customers, templates, teamRoster, currentYear);

  log(`\n📊 Data Summary:`, 'cyan');
  log(`   • Customers to seed: ${customerData.customers.length}`, 'blue');
  log(`   • Sites to seed: ${customerData.customers.length}`, 'blue');
  log(`   • Work orders to seed: ${workOrders.length}`, 'blue');
  log(`   • Equipment assets: ${customerData.customers.filter(c => c.equipment).length}`, 'blue');

  // Seed data
  let customerMap = new Map<string, number>();
  let siteMap = new Map<string, number>();

  if (!sitesOnly && !projectsOnly) {
    customerMap = await seedCustomers(customerData.customers, dryRun);
  }

  if (!customersOnly && !projectsOnly) {
    // Need customerMap for sites
    if (customerMap.size === 0 && !dryRun) {
      log('\n⚠️ Skipping sites - no customer data available', 'yellow');
    } else {
      siteMap = await seedSites(customerData.customers, customerMap, dryRun);
    }
  }

  if (!customersOnly && !sitesOnly) {
    // Need both maps for work orders
    if ((customerMap.size === 0 || siteMap.size === 0) && !dryRun) {
      log('\n⚠️ Skipping work orders - customer/site data required', 'yellow');
    } else {
      await seedWorkOrders(workOrders, customerMap, siteMap, dryRun);
    }

    // Seed assets
    await seedAssets(customerData.customers, customerMap, siteMap, dryRun);
  }

  // Summary
  log('\n═══════════════════════════════════════════════════════════', 'cyan');
  log('                      SEEDING COMPLETE', 'green');
  log('═══════════════════════════════════════════════════════════', 'cyan');
  log(`   Coperniq Instance: ${INSTANCE_ID}`, 'blue');
  log(`   Mode: ${dryRun ? 'DRY RUN' : 'LIVE'}`, 'blue');
  log('═══════════════════════════════════════════════════════════', 'cyan');
}

main().catch(console.error);
