# Supabase Integration Examples

**Purpose:** Code examples for integrating migrations with orchestrator.py and E2B sandbox

---

## Python Client Setup

### Initialize Supabase Client

```python
import os
from supabase import create_client, Client
from datetime import datetime, timedelta
import json

# Initialize Supabase client
url = os.getenv("SUPABASE_URL", "https://jkycvqaykuxhkwomkrst.supabase.co")
key = os.getenv("SUPABASE_SERVICE_KEY")  # Service key for migrations

supabase: Client = create_client(url, key)
db = supabase.table
```

---

## Contractor Configuration Management

### Create Contractor Config

```python
def create_contractor_config(
    contractor_name: str,
    contractor_email: str,
    trades: list[str],
    markets: list[str],
    phases: list[str],
    preset_used: str = None
) -> dict:
    """
    Create a new contractor configuration in Supabase.

    Args:
        contractor_name: e.g., "ABC Heating & Cooling"
        contractor_email: e.g., "john@abcheating.com"
        trades: ["hvac", "plumbing"]
        markets: ["residential", "commercial"]
        phases: ["sales", "install", "service"]
        preset_used: "hvac_residential", "full_mep", etc.

    Returns:
        dict with contractor config record
    """
    data = {
        "contractor_name": contractor_name,
        "contractor_email": contractor_email,
        "trades": trades,
        "markets": markets,
        "phases": phases,
        "preset_used": preset_used,
        "is_active": True,
        "created_by": "contractor-wizard"
    }

    response = supabase.table("mep_contractor_configs").insert(data).execute()
    return response.data[0] if response.data else None


# Example usage
config = create_contractor_config(
    contractor_name="ABC Heating & Cooling",
    contractor_email="john@abcheating.com",
    trades=["hvac", "plumbing"],
    markets=["residential", "commercial"],
    phases=["sales", "design", "install", "commissioning", "service"],
    preset_used="hvac_residential"
)

print(f"Created contractor config: {config['id']}")
contractor_config_id = config['id']
```

### Update Contractor Config Templates

```python
def update_contractor_templates(
    contractor_id: str,
    template_names: list[str]
) -> dict:
    """Enable specific templates for a contractor."""
    response = supabase.table("mep_contractor_configs").update({
        "templates_enabled": template_names,
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", contractor_id).execute()

    return response.data[0] if response.data else None


# Example: Enable HVAC templates
hvac_templates = [
    "hvac_lead_intake",
    "hvac_site_survey",
    "hvac_equipment_proposal",
    "hvac_ac_inspection"
]

config = update_contractor_templates(contractor_config_id, hvac_templates)
print(f"Updated templates: {config['templates_enabled_count']} enabled")
```

### Get Contractor Summary

```python
def get_contractor_summary(contractor_name: str) -> dict:
    """Get contractor activity summary from view."""
    response = supabase.table("contractor_summary").select(
        "*"
    ).eq("contractor_name", contractor_name).execute()

    return response.data[0] if response.data else None


# Example
summary = get_contractor_summary("ABC Heating & Cooling")
print(f"""
Contractor: {summary['contractor_name']}
Total Submissions: {summary['total_submissions']}
Submitted: {summary['submitted_submissions']}
Approved: {summary['approved_submissions']}
Last Submission: {summary['last_submission_at']}
""")
```

---

## Form Submission Management

### Create Form Submission

