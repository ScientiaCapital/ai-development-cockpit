#!/usr/bin/env python3
"""
Collections Agent - Kipper Energy Solutions
=============================================

Handles accounts receivable follow-up:
- Invoice aging analysis
- Payment reminder sequences
- Collection call scripts
- Payment plan negotiations
- Lien/legal escalation criteria

Integration Points:
- Coperniq API: Financial documents, invoices, contacts
- Voice AI: Outbound collection calls
- QuickBooks/Xero: Payment status sync
"""

import os
import json
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from dotenv import load_dotenv
import anthropic

load_dotenv()

AGENT_NAME = "Collections Agent"
AGENT_VERSION = "1.0.0"

SYSTEM_PROMPT = """You are the Collections Agent for Kipper Energy Solutions, responsible for accounts receivable follow-up.

## Your Role
- Send professional payment reminders
- Negotiate payment plans for struggling customers
- Maintain customer relationships while securing payment
- Escalate to legal/lien process when necessary

## Collection Timeline
| Days Past Due | Action | Tone |
|---------------|--------|------|
| 1-14 days | Friendly reminder | Helpful |
| 15-30 days | Second notice | Professional |
| 31-45 days | Phone call | Firm but fair |
| 46-60 days | Final notice | Serious |
| 60+ days | Legal warning | Formal |
| 90+ days | Lien/collection agency | Legal |

## Payment Options to Offer
1. Full payment (preferred)
2. Credit card on file
3. ACH direct debit
4. 2-3 payment installment plan
5. Financing referral (for larger amounts)

## Guidelines
- Never be rude or threatening
- Document all communication
- Note any disputes or issues
- Escalate commercial accounts differently than residential
- Consider customer lifetime value

## Amounts
- < $500: Email/text sequence
- $500-$2,000: Phone call priority
- > $2,000: Manager notification
- > $10,000: Legal review
"""

TOOLS = [
    {
        "name": "get_aging_report",
        "description": "Get accounts receivable aging report",
        "input_schema": {
            "type": "object",
            "properties": {
                "days_past_due_min": {"type": "integer", "description": "Minimum days past due"},
                "days_past_due_max": {"type": "integer", "description": "Maximum days past due"},
                "customer_type": {"type": "string", "enum": ["residential", "commercial", "all"]}
            }
        }
    },
    {
        "name": "send_payment_reminder",
        "description": "Send payment reminder to customer",
        "input_schema": {
            "type": "object",
            "properties": {
                "invoice_id": {"type": "string"},
                "customer_id": {"type": "string"},
                "channel": {"type": "string", "enum": ["email", "sms", "both"]},
                "template": {"type": "string", "enum": ["friendly_reminder", "second_notice", "final_notice", "legal_warning"]}
            },
            "required": ["invoice_id", "customer_id", "channel", "template"]
        }
    },
    {
        "name": "create_payment_plan",
        "description": "Set up a payment plan for customer",
        "input_schema": {
            "type": "object",
            "properties": {
                "invoice_id": {"type": "string"},
                "total_amount": {"type": "number"},
                "num_payments": {"type": "integer"},
                "first_payment_date": {"type": "string"}
            },
            "required": ["invoice_id", "total_amount", "num_payments"]
        }
    },
    {
        "name": "log_collection_activity",
        "description": "Log collection activity for audit trail",
        "input_schema": {
            "type": "object",
            "properties": {
                "invoice_id": {"type": "string"},
                "activity_type": {"type": "string", "enum": ["call", "email", "sms", "payment_received", "dispute", "promise_to_pay"]},
                "notes": {"type": "string"},
                "next_action_date": {"type": "string"}
            },
            "required": ["invoice_id", "activity_type"]
        }
    },
    {
        "name": "escalate_to_legal",
        "description": "Flag account for legal review or lien filing",
        "input_schema": {
            "type": "object",
            "properties": {
                "invoice_id": {"type": "string"},
                "customer_id": {"type": "string"},
                "reason": {"type": "string"},
                "total_outstanding": {"type": "number"}
            },
            "required": ["invoice_id", "customer_id", "reason", "total_outstanding"]
        }
    }
]


@dataclass
class CollectionsAgent:
    """Collections agent for AR follow-up."""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        self.conversation: List[Dict] = []

    async def analyze_account(self, invoice: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze invoice and recommend collection action."""
        prompt = f"""Review this outstanding invoice and recommend action:

Invoice ID: {invoice.get('id')}
Customer: {invoice.get('customer_name')}
Amount Due: ${invoice.get('amount_due', 0):,.2f}
Days Past Due: {invoice.get('days_past_due', 0)}
Customer Type: {invoice.get('customer_type', 'residential')}
Previous Contact: {invoice.get('last_contact', 'None')}
Payment History: {invoice.get('payment_history', 'Unknown')}

What action should we take?"""

        self.conversation.append({"role": "user", "content": prompt})

        response = self.client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=1024,
            system=SYSTEM_PROMPT,
            tools=TOOLS,
            messages=self.conversation
        )

        result = {"recommendation": "", "actions_taken": []}

        for block in response.content:
            if block.type == "text":
                result["recommendation"] = block.text
            elif block.type == "tool_use":
                result["actions_taken"].append({
                    "tool": block.name,
                    "input": block.input
                })

        return result


async def main():
    """Test collections agent."""
    agent = CollectionsAgent()

    invoice = {
        "id": "INV-2025-12-001",
        "customer_name": "ABC Manufacturing",
        "amount_due": 4500.00,
        "days_past_due": 35,
        "customer_type": "commercial",
        "last_contact": "Email sent 7 days ago",
        "payment_history": "Generally pays within 45 days"
    }

    result = await agent.analyze_account(invoice)
    print("Collections Recommendation:")
    print(result["recommendation"])


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
