#!/usr/bin/env python3
"""
Sync Work Order Template Audits to Supabase
Usage: python sync_work_order_audit.py
"""

import os
import json
from datetime import datetime
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

# Initialize Supabase client
supabase: Client = create_client(
    os.getenv("NEXT_PUBLIC_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")  # Use service role for writes
)

def sync_work_order(
    coperniq_id: str,
    name: str,
    work_order_type: str,  # 'field' or 'office'
    trade: str,
    category: str,
    instructions: str,
    checklist_items: list[str],
    audit_score: int,
    audit_notes: str,
    improvements_suggested: list[str] = None,
    priority: str = "medium",
    phase: str = None,
    compliance_standards: list[str] = None
):
    """Sync a work order template and its checklist to Supabase."""

    # 1. Upsert the work order template
    wo_data = {
        "coperniq_id": coperniq_id,
        "coperniq_url": f"https://app.coperniq.io/112/company/studio/templates/{work_order_type}-wo-templates/{coperniq_id}",
        "name": name,
        "work_order_type": work_order_type,
        "trade": trade,
        "category": category,
        "instructions": instructions,
        "priority": priority,
        "phase": phase,
        "compliance_standards": compliance_standards or [],
        "audit_score": audit_score,
        "audit_notes": audit_notes,
        "audit_date": datetime.now().isoformat(),
        "improvements_suggested": improvements_suggested or [],
        "version": "1.0",
        "is_active": True,
        "created_by": "claude-code"
    }

    # Upsert work order
    result = supabase.table("ps_work_orders").upsert(
        wo_data,
        on_conflict="coperniq_id"
    ).execute()

    wo_id = result.data[0]["id"]
    print(f"✓ Synced work order: {name} (ID: {wo_id})")

    # 2. Delete existing checklist items and insert new ones
    supabase.table("ps_work_order_checklist").delete().eq("work_order_id", wo_id).execute()

    # 3. Insert checklist items
    checklist_data = [
        {
            "work_order_id": wo_id,
            "item_text": item,
            "display_order": idx + 1,
            "is_actionable": True
        }
        for idx, item in enumerate(checklist_items)
    ]

    if checklist_data:
        supabase.table("ps_work_order_checklist").insert(checklist_data).execute()
        print(f"  ✓ Synced {len(checklist_data)} checklist items")

    # 4. Log audit history
    audit_data = {
        "template_type": f"{work_order_type}_work_order",
        "template_id": wo_id,
        "audit_score": audit_score,
        "audit_notes": audit_notes,
        "criteria_scores": {"checklist_count": len(checklist_items)},
        "missing_items": improvements_suggested or [],
        "improvements_suggested": improvements_suggested or [],
        "audited_by": "claude-code"
    }

    supabase.table("ps_audit_history").insert(audit_data).execute()
    print(f"  ✓ Logged audit history (Score: {audit_score}/10)")

    return wo_id


# ============================================================================
# AUDITED TEMPLATES - Run this to sync all audited templates
# ============================================================================