```python
def create_form_submission(
    template_id: str,
    contractor_config_id: str,
    form_title: str,
    form_data: dict,
    submitted_by: str
) -> dict:
    """
    Create a new form submission.

    Args:
        template_id: UUID of template
        contractor_config_id: UUID of contractor config
        form_title: Display name for submission
        form_data: Dictionary of field values
        submitted_by: Email of submitter

    Returns:
        dict with submission record
    """
    # Use PostgreSQL function for auto-increment submission number
    response = supabase.rpc("create_form_submission", {
        "p_template_id": template_id,
        "p_contractor_id": contractor_config_id,
        "p_form_title": form_title,
        "p_form_data": form_data,
        "p_submitted_by": submitted_by
    }).execute()

    if response.data:
        # Fetch the created submission
        submission_id = response.data
        sub_response = supabase.table("mep_form_submissions").select(
            "*"
        ).eq("id", submission_id).execute()
        return sub_response.data[0] if sub_response.data else None

    return None


# Example: Create lead intake submission
form_data = {
    "customerName": "John Smith",
    "customerEmail": "john@example.com",
    "customerPhone": "555-1234",
    "address": "123 Main St, Denver, CO",
    "systemType": "Central AC",
    "estimatedBudget": "$5000-7000",
    "notes": "New install, 2-story home"
}

# First get template ID
template_response = supabase.table("templates").select("id").eq(
    "name", "hvac_lead_intake"
).execute()
template_id = template_response.data[0]['id']

submission = create_form_submission(
    template_id=template_id,
    contractor_config_id=contractor_config_id,
    form_title="Acme HVAC - John Smith Lead",
    form_data=form_data,
    submitted_by="sales@abcheating.com"
)

print(f"Created submission: {submission['id']} (Submission #{submission['submission_number']})")
submission_id = submission['id']
```

### Submit/Approve Form

```python
def submit_form_submission(submission_id: str) -> dict:
    """Mark form as submitted."""
    response = supabase.table("mep_form_submissions").update({
        "status": "submitted",
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", submission_id).execute()

    return response.data[0] if response.data else None


def approve_form_submission(submission_id: str) -> dict:
    """Mark form as approved."""
    response = supabase.table("mep_form_submissions").update({
        "status": "approved",
        "updated_at": datetime.utcnow().isoformat()
    }).eq("id", submission_id).execute()

    return response.data[0] if response.data else None


# Example
submission = submit_form_submission(submission_id)
print(f"Submission status: {submission['status']}")
print(f"Submitted at: {submission['submitted_at']}")

# Later, after review
submission = approve_form_submission(submission_id)
print(f"Approved at: {submission['approved_at']}")
```

### Get Form Submissions

```python
def get_form_submissions(
    contractor_name: str,
    status: str = None,
    days: int = 30
) -> list[dict]:
    """Get form submissions for a contractor."""
    query = supabase.table("form_submission_details").select("*").eq(
        "contractor_name", contractor_name
    )

    if status:
        query = query.eq("status", status)

    # Last N days
    cutoff = datetime.utcnow() - timedelta(days=days)
    query = query.gte("submitted_at", cutoff.isoformat())

    response = query.order("submitted_at", desc=True).execute()
    return response.data


# Example
submissions = get_form_submissions(
    contractor_name="ABC Heating & Cooling",
    status="submitted",
    days=7
)

for sub in submissions:
    print(f"""
    {sub['form_title']}
    Template: {sub['template_name']}
    Trade: {sub['template_trade']}
    Status: {sub['status']}
    Submitted: {sub['submitted_at']}
    """)
```

---

## CSV Import Tracking

### Initialize CSV Import

```python
def start_csv_import(
    contractor_config_id: str,
    csv_filename: str,
    coperniq_type: str,
    file_size: int,
    file_hash: str,
    imported_by: str
) -> str:
    """
    Initialize a new CSV import.

    Returns:
        import_id UUID
    """
    response = supabase.rpc("create_csv_import", {
        "p_contractor_id": contractor_config_id,
        "p_import_name": csv_filename,
        "p_coperniq_type": coperniq_type,
        "p_imported_by": imported_by,
        "p_file_size_bytes": file_size,
        "p_file_hash": file_hash
    }).execute()

    return response.data


# Example
import hashlib

def calculate_file_hash(file_path: str) -> str:
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()


# Import Contact.csv
csv_path = "Contact.csv"
file_size = os.path.getsize(csv_path)
file_hash = calculate_file_hash(csv_path)

import_id = start_csv_import(
    contractor_config_id=contractor_config_id,
    csv_filename="Contact.csv",
    coperniq_type="Contact",
    file_size=file_size,
    file_hash=file_hash,
    imported_by="admin@example.com"
)

print(f"Started CSV import: {import_id}")
```

