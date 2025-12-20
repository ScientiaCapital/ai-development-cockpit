# Coperniq GraphQL Schema Reference

**Discovered:** 2025-12-20
**Method:** GraphQL Introspection via authenticated Playwright session
**Total Types:** 4,037
**API Endpoint:** `https://coperniq.dev/project-service/graphql`

---

## Core Business Types

### 1. Task (Work Orders) - 55 fields
Coperniq uses `Task` for work orders, service calls, and field operations.

```graphql
type Task {
  id: Int!
  title: String
  description: String
  status: String                    # Task status
  priority: Int
  position: Int

  # Relationships
  projectId: Int                    # Links to Project
  companyId: Int!
  createdBy: Int
  assigneeId: Int                   # Assigned technician
  templateTaskId: Int               # If created from template

  # Scheduling
  startDate: DateTime
  endDate: DateTime
  startDateAllDay: Boolean
  endDateAllDay: Boolean
  completionDate: DateTime
  completionTime: String
  completionTimeInS: Int

  # Field Work
  isField: Boolean                  # Field work order flag
  nextVisitId: Int                  # Next scheduled visit
  address: String                   # Work location

  # Status
  isArchived: Boolean
  isClosed: Boolean
  isCompleted: Boolean
  calculatedStatus: String

  # Assets & Systems
  systemId: Int                     # Linked system (HVAC, Solar, etc.)
  assetId: Int                      # Linked asset/equipment
  siteId: Int                       # Customer site
  servicePlanInstanceId: Int        # Service agreement

  # Forms
  forms: [Form]                     # Attached forms/checklists

  # Template
  isTemplate: Boolean
  templatePropertyIds: [Int]
  virtualProperties: JSON

  # Labels
  firstLabelId: Int
  isColored: Boolean

  # Workflow
  projectStageId: Int
  jobId: Int
  uid: String
}
```

**Use for MEP:**
- Service calls
- PM visits
- Inspections
- Installation work orders

---

### 2. Form (Checklists/Inspections) - 138 fields
Forms are used for inspections, checklists, and data collection.

