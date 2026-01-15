#!/usr/bin/env python3
"""
Sync MEP Templates to Supabase

This script reads all YAML template files and inserts them into Supabase.
Run this after creating new templates to persist them in the database.

Usage:
    python scripts/sync_to_supabase.py

Environment:
    SUPABASE_URL - Your Supabase project URL
    SUPABASE_SERVICE_KEY - Service role key (not anon key!)
"""

import os
import sys
import yaml
from pathlib import Path
from datetime import datetime
from typing import Dict, List, Any

try:
    from supabase import create_client, Client
except ImportError:
    print("Error: supabase-py not installed. Run: pip install supabase")
    sys.exit(1)

# Configuration
TEMPLATES_DIR = Path(__file__).parent.parent / "templates"
SUPABASE_URL = os.getenv("NEXT_PUBLIC_SUPABASE_URL") or os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

def get_supabase_client() -> Client:
    """Create Supabase client with service role key."""
    if not SUPABASE_URL:
        raise ValueError("SUPABASE_URL not set in environment")
    if not SUPABASE_KEY:
        raise ValueError("SUPABASE_SERVICE_KEY not set in environment")

    return create_client(SUPABASE_URL, SUPABASE_KEY)

def parse_yaml_template(file_path: Path) -> Dict[str, Any]:
    """Parse a YAML template file into a structured dict."""
    with open(file_path, 'r') as f:
        data = yaml.safe_load(f)

    # Handle different YAML structures
    template_data = data.get('template', data)

    # Extract template metadata
    result = {
        'name': template_data.get('name', file_path.stem),
        'display_name': template_data.get('display_name', template_data.get('name', file_path.stem)),
        'trade': file_path.parent.name,  # Directory name is the trade
        'category': template_data.get('category', file_path.parent.name.replace('_', ' ').title()),
        'description': template_data.get('description', ''),
        'emoji': template_data.get('emoji', ''),
        'phase': template_data.get('phase', 'service'),
        'compliance': data.get('compliance', template_data.get('compliance', [])),
        'work_order_type': template_data.get('work_order', {}).get('type', 'Field Work Order'),
        'work_order_name': template_data.get('work_order', {}).get('name', '[MEP] Service Call'),
        'version': data.get('metadata', {}).get('version', '1.0'),
        'created_by': data.get('metadata', {}).get('created_by', 'ai-development-cockpit'),
        'groups': [],
        'fields': []
    }

    # Extract groups and fields
    groups = data.get('groups', template_data.get('groups', []))
    for idx, group in enumerate(groups):
        group_data = {
            'name': group.get('name', f'Group {idx + 1}'),
            'display_order': group.get('order', idx + 1),
            'is_critical': group.get('critical', False),
            'fields': []
        }

        for field_idx, field in enumerate(group.get('fields', [])):
            field_data = {
                'name': field.get('name', f'field_{field_idx}'),
                'label': field.get('label', field.get('name', '')),
                'field_type': field.get('type', 'Text'),
                'is_required': field.get('required', False),
                'placeholder': field.get('placeholder', ''),
                'description': field.get('description', ''),
                'options': field.get('options'),
                'display_order': field_idx + 1
            }
            group_data['fields'].append(field_data)

        result['groups'].append(group_data)

    # Also handle flat fields (not in groups)
    flat_fields = data.get('fields', template_data.get('fields', []))
    if flat_fields and not groups:
        default_group = {
            'name': 'General',
            'display_order': 1,
            'is_critical': False,
            'fields': []
        }
        for idx, field in enumerate(flat_fields):
            field_data = {
                'name': field.get('name', f'field_{idx}'),
                'label': field.get('label', field.get('name', '')),
                'field_type': field.get('type', 'Text'),
                'is_required': field.get('required', False),
                'placeholder': field.get('placeholder', ''),
                'description': field.get('description', ''),
                'options': field.get('options'),
                'display_order': idx + 1,
                'group_name': field.get('group', 'General')
            }
            default_group['fields'].append(field_data)
        result['groups'].append(default_group)

    # Calculate totals
    result['total_groups'] = len(result['groups'])
    result['total_fields'] = sum(len(g['fields']) for g in result['groups'])

    return result