### Add Records to Import

```python
import csv

def import_csv_file(
    import_id: str,
    csv_path: str
) -> tuple[int, int, int]:
    """
    Process CSV file and add records to import.

    Returns:
        (total_attempted, total_success, total_failed)
    """
    total = 0
    success = 0
    failed = 0

    with open(csv_path, 'r') as csvfile:
        reader = csv.DictReader(csvfile)
        for row_num, row in enumerate(reader, 1):
            try:
                response = supabase.rpc("add_csv_import_record", {
                    "p_import_id": import_id,
                    "p_record_number": row_num,
                    "p_record_data": row,
                    "p_status": "valid"
                }).execute()

                if response.data:
                    success += 1
                else:
                    failed += 1
            except Exception as e:
                print(f"Error importing row {row_num}: {e}")
                failed += 1

            total += 1

            # Progress feedback
            if total % 100 == 0:
                print(f"Processed {total} records...")

    return total, success, failed


# Example
records_total, records_success, records_failed = import_csv_file(
    import_id=import_id,
    csv_path="Contact.csv"
)

print(f"""
CSV Import Complete:
  Total records: {records_total}
  Success: {records_success}
  Failed: {records_failed}
  Success rate: {records_success/records_total*100:.1f}%
""")

# Update import status
supabase.table("csv_imports").update({
    "total_records_attempted": records_total,
    "total_records_success": records_success,
    "total_records_failed": records_failed,
    "status": "success" if records_failed == 0 else "partial_success",
    "completed_at": datetime.utcnow().isoformat()
}).eq("id", import_id).execute()
```

### Get Import Summary

```python
def get_csv_import_summary(contractor_name: str) -> list[dict]:
    """Get CSV import history for contractor."""
    response = supabase.table("csv_import_summary").select(
        "*"
    ).eq("contractor_name", contractor_name).order(
        "created_at", desc=True
    ).execute()

    return response.data


# Example
imports = get_csv_import_summary("ABC Heating & Cooling")

for imp in imports:
    print(f"""
    Import: {imp['import_name']}
    Type: {imp['coperniq_type']}
    Status: {imp['status']}
    Records: {imp['total_records_success']}/{imp['total_records_attempted']}
    Success Rate: {imp['success_rate']}%
    Duration: {imp['duration_seconds']} seconds
    """)
```

### Find Failed Records

```python
def get_failed_records(import_id: str) -> list[dict]:
    """Get failed/error records from import."""
    response = supabase.table("csv_import_records").select(
        "record_number, record_key, status, error_message, invalid_fields"
    ).eq("csv_import_id", import_id).in_(
        "status", ["error", "duplicate", "warning"]
    ).order("record_number").execute()

    return response.data


# Example
failed = get_failed_records(import_id)

for record in failed:
    print(f"""
    Row {record['record_number']}: {record['record_key']}
    Status: {record['status']}
    Error: {record['error_message']}
    Invalid fields: {record['invalid_fields']}
    """)
```

---

## Coperniq Synchronization

### Log Sync Operation