```graphql
type Form {
  id: Int!
  name: String
  title: String
  description: String

  # Status
  status: String                    # Form status
  isCompleted: Boolean
  completedAt: DateTime
  isClosed: Boolean
  closedAt: DateTime

  # Template
  isTemplate: Boolean               # Is this a template?
  templateId: Int                   # Created from which template

  # Assignment
  assigneeId: Int                   # Who should complete it
  assigneePropertyId: Int           # Dynamic assignment
  dueDate: DateTime
  dueDateXDaysAfter: Int           # Relative due date

  # Relationships
  companyId: Int!
  createdBy: Int
  stageId: Int                      # Project stage
  parentTaskId: Int                 # Linked to task/work order
  fileId: Int                       # Attached file

  # Members & Access
  members: JSON
  privilegeOwn: Boolean
  privilegeTeam: Boolean
  privilegeAll: Boolean

  # Fields (stored as JSON in oldFields or via formLayouts)
  oldFields: JSON                   # Legacy field storage
  formLayouts: [FormLayout]         # Modern field layouts

  # Position
  position: Int

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

**Use for MEP:**
- AC System Inspection Checklist
- Furnace Safety Inspection
- Backflow Test Report
- Panel Inspection Form
- PM Agreement Service Report

---

### 3. Asset (Equipment) - 67 fields
Track customer equipment and assets.

```graphql
type Asset {
  id: Int!
  uid: String                       # Unique identifier
  name: String
  type: String                      # Equipment type
  status: String                    # Operational status

  # Equipment Details
  manufacturer: String
  model: String
  serialNumber: String
  size: String                      # Capacity/size

  # Dates
  installDate: DateTime
  manufacturingDate: DateTime
  expectedLifetime: Int             # Expected lifespan

  # Documentation
  description: String
  coverImageFileId: Int
  nameplateImageFileId: Int

  # Relationships
  companyId: Int!
  siteId: Int                       # Customer site
  projectId: Int                    # Related project
  createdBy: Int
  updatedBy: Int

  # Status
  isArchived: Boolean

  # Labels
  assetLabels: [AssetLabel]

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

**Use for MEP:**
- HVAC units (AC, furnace, heat pump)
- Water heaters
- Electrical panels
- Fire protection systems

---

### 4. FinancialDocument (Invoices/Quotes) - 64 fields
Handles invoices, quotes, and billing.

```graphql
type FinancialDocument {
  id: Int!
  uid: String
  title: String
  description: String

  # Type & Status
  type: String                      # invoice, quote, bill, etc.
  status: String                    # draft, sent, paid, etc.

  # Amounts
  amount: Decimal
  amountPaid: Decimal
  baseAmount: Decimal
  percentage: Decimal

  # Calculation
  calculationMethod: String

  # Dates
  issueDate: DateTime
  dueDate: DateTime

  # Relationships
  recordId: Int                     # Project/job reference
  clientId: Int                     # Customer
  companyId: Int!
  createdById: Int
  basedOnId: Int                    # Quote → Invoice reference
  basedOnUid: String
  servicePlanInstanceId: Int        # Service agreement

  # External Integration
  externalId: String
  externalPdfUrl: String
  externalAcceptanceUrl: String
  externalPaymentUrl: String

  # Portal
  sharedWithPortal: Boolean
  revision: Int

  # Status
  isArchived: Boolean

  # Line Items
  lineItems: [LineItem]
  paymentRecords: [PaymentRecord]

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

**Use for MEP:**
- Service quotes
- Project estimates
- Invoices
- Progress billing

---

### 5. Site (Customer Locations) - 119 fields
Customer property/location information.

```graphql
type Site {
  id: Int!
  uid: String

  # Address
  fullAddress: String
  street: String
  city: String
  state: String
  zipcode: String
  geoLocation: Point
  streetViewUrl: String

  # Normalized Address
  addressNormalized: JSON
  addressPretty: String
  fullAddressFromGoogle: String

  # Relationships
  clientId: Int                     # Customer/account
  companyId: Int!
  jurisdictionId: Int               # AHJ/utility
  utilityId: Int

  # Images
  imageFileId: Int

  # Metadata
  timezone: String
  createdBy: Int
  updatedBy: Int

  # Related
  systems: [System]                 # Installed systems
  assets: [Asset]                   # Equipment
  projects: [Project]               # Projects at this site

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

---

### 6. Contact (Customers) - 192 fields
Customer contact information.

```graphql
type Contact {
  id: Int!
  name: String
  title: String
  description: String

  # Contact Info
  emails: [String]
  phones: [String]
  emailsNormalized: [String]

  # Status
  status: String
  portalStatus: String              # Customer portal access

  # Source
  source: String                    # Lead source
  referralCode: String
  referrerContactId: Int            # Referred by

  # Portal Access
  lastInvitedAt: DateTime
  invitedCount: Int
  lastSignedInAt: DateTime

  # Relationships
  companyId: Int!
  createdBy: Int

  # Search
  searchString: String              # Full-text search

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

---

### 7. ServicePlan (Service Agreements) - 25 fields
Recurring service plan templates.

```graphql
type ServicePlan {
  id: Int!
  name: String
  description: String

  # Duration
  durationMonths: Int
  autoRenew: Boolean

  # Pricing
  totalPrice: Decimal
  pricingType: String               # flat, tiered, etc.
  invoicingFrequency: String        # monthly, quarterly, annual
  invoiceTermDays: Int

  # Status
  isActive: Boolean

  # Relationships
  companyId: Int!
  createdBy: Int
  imageFileId: Int

  # Items
  servicePlanItems: [ServicePlanItem]

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

---

### 8. ServicePlanInstance (Active Contracts) - 41 fields
Active service agreements with customers.

```graphql
type ServicePlanInstance {
  id: Int!

  # Plan Reference
  servicePlanId: Int

  # Customer
  clientId: Int
  sites: [ServicePlanInstanceSite]  # Covered sites

  # Duration
  startDate: DateTime
  endDate: DateTime
  durationMonths: Int
  autoRenew: Boolean

  # Pricing
  totalPrice: Decimal
  pricingType: String
  invoicingFrequency: String
  invoiceTermDays: Int

  # Status
  status: String

  # Relationships
  companyId: Int!
  createdBy: Int

  # Items
  servicePlanItems: [ServicePlanItem]

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

---

### 9. System (Monitored Systems) - 106 fields
For monitoring systems (solar, HVAC with IoT, etc.).

```graphql
type System {
  id: Int!
  uuid: String
  name: String

  # System Details
  size: String                      # Capacity
  number: String                    # System number
  clientType: String
  connectionType: String

  # Status
  status: String
  providerStatus: String
  operationStatus: String

  # Integration
  providerId: Int
  integrationId: Int

  # Location
  address: String
  addressNormalized: JSON
  addressCity: String
  addressState: String
  addressStreet: String
  addressZip: String
  timezone: String

  # Relationships
  projectId: Int
  siteId: Int
  profileId: Int                    # Monitoring profile

  # Monitoring
  monitored: Boolean
  profileOverrides: JSON
  lastReportAt: DateTime

  # Dates
  installedAt: DateTime
  operationalAt: DateTime

  # Notes
  notes: String
  addressForced: Boolean

  # Timestamps
  createdAt: DateTime!
}
```

---

### 10. Action (Workflow Actions) - 139 fields
Workflow automation actions.

```graphql
type Action {
  id: Int!
  title: String
  description: String

  # Type & Status
  type: String
  status: String

  # Scheduling
  dueDate: DateTime
  completedAt: DateTime

  # Template
  isTemplate: Boolean
  actionTemplateId: Int

  # Relationships
  companyId: Int!
  projectId: Int
  projectStageId: Int
  parentTaskId: Int
  createdBy: Int

  # Assignment
  assignAllContacts: Boolean
  actionAssignees: [ActionAssignee]

  # Status
  isArchived: Boolean

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

---

### 11. TaskVisit (Scheduled Visits) - 18 fields
Individual visits within a work order.

```graphql
type TaskVisit {
  id: Int!
  taskId: Int!
  position: Int

  # Details
  description: String

  # Scheduling
  startDate: DateTime
  endDate: DateTime
  startDateAllDay: Boolean
  endDateAllDay: Boolean

  # Status
  isCompleted: Boolean
  completedAt: DateTime

  # Background Job
  jobId: Int

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

---

### 12. PaymentRecord - 26 fields
Payment tracking for invoices.

```graphql
type PaymentRecord {
  id: Int!
  financialDocumentId: Int!

  # Amount
  amount: Decimal

  # Payment Details
  paymentMethod: String
  paymentReference: String
  paymentDate: DateTime
  status: String
  processedAt: DateTime

  # Card Info
  cardBrand: String
  cardLast4: String

  # Bank Info
  bankName: String
  bankAccountLast4: String
  bankAccountType: String
  bankAccountHolderType: String
  bankRoutingNumber: String

  # External
  isExternal: Boolean
  externalId: String

  # Notes
  notes: String
  uid: String

  # Relationships
  companyId: Int!
  createdById: Int

  # Timestamps
  createdAt: DateTime!
  updatedAt: DateTime
}
```

---

## API Endpoints Discovered

| Endpoint | Purpose |
|----------|---------|
| `https://coperniq.dev/project-service/graphql` | Main GraphQL API |
| `https://coperniq.dev/project-service/graphql-read` | Read-only GraphQL |
| `https://coperniq.dev/user-service/companies` | Company info |
| `https://coperniq.dev/user-service/roles/rules` | Role permissions |
| `https://coperniq.dev/phone-service/phone/*` | Phone/Twilio |
| `https://coperniq.dev/notification-service/*` | Notifications |
| `https://coperniq.dev/socket/` | WebSocket real-time |

---

## MEP Template Seeding Strategy

### What We Can Seed

1. **Form Templates** (`Form` with `isTemplate: true`)
   - HVAC inspection checklists
   - Plumbing test reports
   - Electrical safety forms
   - Fire protection inspections

2. **Task Templates** (`Task` with `isTemplate: true`)
   - Service call templates
   - PM visit templates
   - Installation work orders

3. **Asset Types** (via `Asset.type`)
   - HVAC equipment types
   - Water heater types
   - Electrical panel types

4. **Service Plans** (`ServicePlan`)
   - PM agreement templates
   - Annual service contracts

5. **Labels** (`Label`)
   - Trade-specific labels
   - Priority labels
   - Status labels

### GraphQL Mutations Needed

```graphql
# Create Form Template
mutation CreateFormTemplate($input: FormInput!) {
  createForm(input: $input) {
    form {
      id
      name
      isTemplate
    }
  }
}

# Create Task Template
mutation CreateTaskTemplate($input: TaskInput!) {
  createTask(input: $input) {
    task {
      id
      title
      isTemplate
    }
  }
}

# Create Service Plan
mutation CreateServicePlan($input: ServicePlanInput!) {
  createServicePlan(input: $input) {
    servicePlan {
      id
      name
    }
  }
}
```

---

## Next Steps

1. **Query existing templates** to understand format
2. **Create MEP-specific form templates**
3. **Create task/work order templates**
4. **Create service plan templates**
5. **Test via GraphQL mutations**

---

*Generated by BugHive Schema Discovery*
