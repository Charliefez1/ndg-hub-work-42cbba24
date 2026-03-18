# PRD 04 — Commercial: Invoices, Contracts & Services

> **Priority:** Phase 4 — Build after Delivery (PRD-03) is complete.
> **Dependencies:** PRD-01 (foundation), PRD-02 (projects, clients)

---

## 1. Services (`/services`)

The service catalogue defines fixed-price offerings. All invoicing and delivery pricing references this table. **No day rates — per-service fixed pricing only.**

### 1.1 Service List
- Table view with CRUD operations
- Columns: Name, Category, Price (£), Duration, NEURO Phase, Active (toggle)
- Inline edit via dropdown menu (edit/delete)
- Active/inactive toggle directly in the table row

### 1.2 Service Dialog (Create/Edit)
`<ServiceDialog>` component — used for both create and edit.

Fields:
- Name (required)
- Category (text)
- Price (number, £)
- Duration (minutes)
- NEURO Phase (select: needs/engage/understand/realise/ongoing)
- Description (textarea)
- Active (toggle, default true)

### 1.3 Hooks Required

```typescript
// useServices.ts
useServices()            // SELECT * FROM services
useCreateService()       // INSERT
useUpdateService()       // UPDATE
useDeleteService()       // DELETE
```

---

## 2. Invoices (`/invoices`)

### 2.1 Invoice List Page

**Header:** Title "Invoices"

**KPI Cards (3-column grid):**
| Card | Calculation | Colour |
|------|-------------|--------|
| Revenue (Paid) | Sum of `total` where status === 'paid' | Green |
| Outstanding | Sum of `total` where status === 'sent' | Amber |
| Drafts | Count where status === 'draft' | Default |

**Invoice Table:**
| Column | Content |
|--------|---------|
| Invoice # | Monospace font |
| Client | `organisations.name` via join |
| Project | `projects.name` via join |
| Total | `£X,XXX` |
| Status | Badge via `getStatusBadgeClasses(status, 'invoice')` |
| Due | `due_date` or dash |
| Actions | "Mark Paid" button (only when status === 'sent') |

**Mark Paid action:** `updateInvoice.mutateAsync({ id, status: 'paid', paid_date: today })`

**Empty State:** FileText icon + "No invoices yet. Invoices are generated from project deliveries."

### 2.2 Invoice Generation Flow (from Project Billing Tab)

This is triggered from `<BillingTab>` in the Project Detail page:

1. User views project billing tab
2. Selects uninvoiced deliveries via checkboxes
3. Clicks "Generate Invoice"
4. Calls `generate-invoice` edge function with:
   - `projectId`
   - `deliveryIds` (selected)
5. Edge function:
   - Looks up service prices for each delivery
   - Creates `invoice` record with calculated subtotal, VAT (20%), total
   - Creates `invoice_items` for each delivery
   - Auto-generates `invoice_number`
6. Invoice appears in table with `draft` status

### 2.3 Invoice Status Pipeline
`draft → sent → viewed → paid`
Also: `overdue` (set automatically or manually when past due date)

### 2.4 Hooks Required

```typescript
// useInvoices.ts
useInvoices()                   // SELECT * FROM invoices (with org, project joins)
useUpdateInvoice()              // UPDATE
useGenerateInvoice()            // Calls generate-invoice edge function
useRecalculateInvoice()         // Calls recalculate-invoice edge function
useSendInvoice()                // Calls send-invoice edge function
useMarkInvoicePaid()            // Calls mark-invoice-paid edge function
```

---

## 3. Contracts (`/contracts`)

### 3.1 Contract List
- CRUD table for legal agreements
- "New Contract" button

**Table columns:** Title, Type, Client, Project, Value (£), Status, Start Date

### 3.2 Create Contract Dialog
Fields:
- Title (required)
- Type (select: master, project, sow, amendment)
- Organisation (select from organisations)
- Project (select, optional)
- Parent Contract (select, optional — for amendments)
- Value (number, £)
- Start Date
- End Date
- Status (select: draft, sent, signed, active, expired, terminated)
- Notes (textarea)

### 3.3 Contract Status Pipeline
`draft → sent → signed → expired / cancelled`

Parent contract linking: Amendments reference a parent contract via `parent_contract_id`.

### 3.4 Hooks Required

```typescript
// useContracts.ts
useContracts(filters?)           // SELECT * FROM contracts (optional organisationId filter)
useCreateContract()              // INSERT
useUpdateContract()              // UPDATE
useDeleteContract()              // DELETE
```

---

## 4. Billing Tab Component (`src/components/projects/BillingTab.tsx`)

This component is used within the Project Detail page.

### Features:
- Shows project budget vs total invoiced
- Lists all invoices for the project
- "Generate Invoice" action:
  1. Fetches uninvoiced deliveries for the project
  2. User selects which deliveries to invoice (checkboxes)
  3. Preview shows calculated total (from service prices)
  4. Confirm generates invoice via edge function
- Each invoice row shows: number, total, status, paid date
- Quick "Send" and "Mark Paid" actions per invoice

---

## 5. Edge Functions Required

| Function | Purpose |
|----------|---------|
| `generate-invoice` | Creates invoice + line items from selected project deliveries using service prices |
| `recalculate-invoice` | Recomputes subtotal/VAT/total from line items |
| `mark-invoice-paid` | Sets status to 'paid' and records paid_date |
| `send-invoice` | Marks invoice as 'sent' (email sending placeholder) |

---

## 6. Key Business Rules

1. **Pricing is per-service, never per-day.** Every delivery links to a service with a fixed price.
2. **Invoice items** reference both the delivery and the service for full traceability.
3. **VAT** is calculated at 20% of subtotal.
4. **Invoice numbers** are auto-generated (format: INV-YYYY-NNNN or similar).
5. **Currencies** are always GBP (£).