```python
def log_coperniq_sync(
    csv_import_id: str,
    operation_type: str,
    entity_type: str,
    records_processed: int,
    records_successful: int,
    records_failed: int,
    status: str,
    performed_by: str,
    transaction_id: str = None,
    error_message: str = None
) -> str:
    """
    Log a Coperniq sync operation to audit trail.

    Returns:
        log_id UUID
    """
    response = supabase.rpc("log_coperniq_sync", {
        "p_csv_import_id": csv_import_id,
        "p_operation_type": operation_type,
        "p_entity_type": entity_type,
        "p_records_processed": records_processed,
        "p_records_successful": records_successful,
        "p_records_failed": records_failed,
        "p_status": status,
        "p_performed_by": performed_by,
        "p_transaction_id": transaction_id,
        "p_error_message": error_message
    }).execute()

    return response.data


# Example: After successful Coperniq import
log_id = log_coperniq_sync(
    csv_import_id=import_id,
    operation_type="import",
    entity_type="Contact",
    records_processed=150,
    records_successful=148,
    records_failed=2,
    status="partial_success",
    performed_by="orchestrator@example.com",
    transaction_id="coperniq-tx-20251220-001",
    error_message=None
)

print(f"Logged sync operation: {log_id}")
```

### Get Sync History

```python
def get_sync_history(
    contractor_name: str,
    entity_type: str = None,
    days: int = 30
) -> list[dict]:
    """Get Coperniq sync history for contractor."""
    query = supabase.table("coperniq_sync_history").select(
        "*"
    ).eq("contractor_name", contractor_name)

    if entity_type:
        query = query.eq("entity_type", entity_type)

    cutoff = datetime.utcnow() - timedelta(days=days)
    query = query.gte("started_at", cutoff.isoformat())

    response = query.order("started_at", desc=True).execute()
    return response.data


# Example
sync_history = get_sync_history(
    contractor_name="ABC Heating & Cooling",
    entity_type="Contact",
    days=7
)

for sync in sync_history:
    print(f"""
    Operation: {sync['operation_type']} {sync['entity_type']}
    Status: {sync['status']}
    Records: {sync['records_successful']}/{sync['records_processed']}
    Response time: {sync['api_response_time_ms']}ms
    Transaction: {sync['transaction_id']}
    """)
```

### Handle Sync Errors

```python
def get_failed_syncs(days: int = 7) -> list[dict]:
    """Get all failed sync operations."""
    cutoff = datetime.utcnow() - timedelta(days=days)

    response = supabase.table("coperniq_sync_history").select(
        "*"
    ).neq("status", "success").gte(
        "started_at", cutoff.isoformat()
    ).order("started_at", desc=True).execute()

    return response.data


# Example
failed_syncs = get_failed_syncs(days=7)

for sync in failed_syncs:
    print(f"""
    ERROR: {sync['entity_type']} import
    Contractor: {sync['contractor_name']}
    Error: {sync['api_error_message']}
    Time: {sync['started_at']}
    """)
```

---

## Template Usage Analytics

### Record Template Usage

```python
def record_template_action(
    template_id: str,
    contractor_config_id: str,
    action: str,  # viewed, filled, submitted, edited, exported
    user_email: str,
    time_spent_seconds: int = None,
    submission_id: str = None
) -> str:
    """
    Record a template usage action for analytics.

    Returns:
        usage_id UUID
    """
    response = supabase.rpc("record_template_usage", {
        "p_template_id": template_id,
        "p_contractor_id": contractor_config_id,
        "p_action": action,
        "p_user_email": user_email,
        "p_time_spent_seconds": time_spent_seconds
    }).execute()

    return response.data


# Example: Log template view
template_response = supabase.table("templates").select("id").eq(
    "name", "hvac_lead_intake"
).execute()
template_id = template_response.data[0]['id']

usage_id = record_template_action(
    template_id=template_id,
    contractor_config_id=contractor_config_id,
    action="viewed",
    user_email="sales@abcheating.com"
)

# Log form submission
usage_id = record_template_action(
    template_id=template_id,
    contractor_config_id=contractor_config_id,
    action="submitted",
    user_email="sales@abcheating.com",
    time_spent_seconds=1250,
    submission_id=submission_id
)
```

### Get Template Analytics

