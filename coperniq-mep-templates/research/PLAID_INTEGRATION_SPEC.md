# Plaid Integration Specification

**Created:** 2026-01-13
**Status:** DOCUMENTED FOR LATER IMPLEMENTATION
**Priority:** #1 (Highest ROI, Lowest Effort)
**Estimated Effort:** 2-4 days MVP

---

## The $500-$2,000 Problem

### Current Reality for MEP Contractors

```
EVERY WEEK:
1. Technician needs emergency parts at 2pm on a Friday
2. Goes to Home Depot with company credit card
3. Buys $347.82 in materials
4. Receipt goes in truck console or pocket
5. Never logged to any job
6. Office doesn't see it until month-end statement
7. Job gets invoiced without those material costs
8. Margin erodes invisibly
9. Owner wonders why profits are down
```

### The Math

- Average field tech makes 5-10 retail purchases per week
- Average purchase: $75-$150
- Monthly untracked spend per tech: $1,500-$6,000
- 5 techs = $7,500-$30,000/month invisible margin erosion
- **Annual impact:** $90,000-$360,000 per 5-tech company

---

## Why Plaid Solves This

### What Plaid Provides

Plaid's Transactions API gives you:

| Data Point | Example | Use Case |
|------------|---------|----------|
| Date | 2026-01-13 | Match to job timeline |
| Amount | $347.82 | Auto-add to job costs |
| Merchant | "Home Depot #1234" | Know where they shopped |
| Category | "Building Materials" | Confirm it's job-related |
| Location | "123 Main St, Houston TX" | Match to job site proximity |
| Pending | true/false | Real-time tracking |

### Plaid Pricing (2025/2026)

| Tier | Price | What You Get |
|------|-------|--------------|
| Free Tier | $0 | First 200 API calls/month |
| Core Production | ~$1.50/user/month | Unlimited transactions |
| Enterprise | Contact sales | Dedicated support, higher SLAs |

**Bottom Line:** For a 5-tech company, Plaid costs ~$7.50/month and saves $7,500-$30,000/month.

---

## Implementation Architecture

### Phase 1: MVP (2-4 days)

```
┌─────────────────────────────────────────────────────────────┐
│                    PLAID INTEGRATION MVP                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│   │   Plaid     │    │  Coperniq   │    │   User      │     │
│   │   Link      │───▶│  Backend    │───▶│   Review    │     │
│   │ (Bank Auth) │    │ (Sync Job)  │    │  (Confirm)  │     │
│   └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                   │                   │            │
│         ▼                   ▼                   ▼            │
│   User connects      Transactions         One-click         │
│   credit card        auto-sync           attribution        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

```
1. LINK ACCOUNT
   User → Plaid Link → Selects bank → OAuth flow → Access token stored

2. SYNC TRANSACTIONS
   Cron job (every 4 hours) → Plaid API → Get new transactions → Store in DB

3. SMART MATCHING
   New transaction arrives:
   - Check date against active jobs
   - Check location against job sites
   - Check merchant category
   - Check amount (threshold for auto-match)

4. USER REVIEW
   Show unmatched transactions in dashboard
   AI suggests job attribution
   User confirms with one click

5. JOB UPDATE
   Transaction linked → Job material cost updated → Margin recalculated
```

---

## Technical Implementation

### Required Plaid Products

- **Plaid Link** - Frontend widget for bank authentication
- **Plaid Transactions** - API for transaction data
- **Plaid Auth** (optional) - Account/routing numbers for ACH

### API Endpoints

```python
# 1. Create Link Token (for frontend)
POST https://production.plaid.com/link/token/create
{
    "client_id": "YOUR_CLIENT_ID",
    "secret": "YOUR_SECRET",
    "user": {"client_user_id": "user_123"},
    "client_name": "Coperniq",
    "products": ["transactions"],
    "country_codes": ["US"],
    "language": "en"
}

# 2. Exchange Public Token (after user links bank)
POST https://production.plaid.com/item/public_token/exchange
{
    "client_id": "YOUR_CLIENT_ID",
    "secret": "YOUR_SECRET",
    "public_token": "public-sandbox-xxx"
}
# Returns: access_token, item_id

