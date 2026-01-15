#!/usr/bin/env python3
"""
MEP Template Seeder
- Stores YAML specs in Supabase
- Seeds templates to Coperniq via Playwright OR API

Usage:
    python seed_templates.py --store      # Store specs in Supabase
    python seed_templates.py --seed       # Seed to Coperniq via Playwright
    python seed_templates.py --api        # Seed to Coperniq via API (requires credentials)
"""

import os
import sys
import yaml
import json
import argparse
from pathlib import Path
from datetime import datetime

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

try:
    from supabase import create_client, Client
except ImportError:
    print("Installing supabase-py...")
    os.system("pip install supabase")
    from supabase import create_client, Client

# Configuration
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("SUPABASE_SERVICE_ROLE_KEY")

def load_yaml_templates() -> list[dict]:
    """Load all YAML template specs from templates directory."""
    templates = []

    for category_dir in TEMPLATES_DIR.iterdir():
        if category_dir.is_dir():
            category = category_dir.name.upper()
            for yaml_file in category_dir.glob("*.yaml"):
                with open(yaml_file, 'r') as f:
                    spec = yaml.safe_load(f)
                    if spec and 'template' in spec:
                        templates.append({
                            'file': str(yaml_file),
                            'category': category,
                            'spec': spec
                        })
                        print(f"  Loaded: {yaml_file.name}")

    return templates

def store_in_supabase(templates: list[dict], supabase: Client) -> int:
    """Store template specs in Supabase."""
    stored = 0

    for t in templates:
        spec = t['spec']
        template_info = spec.get('template', {})

        # Check if template already exists
        existing = supabase.table('mep_templates').select('id').eq(
            'name', template_info.get('name', '')
        ).execute()

        if existing.data:
            print(f"  Skipping (exists): {template_info.get('name')}")
            continue

        # Insert template
        template_data = {
            'name': template_info.get('name', ''),
            'emoji': template_info.get('emoji', ''),
            'description': template_info.get('description', ''),
            'category': template_info.get('category', t['category']),
            'compliance': template_info.get('compliance'),
            'work_order_type': template_info.get('work_order', {}).get('type'),
            'work_order_name': template_info.get('work_order', {}).get('name'),
            'spec': spec,  # Full spec as JSONB
            'status': 'pending'
        }

        result = supabase.table('mep_templates').insert(template_data).execute()

        if result.data:
            template_id = result.data[0]['id']
            print(f"  Stored: {template_info.get('name')} (ID: {template_id})")

            # Store groups and fields
            for group in spec.get('groups', []):
                group_data = {
                    'template_id': template_id,
                    'name': group.get('name', ''),
                    'order_index': group.get('order', 0),
                    'is_critical': group.get('critical', False)
                }
                group_result = supabase.table('mep_template_groups').insert(group_data).execute()

                if group_result.data:
                    group_id = group_result.data[0]['id']

                    for idx, field in enumerate(group.get('fields', [])):
                        field_data = {
                            'group_id': group_id,
                            'name': field.get('name', ''),
                            'field_type': field.get('type', 'Text'),
                            'required': field.get('required', False),
                            'placeholder': field.get('placeholder'),
                            'description': field.get('description'),
                            'options': field.get('options') if field.get('options') else None,
                            'alert_threshold': field.get('alert_threshold'),
                            'order_index': idx
                        }
                        supabase.table('mep_template_fields').insert(field_data).execute()

            stored += 1

    return stored

def generate_playwright_script(templates: list[dict]) -> str:
    """Generate Playwright script for seeding templates to Coperniq."""

    script = '''// Auto-generated Playwright script for MEP template seeding
// Run: npx playwright test seed-templates.spec.ts

import { test, expect } from '@playwright/test';

const COPERNIQ_URL = 'https://app.coperniq.io/112';
const TEMPLATES = %s;

test.describe('MEP Template Seeding', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to Coperniq Form Templates
        await page.goto(`${COPERNIQ_URL}/settings/studio/templates/form-templates`);
        await page.waitForLoadState('networkidle');
    });

    for (const template of TEMPLATES) {
        test(`Create template: ${template.name}`, async ({ page }) => {
            // Click "Template" button to open creation dialog
            await page.getByRole('button', { name: 'Template' }).click();

            // Wait for AI dialog
            await page.waitForSelector('text=Ask AI');

            // Enter template description
            const prompt = `Create an MEP inspection form called "${template.name}" with emoji ${template.emoji}.

Description: ${template.description}

Groups and fields:
${template.groups.map(g => `
${g.name}:
${g.fields.map(f => `- ${f.name} (${f.type})${f.required ? ' [REQUIRED]' : ''}`).join('\\n')}
`).join('\\n')}

Make all fields match exactly as specified.`;

            await page.getByPlaceholder('Describe details here...').fill(prompt);

            // Click Create
            await page.getByRole('button', { name: 'Create' }).click();

            // Wait for template generation
            await page.waitForTimeout(5000);

            // Save changes
            await page.getByRole('button', { name: 'Save changes' }).click();

            // Verify success
            await expect(page.getByText('Form template created successfully')).toBeVisible({ timeout: 10000 });

            console.log(`✅ Created: ${template.name}`);
        });
    }
});
''' % json.dumps([{
        'name': t['spec']['template'].get('name', ''),
        'emoji': t['spec']['template'].get('emoji', ''),
        'description': t['spec']['template'].get('description', ''),
        'groups': [{
            'name': g.get('name', ''),
            'fields': [{
                'name': f.get('name', ''),
                'type': f.get('type', 'Text'),
                'required': f.get('required', False)
            } for f in g.get('fields', [])]
        } for g in t['spec'].get('groups', [])]
    } for t in templates], indent=2)

    return script

def main():
    parser = argparse.ArgumentParser(description='MEP Template Seeder')
    parser.add_argument('--store', action='store_true', help='Store specs in Supabase')
    parser.add_argument('--seed', action='store_true', help='Generate Playwright seed script')
    parser.add_argument('--list', action='store_true', help='List available templates')
    args = parser.parse_args()

    print("\n🔧 MEP Template Seeder")
    print("=" * 50)

    # Load templates
    print("\n📂 Loading YAML templates...")
    templates = load_yaml_templates()
    print(f"   Found {len(templates)} templates\n")

    if args.list or (not args.store and not args.seed):
        print("📋 Available Templates:")
        for t in templates:
            spec = t['spec']
            name = spec.get('template', {}).get('name', 'Unknown')
            groups = len(spec.get('groups', []))
            fields = sum(len(g.get('fields', [])) for g in spec.get('groups', []))
            print(f"   - {name} ({groups} groups, {fields} fields)")
        print("\nUsage:")
        print("   python seed_templates.py --store   # Store in Supabase")
        print("   python seed_templates.py --seed    # Generate Playwright script")
        return

    if args.store:
        print("💾 Storing templates in Supabase...")

        if not SUPABASE_URL or not SUPABASE_KEY:
            print("❌ Error: SUPABASE_URL and SUPABASE_SERVICE_KEY required")
            print("   Set these in your .env file")
            return

        supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        stored = store_in_supabase(templates, supabase)
        print(f"\n✅ Stored {stored} templates in Supabase")

    if args.seed:
        print("🎭 Generating Playwright seeding script...")
        script = generate_playwright_script(templates)

        output_path = Path(__file__).parent / "seed-templates.spec.ts"
        with open(output_path, 'w') as f:
            f.write(script)

        print(f"✅ Generated: {output_path}")
        print("\nTo run:")
        print(f"   cd {output_path.parent}")
        print("   npx playwright test seed-templates.spec.ts")

if __name__ == '__main__':
    main()