```python
def get_template_analytics(trade: str = None) -> list[dict]:
    """Get template usage analytics."""
    query = supabase.table("template_usage_analytics").select("*")

    if trade:
        query = query.eq("trade", trade)

    response = query.order("submissions", desc=True).execute()
    return response.data


# Example
analytics = get_template_analytics(trade="hvac")

for template in analytics:
    print(f"""
    {template['template_name']}
    Unique contractors: {template['unique_contractors']}
    Views: {template['views']}
    Fills: {template['fills']}
    Submissions: {template['submissions']}
    Avg time: {template['avg_time_spent_seconds']}s
    Last used: {template['last_used_at']}
    """)
```

### Get Contractor Template Stats

```python
def get_contractor_template_stats(contractor_config_id: str) -> list[dict]:
    """Get template usage stats for specific contractor."""
    response = supabase.rpc("get_contractor_template_stats", {
        "config_id": contractor_config_id
    }).execute()

    return response.data


# Example
stats = get_contractor_template_stats(contractor_config_id)

for stat in stats:
    print(f"""
    {stat['template_name']}
    Trade: {stat['trade']}
    Views: {stat['views']}
    Fills: {stat['fills']}
    Submissions: {stat['submissions']}
    Last used: {stat['last_used_at']}
    """)
```

---

## Data Lineage Tracking

### Create Data Lineage Record

```python
def create_data_lineage(
    csv_import_record_id: str = None,
    form_submission_id: str = None,
    coperniq_entity_type: str,
    coperniq_entity_id: str,
    coperniq_company_id: str,
    transformation_applied: str = None,
    data_quality_score: float = 1.0
) -> str:
    """
    Create a data lineage record tracking data flow.

    Returns:
        lineage_id UUID
    """
    response = supabase.table("data_lineage").insert({
        "csv_import_record_id": csv_import_record_id,
        "form_submission_id": form_submission_id,
        "coperniq_entity_type": coperniq_entity_type,
        "coperniq_entity_id": coperniq_entity_id,
        "coperniq_company_id": coperniq_company_id,
        "transformation_applied": transformation_applied,
        "data_quality_score": data_quality_score
    }).execute()

    return response.data[0]['id'] if response.data else None


# Example: Track CSV → Coperniq flow
# After successfully importing Contact
lineage_id = create_data_lineage(
    csv_import_record_id=csv_record_id,
    coperniq_entity_type="Contact",
    coperniq_entity_id="coperniq-contact-12345",
    coperniq_company_id="112",  # Sandbox company
    transformation_applied="trim, validate email",
    data_quality_score=0.95
)

print(f"Created lineage record: {lineage_id}")
```

### Get Data Quality Report

```python
def get_low_quality_records(threshold: float = 0.8) -> list[dict]:
    """Get records below quality threshold."""
    response = supabase.table("data_lineage").select(
        "*"
    ).lt("data_quality_score", threshold).order(
        "data_quality_score"
    ).execute()

    return response.data


# Example
low_quality = get_low_quality_records(threshold=0.9)

for record in low_quality:
    print(f"""
    {record['coperniq_entity_type']}: {record['coperniq_entity_id']}
    Quality: {record['data_quality_score']}
    Transformation: {record['transformation_applied']}
    """)
```

---

## Orchestrator Integration Pattern