# 3. Get Transactions (recurring sync)
POST https://production.plaid.com/transactions/sync
{
    "client_id": "YOUR_CLIENT_ID",
    "secret": "YOUR_SECRET",
    "access_token": "access-sandbox-xxx",
    "cursor": "last_sync_cursor",
    "count": 500
}
# Returns: added[], modified[], removed[], next_cursor
```

### Transaction Response Structure

```json
{
  "transactions": [
    {
      "transaction_id": "txn_abc123",
      "account_id": "acc_xyz",
      "date": "2026-01-13",
      "amount": 347.82,
      "name": "HOME DEPOT #1234",
      "merchant_name": "Home Depot",
      "category": ["Shops", "Building Materials"],
      "location": {
        "address": "123 Main St",
        "city": "Houston",
        "region": "TX",
        "postal_code": "77001",
        "lat": 29.760427,
        "lon": -95.369804
      },
      "payment_channel": "in store",
      "pending": false
    }
  ]
}
```

---

## Database Schema

### Tables Required

```sql
-- Store linked accounts
CREATE TABLE plaid_accounts (
    id UUID PRIMARY KEY,
    company_id INT REFERENCES companies(id),
    access_token TEXT ENCRYPTED,
    item_id TEXT,
    institution_name TEXT,
    account_name TEXT,
    account_type TEXT,
    sync_cursor TEXT,
    last_sync_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Store synced transactions
CREATE TABLE plaid_transactions (
    id UUID PRIMARY KEY,
    plaid_account_id UUID REFERENCES plaid_accounts(id),
    plaid_transaction_id TEXT UNIQUE,
    date DATE,
    amount DECIMAL(10,2),
    merchant_name TEXT,
    category TEXT[],
    location_city TEXT,
    location_lat DECIMAL(10,6),
    location_lon DECIMAL(10,6),
    -- Attribution
    job_id INT REFERENCES projects(id),
    attributed_by INT REFERENCES users(id),
    attributed_at TIMESTAMP,
    match_confidence DECIMAL(3,2),
    -- Metadata
    raw_data JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_plaid_txn_date ON plaid_transactions(date);
CREATE INDEX idx_plaid_txn_job ON plaid_transactions(job_id);
CREATE INDEX idx_plaid_txn_unattributed ON plaid_transactions(job_id) WHERE job_id IS NULL;
```

---

## AI Smart Matching Algorithm

### Confidence Scoring

```python
def calculate_match_confidence(transaction: dict, job: dict) -> float:
    """
    Calculate confidence score (0.0 - 1.0) for transaction-to-job match.
    """
    score = 0.0

    # 1. Date proximity (max 0.3)
    days_diff = abs((transaction['date'] - job['scheduled_date']).days)
    if days_diff == 0:
        score += 0.30
    elif days_diff <= 1:
        score += 0.25
    elif days_diff <= 3:
        score += 0.15
    elif days_diff <= 7:
        score += 0.05

    # 2. Location proximity (max 0.3)
    if transaction.get('location_lat') and job.get('site_lat'):
        distance_miles = haversine(
            transaction['location_lat'], transaction['location_lon'],
            job['site_lat'], job['site_lon']
        )
        if distance_miles < 1:
            score += 0.30
        elif distance_miles < 5:
            score += 0.20
        elif distance_miles < 15:
            score += 0.10

    # 3. Amount reasonableness (max 0.2)
    # Check if amount is reasonable for job type
    if job.get('estimated_materials_cost'):
        ratio = transaction['amount'] / job['estimated_materials_cost']
        if 0.05 <= ratio <= 0.5:  # 5-50% of estimated materials
            score += 0.20
        elif ratio <= 1.0:
            score += 0.10

    # 4. Merchant category match (max 0.2)
    job_type = job.get('trade', '').lower()
    categories = [c.lower() for c in transaction.get('category', [])]

    relevant_categories = {
        'hvac': ['hardware', 'building materials'],
        'electrical': ['hardware', 'building materials', 'electrical'],
        'plumbing': ['hardware', 'building materials', 'plumbing'],
        'roofing': ['hardware', 'building materials', 'roofing'],
    }

    if any(cat in ' '.join(categories) for cat in relevant_categories.get(job_type, [])):
        score += 0.20

    return min(score, 1.0)


def suggest_job_matches(transaction: dict, active_jobs: list) -> list:
    """
    Return top 3 job suggestions for a transaction.
    """
    matches = []
    for job in active_jobs:
        confidence = calculate_match_confidence(transaction, job)
        if confidence >= 0.3:  # Only suggest if 30%+ confident
            matches.append({
                'job_id': job['id'],
                'job_name': job['name'],
                'confidence': confidence,
                'reason': build_match_reason(transaction, job, confidence)
            })

    return sorted(matches, key=lambda x: x['confidence'], reverse=True)[:3]
```

---

## Frontend Integration (Plaid Link)

### React Component

```typescript
// components/PlaidLink.tsx
import { usePlaidLink } from 'react-plaid-link';

export function PlaidLinkButton({ onSuccess }: { onSuccess: (token: string) => void }) {
  const { open, ready } = usePlaidLink({
    token: linkToken,  // From backend
    onSuccess: (public_token) => {
      // Exchange for access token via backend
      fetch('/api/plaid/exchange', {
        method: 'POST',
        body: JSON.stringify({ public_token }),
      }).then(() => onSuccess(public_token));
    },
  });

  return (
    <button onClick={() => open()} disabled={!ready}>
      Connect Credit Card
    </button>
  );
}
```

### Transaction Review UI

```typescript
// components/UnattributedTransactions.tsx
function TransactionCard({ transaction, suggestedJobs, onAttributeToJob }) {
  return (
    <div className="transaction-card">
      <div className="merchant">{transaction.merchant_name}</div>
      <div className="amount">${transaction.amount.toFixed(2)}</div>
      <div className="date">{formatDate(transaction.date)}</div>

      <div className="suggestions">
        <span>Suggested jobs:</span>
        {suggestedJobs.map(job => (
          <button
            key={job.job_id}
            onClick={() => onAttributeToJob(transaction.id, job.job_id)}
            className={`confidence-${Math.floor(job.confidence * 10)}`}
          >
            {job.job_name} ({Math.round(job.confidence * 100)}%)
          </button>
        ))}
      </div>
    </div>
  );
}
```

---

## Implementation Timeline

### Day 1: Setup & Link Flow
- [ ] Sign up for Plaid dashboard
- [ ] Get API keys (sandbox first)
- [ ] Implement link token endpoint
- [ ] Implement token exchange endpoint
- [ ] Test with sandbox account

### Day 2: Transaction Sync
- [ ] Implement transactions/sync endpoint
- [ ] Create database tables
- [ ] Build sync job (cron every 4 hours)
- [ ] Test transaction ingestion

### Day 3: Smart Matching
- [ ] Implement confidence scoring algorithm
- [ ] Build job suggestion endpoint
- [ ] Create unattributed transactions dashboard
- [ ] Implement one-click attribution

### Day 4: Polish & Deploy
- [ ] Add success/error notifications
- [ ] Implement manual transaction entry fallback
- [ ] Test with production credentials
- [ ] Deploy to Instance 388

---

## Environment Variables

```bash
# Add to .env
PLAID_CLIENT_ID=your_client_id
PLAID_SECRET=your_secret
PLAID_ENV=sandbox  # or production

# Optional
PLAID_WEBHOOK_URL=https://api.coperniq.io/webhooks/plaid
```

---

## Security Considerations

1. **Access Token Storage**
   - Encrypt access_token at rest
   - Never expose to frontend
   - Use per-company isolation

2. **User Authorization**
   - Only company admins can link accounts
   - Techs can only view their attributed transactions

3. **Data Retention**
   - Plaid retains 24 months by default
   - Consider data retention policy for compliance

4. **Audit Trail**
   - Log all attribution events
   - Track who linked accounts
   - Record manual overrides

---

## Competitive Differentiation

### Why This Matters for Coperniq

| Feature | JobTread | ServiceTitan | Procore | Coperniq |
|---------|----------|--------------|---------|----------|
| Plaid integration | ✅ | ❌ | ❌ | 🎯 |
| Multi-trade catalog | ❌ | ❌ | ❌ | ✅ |
| AI job matching | ❌ | ❌ | ❌ | 🎯 |
| Distributor APIs | ❌ | Limited | Limited | 🎯 |
| Credit card black hole solved | Partial | ❌ | ❌ | 🎯 |

**Coperniq can be the ONLY platform that:**
1. Solves the credit card black hole problem
2. Has multi-trade unified catalog
3. Uses AI for job attribution
4. Integrates with distributors AND retail

---

## ROI Calculation

### For a 5-tech Contractor

```
BEFORE Plaid:
- Untracked retail spend: $7,500/month (conservative)
- Margin erosion: 25% of that = $1,875/month
- Annual lost profit: $22,500

AFTER Plaid:
- Plaid cost: $7.50/month
- Recovery rate: 80% of transactions attributed
- Annual recovered profit: $18,000

NET BENEFIT: $17,910/year per 5-tech company
```

### At Scale (100 Coperniq Companies)

```
Revenue opportunity: 100 × $18,000 = $1.8M annual value delivered
Platform stickiness: No one leaves if you save them $18K/year
```

---

## Next Steps (When Ready to Implement)

1. [ ] Sign up at https://dashboard.plaid.com
2. [ ] Get sandbox credentials
3. [ ] Test with sandbox bank (user: user_good, password: pass_good)
4. [ ] Build MVP per this spec
5. [ ] Deploy to Instance 388
6. [ ] Test with real company credit card

---

## References

- [Plaid Transactions API Docs](https://plaid.com/docs/api/products/transactions/)
- [Plaid Link React SDK](https://plaid.com/docs/link/react/)
- [JobTread Plaid Announcement](https://www.jobtread.com/product-updates/2025-01-06-connect-job-tread-with-plaid-to-sync-credit-card-and-bank-transactions)
- [Plaid Pricing](https://plaid.com/pricing/)