def sync_template_to_supabase(supabase: Client, template_data: Dict[str, Any]) -> bool:
    """Insert or update a template in Supabase."""
    try:
        # Prepare template record
        template_record = {
            'name': template_data['name'],
            'display_name': template_data['display_name'],
            'trade': template_data['trade'],
            'category': template_data['category'],
            'description': template_data['description'],
            'emoji': template_data['emoji'],
            'phase': template_data['phase'],
            'compliance': template_data['compliance'] if isinstance(template_data['compliance'], list) else [],
            'work_order_type': template_data['work_order_type'],
            'work_order_name': template_data['work_order_name'],
            'total_fields': template_data['total_fields'],
            'total_groups': template_data['total_groups'],
            'version': template_data['version'],
            'created_by': template_data['created_by'],
            'is_active': True
        }

        # Upsert template
        result = supabase.table('templates').upsert(
            template_record,
            on_conflict='name'
        ).execute()

        if not result.data:
            print(f"  Warning: No data returned for template {template_data['name']}")
            return False

        template_id = result.data[0]['id']
        print(f"  Template ID: {template_id}")

        # Delete existing fields first, then groups
        supabase.table('template_fields').delete().eq('template_id', template_id).execute()
        supabase.table('template_groups').delete().eq('template_id', template_id).execute()

        # Batch insert groups
        group_records = []
        for group in template_data['groups']:
            group_records.append({
                'template_id': template_id,
                'name': group['name'],
                'display_order': group['display_order'],
                'is_critical': group.get('is_critical', False)
            })

        if group_records:
            group_result = supabase.table('template_groups').insert(group_records).execute()

            # Map group names to IDs
            group_id_map = {g['name']: g['id'] for g in group_result.data}

            # Batch insert all fields
            field_records = []
            for group in template_data['groups']:
                group_id = group_id_map.get(group['name'])
                for field in group['fields']:
                    field_records.append({
                        'template_id': template_id,
                        'group_id': group_id,
                        'name': field['name'],
                        'label': field['label'],
                        'field_type': field['field_type'],
                        'is_required': field['is_required'],
                        'placeholder': field.get('placeholder', ''),
                        'description': field.get('description', ''),
                        'options': field.get('options'),
                        'display_order': field['display_order']
                    })

            if field_records:
                supabase.table('template_fields').insert(field_records).execute()

        return True

    except Exception as e:
        print(f"  Error syncing template: {e}")
        return False

def main():
    """Main function to sync all templates."""
    print("\n" + "=" * 60)
    print("MEP Templates → Supabase Sync")
    print("=" * 60)

    # Get Supabase client
    try:
        supabase = get_supabase_client()
        print(f"✅ Connected to Supabase: {SUPABASE_URL[:30]}...")
    except ValueError as e:
        print(f"❌ {e}")
        print("\nSet environment variables:")
        print("  export SUPABASE_URL=https://xxx.supabase.co")
        print("  export SUPABASE_SERVICE_KEY=eyJ...")
        sys.exit(1)

    # Find all YAML templates
    templates_found = list(TEMPLATES_DIR.rglob("*.yaml"))
    print(f"\n📁 Found {len(templates_found)} template files in {TEMPLATES_DIR}")

    if not templates_found:
        print("No templates found!")
        sys.exit(0)

    # Process each template
    success_count = 0
    error_count = 0

    for template_path in sorted(templates_found):
        relative_path = template_path.relative_to(TEMPLATES_DIR)
        print(f"\n📄 Processing: {relative_path}")

        try:
            template_data = parse_yaml_template(template_path)
            print(f"  Trade: {template_data['trade']}")
            print(f"  Fields: {template_data['total_fields']} in {template_data['total_groups']} groups")

            if sync_template_to_supabase(supabase, template_data):
                print(f"  ✅ Synced successfully")
                success_count += 1
            else:
                print(f"  ⚠️ Sync incomplete")
                error_count += 1

        except Exception as e:
            print(f"  ❌ Error: {e}")
            error_count += 1

    # Summary
    print("\n" + "=" * 60)
    print("SYNC SUMMARY")
    print("=" * 60)
    print(f"✅ Success: {success_count}")
    print(f"❌ Errors: {error_count}")
    print(f"📊 Total: {len(templates_found)}")

    if error_count == 0:
        print("\n🎉 All templates synced to Supabase!")
    else:
        print("\n⚠️ Some templates had errors. Check logs above.")

    return 0 if error_count == 0 else 1

if __name__ == "__main__":
    sys.exit(main())
