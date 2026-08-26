# Clinic Management & Billing System

## 1. Project Scope

A web-based administrative system for the Specialized Clinics Center in Kuwait. The system manages patient information, clinic visits, appointments, billing, payments, invoices, and provides operational overview.

**What the system IS:**
- Administrative and billing management system
- Patient registration and management
- Appointment scheduling
- Visit tracking
- Invoice generation and payment processing
- Operational dashboard and reporting

**What the system is NOT:**
- Clinical/doctor system
- Does NOT manage diagnosis, prescriptions, or medical notes
- Does NOT include Doctor as a system role

## 2. User Roles

### Admin
- Manages users
- Manages services and prices
- Manages system settings
- Administrative access control

### Receptionist
- Manages patients
- Manages appointments
- Manages visits
- Manages invoices
- Manages payments
- Manages patient account information

## 3. Patient Management

### Registration
- Civil ID is **mandatory**
- Patient data includes: Civil ID, name (Arabic/English), phone number, and other relevant information

### Search
- Search patients by:
  - Civil ID
  - Name
  - Phone number

### Data Source
- Database is the **main source of truth** for all patient data
- Legacy Excel file is used **only** for initial data migration
- After migration, Excel is NOT the operational data source

## 4. Appointments

### Operations
- Create appointments
- Edit appointments
- Cancel appointments

### Statuses
- Booked
- Confirmed
- Done
- Cancelled
- No-show

## 5. Visits

### Visit Types
- Checkup
- Follow-up
- Other

### Services
- Services can be associated with a visit

## 6. Services

### Management
- Admin manages the service catalog
- Admin manages service prices
- Service catalog can be updated without affecting historical invoices

### Historical Preservation
- Historical issued invoices must keep their original service name and price
- Changes to the service catalog do NOT retroactively modify issued invoices

## 7. Invoices

### Invoice Creation
- Services are selected from the service catalog
- Prices are calculated automatically
- Invoice numbering must be **unique**

### Invoice Editing
- Issued invoices must **NOT** be physically overwritten
- User sees an Edit option
- Editing an issued invoice creates a **Revision/Replacement**
- Original invoice remains preserved for history/audit purposes

### Additional Charges
- Additional charges/tax can be entered by Receptionist
- Additional charge supports **BOTH**:
  - Percentage (%)
  - Fixed amount

### Invoice Fields
- Subtotal
- Additional charges (percentage or fixed)
- Total
- Paid amount
- Remaining amount
- Payment status

### Payment Status
- System automatically calculates payment status based on paid vs. total amounts

## 8. Payments

### Supported Methods
- Cash
- Visa

### Extensibility
- System design must allow additional payment methods to be added later without major architectural changes

## 9. Dashboard & Reports

### Dashboard
- Operational overview of:
  - Today's appointments
  - Today's visits
  - Today's invoices
  - Revenue summary
  - Unpaid invoices
- Filter capabilities by time period

### Reports
- Revenue reporting
- Invoice reporting
- Payment reporting

## 10. PDF / Printing / WhatsApp

### Printing
- Standard printer/browser printing is assumed for now

### PDF Generation
- PDF generation is **required**
- PDFs must match clinic's invoice format

### WhatsApp Sharing
- WhatsApp sharing is via a **pre-filled wa.me link**
- Staff manually sends the message
- NOT automated WhatsApp Business API messaging

## 11. Data Migration

### Legacy Data
- Existing Excel contains legacy patient data
- Excel will **NOT** be the operational data source after migration
- Migration must be treated as a **separate controlled process**
- Do **NOT** modify or overwrite the original raw Excel file

### Migration Process
- Migration requires:
  - Data cleaning
  - Deduplication rules
  - Mapping strategy
  - Dry-run testing
  - Rollback plan

## 12. Security

### Authentication & Authorization
- Authentication is required
- Role-based authorization is required
- Financial actions must be traceable to specific users

### Data Protection
- Patient data is sensitive
- Do **NOT** expose patient data in logs
- Patient names, phone numbers, and Civil IDs must not appear in plaintext logs

### Audit Trail
- All financial actions must be traceable
- System must maintain audit logs for:
  - Invoice creation and modifications
  - Payment recording
  - User access
  - Administrative changes

## 13. Backup

### Backup Requirements
- Automated backups are required
- Daily backup schedule
- Backups must be stored securely
- Restore procedure must be tested

### Backup Storage
- Off-site backup storage recommended
- Backups encrypted at rest

## 14. Deployment

### Architecture
- Web application
- PostgreSQL database
- Docker containerization
- VPS hosting

### Security
- HTTPS required
- SSL/TLS encryption

### Environment
- Production environment configuration
- Environment variables for sensitive data

## 15. Business Rules

### Invoice Immutability
- Once an invoice is issued, it cannot be directly modified
- Corrections require creating a new invoice that references the original
- Original invoice must remain in the system for audit purposes

### Financial Calculations
- All monetary values must use precise decimal arithmetic
- No floating-point arithmetic for financial calculations
- Subtotals, totals, and balances must be calculated accurately

### Patient Identification
- Civil ID is the primary identifier
- Civil ID is mandatory for patient registration

### Service Pricing
- Service prices are managed by Admin
- Historical invoices preserve the price at time of issuance
- Service catalog changes do not affect historical data

### Branch Management
- Single branch for now
- System design should not preclude future multi-branch capability

## 16. Open Questions

The following items require clarification before implementation:

### Invoice Template
- What is the exact layout/branding required for the PDF invoice template?
- Are there specific fields or formatting requirements for the printed invoice?

### Additional Charge Rules
- Are there specific business rules for when percentage vs. fixed additional charges should be used?
- Are there maximum limits on additional charges?

### Payment Workflow
- Can partial payments be recorded over multiple transactions?
- What is the workflow for handling overpayments?

### Invoice Numbering
- What is the preferred invoice number format (e.g., INV-000001, 2024-0001)?
- Should invoice numbers reset annually or continue sequentially?

### Reporting Requirements
- Are there specific report formats required for accounting/export purposes?
- What time periods should be available for dashboard filtering (daily, weekly, monthly, custom)?

### User Management
- Who is authorized to create Admin accounts?
- What is the process for resetting forgotten passwords?
- How are departed employee accounts handled?

### Backup Retention
- What is the required backup retention period?
- What is the specific off-site backup destination?

### VPS Specifications
- What are the specific RAM/CPU requirements for the VPS?
- Consider Puppeteer's memory footprint when sizing

### Data Migration Details
- What are the specific deduplication rules for the legacy Excel data?
- How should records with missing phone numbers be handled?
- What is the required field policy during migration?

### Post-Support Arrangement
- After the initial support period, what is the maintenance and bug-fixing arrangement?
- What is the expected response time for critical issues?