```python
# orchestrator.py integration example

from agents.base import OpenRouterClient

class MEPOrchestrator:
    def __init__(self):
        self.supabase = create_client(os.getenv("SUPABASE_URL"),
                                      os.getenv("SUPABASE_SERVICE_KEY"))
        self.client = OpenRouterClient()

    def process_contractor_wizard(self, contractor_data: dict) -> str:
        """Process contractor through wizard and create config."""
        # Create contractor config
        config = create_contractor_config(**contractor_data)
        return config['id']

    def process_csv_import(self,
                          contractor_id: str,
                          csv_path: str,
                          coperniq_type: str) -> dict:
        """Process CSV file and sync to Coperniq."""
        # 1. Initialize import
        import_id = start_csv_import(
            contractor_config_id=contractor_id,
            csv_filename=os.path.basename(csv_path),
            coperniq_type=coperniq_type,
            file_size=os.path.getsize(csv_path),
            file_hash=calculate_file_hash(csv_path),
            imported_by="orchestrator@example.com"
        )

        # 2. Import records
        total, success, failed = import_csv_file(import_id, csv_path)

        # 3. Call Coperniq API
        coperniq_result = self._sync_to_coperniq(import_id, coperniq_type)

        # 4. Log sync
        log_coperniq_sync(
            csv_import_id=import_id,
            operation_type="import",
            entity_type=coperniq_type,
            records_processed=total,
            records_successful=coperniq_result['success'],
            records_failed=coperniq_result['failed'],
            status="success" if coperniq_result['failed'] == 0 else "partial_success",
            performed_by="orchestrator@example.com",
            transaction_id=coperniq_result.get('transaction_id')
        )

        # 5. Create lineage
        for record_id in coperniq_result.get('created_ids', []):
            create_data_lineage(
                csv_import_record_id=record_id,
                coperniq_entity_type=coperniq_type,
                coperniq_entity_id=coperniq_result[record_id],
                coperniq_company_id="112"
            )

        return {
            "import_id": import_id,
            "total": total,
            "success": success,
            "failed": failed,
            "synced": coperniq_result['success']
        }
```

---

## Error Handling & Retries

```python
import time
from typing import Optional

def retry_operation(func, max_retries: int = 3, delay: int = 2):
    """Decorator for retrying failed operations."""
    def wrapper(*args, **kwargs):
        for attempt in range(max_retries):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise
                print(f"Attempt {attempt + 1} failed: {e}. Retrying in {delay}s...")
                time.sleep(delay)

    return wrapper


@retry_operation
def sync_to_coperniq_with_retry(import_id: str):
    """Sync to Coperniq with automatic retry."""
    # Your sync logic here
    pass


# Usage
try:
    result = sync_to_coperniq_with_retry(import_id)
except Exception as e:
    print(f"Sync failed after retries: {e}")
    # Log error
    log_coperniq_sync(
        csv_import_id=import_id,
        operation_type="import",
        entity_type="Contact",
        records_processed=0,
        records_successful=0,
        records_failed=0,
        status="failed",
        performed_by="orchestrator@example.com",
        error_message=str(e)
    )
```

---

## Performance Considerations

### Batch Operations

```python
def batch_add_csv_records(
    import_id: str,
    records: list[dict],
    batch_size: int = 100
) -> tuple[int, int]:
    """Add CSV records in batches for better performance."""
    success = 0
    failed = 0

    for i in range(0, len(records), batch_size):
        batch = records[i:i+batch_size]

        for record_num, record_data in enumerate(batch, i+1):
            try:
                supabase.rpc("add_csv_import_record", {
                    "p_import_id": import_id,
                    "p_record_number": record_num,
                    "p_record_data": record_data,
                    "p_status": "valid"
                }).execute()
                success += 1
            except:
                failed += 1

        # Batch complete log
        print(f"Processed batch {i//batch_size + 1}...")

    return success, failed
```

### Connection Pooling

```python
# Supabase automatically provides pgBouncer connection pooling
# Pool size: 10-20 connections per user
# Mode: Transaction (for most applications)

# Recommended: Reuse single Supabase client instance
# Avoid creating new clients in loops

supabase_client = create_client(url, key)  # Create once

def process_batch(items):
    """Good: Reuse client"""
    for item in items:
        supabase_client.table("...").insert(item).execute()

def bad_process_batch(items):
    """Bad: Creates new client each time"""
    for item in items:
        new_client = create_client(url, key)
        new_client.table("...").insert(item).execute()
```

---

**Last Updated:** 2025-12-20
**Status:** Production-Ready Examples