if __name__ == "__main__":
    print("=" * 60)
    print("Syncing Work Order Template Audits to Supabase")
    print("=" * 60)

    # Template 1: HVAC Permit Application Tracking
    sync_work_order(
        coperniq_id="1777608",
        name="HVAC Permit Application Tracking",
        work_order_type="office",
        trade="hvac",
        category="permit",
        instructions="Office work order for tracking HVAC permit applications through the approval process.",
        checklist_items=[
            "Record equipment specifications (make, model, tonnage, BTU)",
            "Complete load calculation review",
            "Verify contractor license validity",
            "Document site address and scope of work",
            "Track application fee payment",
            "Prepare submittal package including plans, specifications, and calculations",
            "Note application submission date",
            "Record permit number when received",
            "Estimate expected permit approval timeline"
        ],
        audit_score=7,
        audit_notes="Solid permit tracking workflow. Missing AHJ-specific requirements tracking.",
        improvements_suggested=[
            "Add AHJ-specific requirements lookup",
            "Add status tracking (submitted/under review/corrections/approved)",
            "Add correction/resubmittal tracking",
            "Add inspection scheduling after approval"
        ],
        phase="permit"
    )

    # Template 2: HVAC Load Calculation Review
    sync_work_order(
        coperniq_id="1777609",
        name="HVAC Load Calculation Review",
        work_order_type="office",
        trade="hvac",
        category="design",
        instructions="Office work order for reviewing HVAC load calculations per ACCA Manual J standards.",
        checklist_items=[
            "Receive and verify Manual J load calculation",
            "Verify building square footage is correct",
            "Confirm correct climate zone for the location",
            "Document insulation R-values used in calculation",
            "Review window specifications affecting load",
            "Check completeness of ductwork design (Manual D)",
            "Ensure equipment sizing matches load calculation results",
            "Verify that equipment is right-sized with no oversizing",
            "Obtain and record customer approval of recommended tonnage",
            "Document load calculation software/method used"
        ],
        audit_score=8,
        audit_notes="Strong ACCA-aligned template. Follows Manual J/D standards.",
        improvements_suggested=[
            "Add Manual S equipment selection reference",
            "Add infiltration rate verification",
            "Add internal heat gains consideration"
        ],
        compliance_standards=["ACCA Manual J", "ACCA Manual D"],
        phase="design"
    )

    # Template 3: Equipment Quote Preparation
    sync_work_order(
        coperniq_id="1777612",
        name="Equipment Quote Preparation",
        work_order_type="office",
        trade="hvac",
        category="sales",
        instructions="Office work order for HVAC sales staff to prepare customer-facing equipment quotes.",
        checklist_items=[
            "Verify customer information including name, address, and contact details",
            "Review load calculation to confirm requirements",
            "Select appropriate equipment based on load calculation, specifying make, model, and capacity",
            "Lookup current pricing from distributor for equipment and labor estimate",
            "Research available rebates and incentives including utility, manufacturer, and federal programs",
            "Document financing options if applicable",
            "Establish and note the quote valid date",
            "Complete the proposal template with all relevant details",
            "Confirm customer delivery method for the quote (email, print, or in-person)",
            "Schedule follow-up date to review quote with customer"
        ],
        audit_score=8,
        audit_notes="Strong sales workflow. Links load calc to equipment selection.",
        improvements_suggested=[
            "Add equipment availability/lead time check",
            "Add Good/Better/Best options presentation",
            "Add warranty terms documentation",
            "Add permit cost inclusion"
        ],
        phase="sales"
    )

    # Template 4: Warranty Registration for Newly Installed HVAC Equipment
    sync_work_order(
        coperniq_id="1777613",
        name="Warranty Registration for Newly Installed HVAC Equipment",
        work_order_type="office",
        trade="hvac",
        category="post_install",
        instructions="This office task ensures that all newly installed HVAC equipment is properly registered with the manufacturer for warranty coverage. Proper registration protects the customer's warranty rights and keeps all documentation organized.",
        checklist_items=[
            "Verify installation completion",
            "Collect equipment serial numbers (indoor unit, outdoor unit, coil)",
            "Document model numbers",
            "Record install date",
            "Capture installer/technician name",
            "Verify customer name and address",
            "Access manufacturer warranty portal",
            "Submit online registration",
            "Receive confirmation number",
            "Offer extended warranty upsell if applicable",
            "Save registration documents to project file",
            "Notify customer of warranty terms"
        ],
        audit_score=8,
        audit_notes="Comprehensive warranty registration workflow. Covers all equipment components and includes upsell opportunity.",
        improvements_suggested=[
            "Add AHRI matched system verification",
            "Add start-up/commissioning form verification",
            "Add labor vs parts warranty distinction",
            "Add certified installer verification"
        ],
        phase="closeout"
    )

    # Template 5: Plumbing Permit Application Process
    sync_work_order(
        coperniq_id="1777614",
        name="Plumbing Permit Application Process",
        work_order_type="office",
        trade="plumbing",
        category="permit",
        instructions="Office work order for tracking plumbing permit applications through the approval process.",
        checklist_items=[
            "Document scope of work (water heater, repipe, fixtures, etc.)",
            "Verify contractor license is current",
            "Collect site address and property details",
            "Review plumbing plans and specifications",
            "Calculate permit fees",
            "Prepare submittal package",
            "Submit application to AHJ",
            "Track application status",
            "Record permit number when issued",
            "Schedule rough-in and final inspections"
        ],
        audit_score=7,
        audit_notes="Good basic permit workflow. Missing plumbing-specific requirements like fixture counts, code references.",
        improvements_suggested=[
            "Add fixture count/unit calculation",
            "Add IPC/UPC code reference field",
            "Add backflow preventer requirements check",
            "Add water heater BTU/gallon specs",
            "Add gas line permit coordination if applicable"
        ],
        phase="permit"
    )

    # Template 6: Electrical Permit Application for MEP Contractors
    sync_work_order(
        coperniq_id="1777615",
        name="Electrical Permit Application for MEP Contractors",
        work_order_type="office",
        trade="electrical",
        category="permit",
        instructions="This office work order outlines the steps required for MEP contractors to apply for an electrical permit successfully.",
        checklist_items=[
            "Gather electrical drawings and load calculations",
            "Complete electrical permit application form",
            "Verify contractor license is current",
            "Pay permit fees",
            "Submit application to AHJ",
            "Track permit status",
            "Respond to plan review comments",
            "Receive electrical permit approval",
            "File permit in project folder",
            "Notify field crew permit is ready",
            "Schedule rough-in inspection"
        ],
        audit_score=5,
        audit_notes="Basic workflow structure but lacks technical depth. Missing NEC code references, service size specification, panel schedules.",
        improvements_suggested=[
            "Add NEC code compliance documentation (Article 220, 230, 408)",
            "Add service size specification field (100A/200A/400A/600A)",
            "Add panel schedule requirement",
            "Add voltage/phase specifications",
            "Add grounding electrode system details",
            "Add plan review comment tracking"
        ],
        phase="permit",
        compliance_standards=["NEC"]
    )

    # Template 7: Backflow Prevention Test Scheduling
    sync_work_order(
        coperniq_id="1777616",
        name="Backflow Prevention Test Scheduling",
        work_order_type="office",
        trade="plumbing",
        category="compliance",
        instructions="This office work order is for scheduling annual backflow device certification required by water utilities for plumbing contractors.",
        checklist_items=[
            "Pull list of backflow devices due for testing",
            "Verify certified tester availability",
            "Contact customer to schedule appointment",
            "Confirm test date with water utility",
            "Generate work order for field tester",
            "Receive completed test report",
            "Review test results (pass/fail)",
            "Submit certification to water utility",
            "File test report in customer record",
            "Update next test due date in system",
            "Invoice customer for testing service"
        ],
        audit_score=4,
        audit_notes="Basic scheduling workflow but lacks essential compliance and tracking features. Missing device types, tester credentials, and test results documentation.",
        improvements_suggested=[
            "Add certified tester tracking (name, license #, certification expiry)",
            "Add device type classification (DCVA, RPBA, PVB)",
            "Add device serial number and installation date",
            "Add test results documentation (pressure readings)",
            "Add automated annual reminder system",
            "Add water district-specific requirements"
        ],
        phase="service"
    )

    # Template 8: Service Agreement Renewal Process
    sync_work_order(
        coperniq_id="1777617",
        name="Service Agreement Renewal Process for O&M Contractors",
        work_order_type="office",
        trade="hvac",
        category="om",
        instructions="Office work order for managing service agreement renewals and customer retention for O&M contractors.",
        checklist_items=[
            "Pull list of agreements expiring in 60 days",
            "Review customer service history",
            "Calculate renewal pricing with any adjustments",
            "Prepare renewal offer with upsell options",
            "Contact customer to discuss renewal",
            "Document customer response",
            "Process renewal paperwork if accepted",
            "Update agreement in system with new dates",
            "Generate renewal invoice",
            "Send confirmation to customer",
            "Update technician schedules for new term"
        ],
        audit_score=2,
        audit_notes="Template needs significant enhancement. Missing satisfaction tracking, auto-renewal options, churn prevention workflows, and tier upgrade logic.",
        improvements_suggested=[
            "Add customer satisfaction score tracking",
            "Add auto-renewal opt-in/opt-out management",
            "Add tier upgrade recommendations (Bronze→Silver→Gold)",
            "Add churn prevention special offers",
            "Add 90/60/30-day pre-expiration notifications",
            "Add multi-year discount options",
            "Add payment method validation"
        ],
        phase="om"
    )

    # Template 9: Vendor PO Processing for MEP and Multi-Trade Contractors
    sync_work_order(
        coperniq_id="1777618",
        name="Vendor PO Processing for MEP and Multi-Trade Contractors",
        work_order_type="office",
        trade="multi_trade",
        category="procurement",
        instructions="This task manages the equipment purchase order workflows from quote to delivery for MEP and Multi-Trade contractors.",
        checklist_items=[
            "Receive equipment request from project/sales team",
            "Identify approved vendors for requested equipment",
            "Request quotes from 2-3 vendors",
            "Compare pricing, lead times, and warranty terms",
            "Select vendor and create purchase order",
            "Submit PO to vendor via email or portal",
            "Confirm order acknowledgment received",
            "Track shipping and delivery status",
            "Coordinate delivery with job site or warehouse",
            "Verify equipment received matches the purchase order",
            "Process vendor invoice for payment",
            "File documentation in project record"
        ],
        audit_score=7,
        audit_notes="Solid foundation for PO management. Good coverage of lead time tracking and delivery monitoring. Missing budget verification and formal three-way match.",
        improvements_suggested=[
            "Add budget verification/approval gate",
            "Add explicit three-way match (PO vs Receipt vs Invoice)",
            "Add change order management step",
            "Add vendor performance rating",
            "Add warranty tracking documentation",
            "Add quality inspection upon receipt"
        ],
        phase="procurement"
    )

    # Template 12: Lien Waiver Processing for MEP and Multi-Trade Contractors
    sync_work_order(
        coperniq_id="1777621",
        name="Lien Waiver Processing for MEP and Multi-Trade Contractors",
        work_order_type="office",
        trade="multi_trade",
        category="finance",
        instructions="This office work order manages the collection and tracking of lien waivers from subcontractors and suppliers for projects involving MEP and multi-trade contractors.",
        checklist_items=[
            "Identify project requiring lien waivers",
            "Generate list of all subcontractors and suppliers on project",
            "Send conditional lien waiver request to each party",
            "Track receipt of signed waivers",
            "Verify waiver amounts match payment amounts",
            "Review waiver for proper notarization if required",
            "File waiver in project documentation",
            "Request unconditional waiver upon final payment",
            "Update accounting system with waiver status",
            "Notify project manager of missing waivers",
            "Escalate delinquent waivers to management",
            "Archive completed waiver package"
        ],
        audit_score=6,
        audit_notes="Good lifecycle coverage with both conditional/unconditional waivers. Needs stronger payment hold gates, date tracking, and GC waiver handling.",
        improvements_suggested=[
            "Add payment hold gate - DO NOT PROCESS until waiver received",
            "Add date tracking (request date, receipt date, expiration)",
            "Add release authorization workflow",
            "Add GC-level waiver requirements",
            "Add state-specific waiver form compliance",
            "Add waiver aging report generation"
        ],
        phase="closeout"
    )

    # Template 13: Code Compliance Review for MEP and Multi-Trade Contractors
    sync_work_order(
        coperniq_id="1777622",
        name="Code Compliance Review for MEP and Multi-Trade Contractors",
        work_order_type="office",
        trade="multi_trade",
        category="permit",
        instructions="This office task involves conducting a thorough pre-permit code compliance review to ensure that all MEP and multi-trade contractor work complies with local building codes before permit submission.",
        checklist_items=[
            "Identify project requiring code compliance review",
            "Pull current applicable building codes for jurisdiction",
            "Review proposed work against current code requirements",
            "Check for any recent code amendments or updates",
            "Verify equipment specifications meet code minimums",
            "Review installation methods for code compliance",
            "Check clearance and access requirements",
            "Verify electrical load calculations if applicable",
            "Review plumbing fixture counts and sizing",
            "Document any code variances requiring approval",
            "Prepare code compliance summary for permit application",
            "Archive compliance documentation in project file"
        ],
        audit_score=2,
        audit_notes="Basic framework but critically lacking in specifics. No code version references (IBC, NEC, IPC), no local amendment tracking, weak verification documentation.",
        improvements_suggested=[
            "Add code standards matrix with specific versions (IBC 2021, NEC 2023, IPC 2024)",
            "Add local amendment tracking section",
            "Add non-compliance tracking table with severity levels",
            "Add verification methods for each trade discipline",
            "Add AHJ-specific compliance checklist",
            "Add code interpretation log for ambiguous requirements"
        ],
        phase="permit",
        compliance_standards=["IBC", "NEC", "IPC", "IMC"]
    )

    print("\n" + "=" * 60)
    print("Sync complete! Check Supabase dashboard to verify.")
    print("=" * 60)
