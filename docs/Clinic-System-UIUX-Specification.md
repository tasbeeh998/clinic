# Clinic Management & Billing System — UI/UX Specification
**Role:** Product Design / Design System Architecture
**Scope:** Administrative & billing system only — Admin + Receptionist. No clinical/Doctor UI.
**Direction:** RTL, Arabic-first, Light theme, Desktop-first responsive, "Modern Medical Admin Dashboard"

---

## 1. Overall UI/UX Concept

The system's entire reason to exist is one repeated motion, done dozens of times a day by a non-technical receptionist under real time pressure at a front desk:

> **Search patient → Open patient → Create visit → Select services → Create invoice → Record payment → Print / PDF / WhatsApp**

Every design decision in this document is subordinate to making that motion fast, unambiguous, and hard to get wrong — because getting an invoice wrong has real financial consequences. The visual language reflects that: calm navy/blue tones (not clinical white-on-white, not decorative pastel-medical), high information density where it earns its keep (tables, invoice lines), generous whitespace where precision matters (forms, confirmations), and a warm accent color used *sparingly* as a signal, not a decoration.

**Design personality in one line:** *a calm, trustworthy back-office tool a bank teller would feel at home in — not a consumer health app.*

Three things this UI deliberately avoids, because the brief calls them out and because they actively hurt the core workflow: decorative medical iconography (no stethoscopes/heartbeats/cross icons), card-heavy dashboards that bury numbers in decoration, and multi-level nested navigation that adds clicks to the core flow.

---

## 2. Design System

### 2.1 Color Tokens
The approved palette is used exactly as given. Neutral grays and semantic tints are new additions needed to make the palette usable in a real interface — they're derived to sit comfortably with the navy primary, not invented independently of it.

**Brand (approved, unchanged):**
| Token | Hex | Usage |
|---|---|---|
| `color-primary-dark` | `#111844` | Headings, primary text on light surfaces, active nav item background |
| `color-primary` | `#4B5694` | Primary buttons, links, focus states, active icons |
| `color-secondary` | `#7288AE` | Secondary actions, chart accents, secondary icons |
| `color-accent-warm` | `#EAE0CF` | Sparse highlight surfaces (e.g. today's-revenue stat card background), never for text |

**Neutrals (derived, cool-toned to sit with the navy primary):**
| Token | Hex | Usage |
|---|---|---|
| `color-bg` | `#F6F7FA` | App background |
| `color-surface` | `#FFFFFF` | Cards, panels, tables, modals |
| `color-border` | `#E3E6EE` | Default borders, table row dividers |
| `color-border-strong` | `#C9CEDC` | Input borders, dividers needing more contrast |
| `color-text-primary` | `#111844` | Body/heading text (reuses primary-dark) |
| `color-text-secondary` | `#5B6478` | Secondary text, labels, table sub-text |
| `color-text-muted` | `#8991A6` | Placeholders, disabled text, timestamps |
| `color-disabled-bg` | `#EEF0F5` | Disabled inputs/buttons |

**Semantic (new, chosen to harmonize with the navy/blue palette rather than clash with it):**
| Token | Text/Icon | Background tint | Usage |
|---|---|---|---|
| `color-success` | `#1B8A5A` | `#E7F6EE` | Paid, active user, confirmed appointment, done visit |
| `color-warning` | `#B4791F` | `#FCF3E1` | Partially paid, draft invoice, pending/no-show |
| `color-error` | `#C4362B` | `#FBEAE8` | Void invoice, cancelled appointment, validation errors |
| `color-info` | `#2A5FBF` | `#EAF1FB` | Informational banners, booked (not yet confirmed) status |

> **Rule:** color never carries meaning alone. Every status badge pairs a color with a text label (and RTL-safe icon where useful) — never a color dot by itself.

### 2.2 Typography
- **Font:** Cairo, for both Arabic and Latin/numeric content (Cairo covers Latin well, so numbers, English patient names, and invoice codes render in the same family — no font-switching artifacts). Fallback stack: `Cairo, 'Segoe UI', Tahoma, sans-serif`.
- **Numerals:** use tabular (monospaced-width) figures for all money/quantity values (`font-variant-numeric: tabular-nums`) so columns of numbers align — this matters a lot in invoice tables.

| Token | Size / Line-height | Weight | Usage |
|---|---|---|---|
| `text-display` | 28px / 36px | 700 | Page hero numbers (e.g. dashboard revenue figure) |
| `text-h1` | 22px / 30px | 700 | Page titles |
| `text-h2` | 18px / 26px | 600 | Section headers, card titles |
| `text-h3` | 15px / 22px | 600 | Sub-section headers, table group headers |
| `text-body` | 14px / 22px | 400 | Default body text, table cells |
| `text-body-medium` | 14px / 22px | 500 | Emphasized inline text, form values |
| `text-small` | 13px / 18px | 400 | Helper text, secondary metadata |
| `text-caption` | 12px / 16px | 400 | Timestamps, badge labels, table captions |

Weights used: 400 (regular), 500 (medium — the default for interactive/emphasized text, not bold), 600 (semibold — headers), 700 (bold — display numbers only). Avoid 300/800/900 — Cairo's extremes read either too thin for Arabic screen rendering or too heavy for a "calm" interface.

### 2.3 Spacing System
4px base unit: `4, 8, 12, 16, 20, 24, 32, 40, 48, 64`. Named as `space-1` through `space-10` in that order. Default component padding is `space-4` (16px); page-level section gaps are `space-6`–`space-8` (24–32px).

### 2.4 Radius
| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 6px | Inputs, buttons, small badges |
| `radius-md` | 10px | Cards, table containers, dropdowns |
| `radius-lg` | 14px | Modals |
| `radius-full` | 999px | Status pills, avatars |

Deliberately not the "cream + heavy rounded card" AI-default look — corners stay modest and consistent, not oversized, to keep the density needed for an admin tool.

### 2.5 Shadows & Borders
Shadows are navy-tinted, not pure black, to stay coherent with the palette:
| Token | Value |
|---|---|
| `shadow-sm` | `0 1px 2px rgba(17,24,68,0.06)` |
| `shadow-md` | `0 4px 12px rgba(17,24,68,0.08)` |
| `shadow-lg` | `0 12px 32px rgba(17,24,68,0.14)` |

Prefer a 1px `color-border` outline over a shadow for flat surfaces (tables, list rows); reserve shadow for elevated/floating elements (modals, dropdowns, the sidebar-over-content state on tablet).

### 2.6 Icon Style
Outline/line icon set (e.g., Lucide/Feather-equivalent), 20px default size, ~1.75px stroke, `color-text-secondary` by default and `color-primary` when active/interactive. No filled medical iconography (no crosses, stethoscopes, heartbeats) — icons are strictly functional: search, calendar, file/PDF, printer, WhatsApp, user, filter, chevron, check, x, alert-triangle, clock.

### 2.7 Buttons
| Variant | Style | Usage |
|---|---|---|
| Primary | Solid `color-primary` bg, white text | The single main action per screen (Save, Issue Invoice, Record Payment) |
| Secondary | White bg, `color-border-strong` border, `color-text-primary` text | Secondary actions (Cancel, Edit, Back) |
| Tertiary/Ghost | No border/bg, `color-primary` text | Low-emphasis actions (Add another service line) |
| Destructive | Solid `color-error` bg, white text | Void invoice, deactivate user, cancel appointment |
| Disabled | `color-disabled-bg` bg, `color-text-muted` text | Any button whose action is currently invalid |

Sizes: `sm` (32px height, table row actions), `md` (40px, default), `lg` (48px, primary form-submit actions like "Issue Invoice"). Loading state replaces label with a spinner + keeps the button's width fixed (prevents layout shift, and prevents a double-click since the button is visually "busy").

### 2.8 Inputs
- Height 40px (44px for the patient search bar — it's used constantly, make it easy to hit), `radius-sm`, `color-border-strong` border, `color-primary` 2px focus ring.
- Label always above the field (never placeholder-as-label — placeholders disappear on focus and reception staff shouldn't have to remember a field's meaning mid-entry).
- Helper text below in `text-small` / `color-text-muted`; error text replaces it in `color-error` with an inline alert icon.
- RTL note: in RTL, a field's "leading" edge is the right side. Any inline icon (search icon, calendar icon) sits on the right of the field; the clear/x icon sits on the left.
- Numeric/money inputs right-pad for a fixed currency suffix ("د.ك") shown inside the field, muted color, non-editable.

### 2.9 Tables
The single most-used surface in this system — treated as a first-class component, not a generic grid.
- Header row: `color-bg` background, `text-small` weight 600, sticky on scroll for long lists (patients, invoices).
- Row height: 48px default, 56px where a row contains a status badge + secondary text (e.g., invoice list showing number + patient name).
- Row divider: 1px `color-border`, no zebra striping (zebra adds visual noise without adding scanability at this density — a clean divider is enough).
- Hover: subtle `color-bg` row background, cursor pointer, to signal the row is clickable (opens detail).
- Numeric/money columns: right-aligned to the column's own start edge in reading order, tabular figures, so amounts scan vertically.
- Row actions: icon buttons revealed on hover (desktop) or always visible (tablet/mobile, since hover doesn't exist there) — never hidden inside an overflow menu for the *primary* row action (e.g., "open invoice"); overflow menu is fine for secondary actions (void, print).

### 2.10 Badges / Status Styles
Pill shape (`radius-full`), `text-caption` weight 600, colored text on the matching tint background from §2.1, horizontal padding `space-3`, height 24px.

| Domain | Statuses |
|---|---|
| Appointment | `booked` (info) · `confirmed` (primary) · `done` (success) · `cancelled` (error) · `no-show` (warning) |
| Invoice | `draft` (warning, outlined variant — see note) · `issued` (success) · `void` (error, with strikethrough on the invoice number wherever it's referenced elsewhere in the UI) |
| Payment | `unpaid` (error) · `partially paid` (warning) · `paid` (success) |
| User | `active` (success) · `inactive` (muted gray, not error — deactivation isn't a failure state) |

> **Note on "draft":** draft invoices use an *outlined* badge style (colored border, transparent fill, no solid tint) specifically to visually distinguish "not yet real/final" from all other (filled) statuses — this is a deliberate, load-bearing visual distinction given how important the draft/issued boundary is (§8).

### 2.11 Modals / Dialogs
Centered overlay, `radius-lg`, `shadow-lg`, max-width 480px for confirmations / 640px for forms (e.g., "Record Payment"). Structure: header (title + close X, top-left in RTL) → body → footer (actions, primary action nearest the reading end i.e. left in RTL, secondary/cancel to its right). Backdrop is `color-primary-dark` at 40% opacity, click-to-dismiss **disabled** for any modal representing a destructive or financial action (void invoice, record payment) — must be dismissed via an explicit button, to prevent accidental loss of an in-progress entry.

### 2.12 Toasts / Notifications
Top-left corner (RTL-mirrored from the LTR default), stacked, `radius-md`, `shadow-md`, colored left border (4px) matching the semantic type. Auto-dismiss after 4s for success/info; **persist until manually dismissed** for errors (a receptionist mid-workflow shouldn't lose the reason something failed because a toast timed out).

### 2.13 Empty States
Icon (muted, 40px) + one-line explanation in `text-body` + one primary action where applicable, e.g. patient list with no results: *"لا توجد نتائج مطابقة للبحث"* + a "مسح البحث" ghost button. Never a bare "No data" with nothing else — every empty state either explains why or offers the next action (per §14).

### 2.14 Loading States
- Full-page navigation: thin `color-primary` progress bar at the very top of the viewport, not a full-page spinner (keeps layout stable, feels faster).
- In-place data (a table refreshing, a panel loading): skeleton blocks matching the eventual content's shape, not a centered spinner — this avoids layout jump when data arrives.
- Button-level actions: inline spinner inside the button itself (§2.7), rest of the page stays interactive unless the action is destructive/blocking.

### 2.15 Error States
- Field-level: red border + icon + message directly under the field, in the flow (not a toast) — the receptionist should see the problem exactly where it happened.
- Page/section-level (e.g., failed to load patient): an inline banner with `color-error` left border, a plain-language explanation, and a retry action — never a raw technical error string.
- Network/offline: a persistent top banner ("لا يوجد اتصال بالخادم — جارٍ إعادة المحاولة"), since a receptionist losing connection mid-invoice needs to know immediately, not discover it when Save silently fails.

---

## 3. Navigation Architecture / Information Architecture

```
Dashboard
Patients
  └─ Patient Profile (Overview · Visits · Invoices · Payments · Appointments)
Appointments  (Calendar view / List view — same module, two views)
Visits           (reached primarily through a patient, but also listable standalone for today's visits)
Invoices
  └─ Invoice Detail
Payments        (surfaced primarily inside Invoice Detail; a top-level "Payments" list exists for cross-invoice lookup)
Services         (Admin manages; Receptionist reads only when selecting for a visit)
Reports          (Admin + Receptionist, read-only)
Users            (Admin only)
Settings         (Admin only)
```

**What belongs where — rationale:**
- **Visits and Payments are not full standalone top-level workflows** the way Patients/Appointments/Invoices are — they exist *inside* the objects they belong to (a visit inside a patient, a payment inside an invoice), because a receptionist never thinks "let me go manage visits in the abstract" — they think "this patient, right now." Still expose a lightweight top-level "Visits" (today's list) and "Payments" (search across invoices) entry for the rare cross-cutting lookup, but they are not where the *creation* flow starts.
- **Services** sits in the main nav but its create/edit actions are Admin-only — Receptionist sees it as a reference list (needed when explaining prices to a patient) without edit controls.
- **Reports, Users, Settings** cluster at the bottom of the sidebar, visually separated from the daily-operations group above — they're accessed far less often and shouldn't compete for attention with Patients/Appointments/Invoices.

### 3.1 Sidebar Contents by Role
| Item | Admin | Receptionist |
|---|---|---|
| Dashboard | ✅ | ✅ |
| Patients | ✅ | ✅ |
| Appointments | ✅ | ✅ |
| Invoices | ✅ | ✅ |
| Payments | ✅ | ✅ |
| Services | ✅ (full CRUD) | ✅ (read-only) |
| Reports | ✅ | ✅ (read-only, may be scope-limited per settings) |
| Users | ✅ | 🚫 hidden entirely |
| Settings | ✅ | 🚫 hidden entirely |

Hiding (not just disabling) Users/Settings for Receptionist keeps the nav shorter for the role that uses it most intensively all day — this is a UX decision on top of the RBAC decision, not a replacement for server-side enforcement.

---

## 4. Global Layout

```
┌─────────────────────────────────────────────────────────┐
│  Topbar: [≡]      breadcrumb          [🔔] [user ▾]      │
├───────────┬─────────────────────────────────────────────┤
│           │                                             │
│  Sidebar  │              Main Content Area               │
│  (nav)    │                                              │
│           │                                              │
│           │                                              │
└───────────┴─────────────────────────────────────────────┘
```
*(diagram shown LTR for readability here — actual layout is mirrored: sidebar on the right, content flows right-to-left)*

- **Sidebar:** fixed width 240px (desktop/laptop), collapsible to a 64px icon-only rail via the topbar toggle — persists per-user preference. On the *reception workstation* specifically, defaulting to the collapsed rail is worth considering post-launch to maximize table width for the invoice/patient views (see §11 responsive notes) — flagged as a UX option, not a hard requirement.
- **Topbar:** clinic logo/name (left in RTL — the far side from nav), breadcrumb trail (center-start), notifications bell (unpaid-invoice / today's-appointment alerts — badge count only, no dropdown feed needed at this scope), user menu (avatar + name + role, opens to Profile/Logout).
- **Breadcrumbs:** always present below the topbar on any screen more than one level deep (e.g., `المرضى / سارة أحمد / الفواتير / INV-000482`) — critical given how often staff will be several levels into a patient's record and need to jump back.
- **Main content area:** consistent `space-6` outer padding, page title + primary action button fixed at the top of the content area (not requiring scroll to find "New Appointment" etc.).

### 4.1 Admin vs. Receptionist Layout Differences
The *shell* (sidebar/topbar) is identical — only its contents differ per §3.1. No separate "Admin layout" — this keeps the codebase and the staff's mental model simple (one app, role determines visibility, not two different apps). The only structural addition for Admin is a Users/Settings section at the bottom of the sidebar, visually separated by a divider.

---

## 5. Screen-by-Screen Specification

### 5.1 Login — *priority screen*
**Purpose:** authenticate staff quickly at the start of a shift; nothing else.
**Layout:** centered single card (max-width 400px) on a plain `color-bg` background — no marketing imagery, no split-screen hero (this is a back-office tool opened dozens of times, not a product landing page).
```
        [ clinic logo ]
     اسم المركز الطبي
   ┌───────────────────────┐
   │ البريد الإلكتروني       │
   │ [______________]      │
   │ كلمة المرور    [👁]    │
   │ [______________]      │
   │ [ ] تذكرني             │
   │ [   تسجيل الدخول   ]   │
   │ نسيت كلمة المرور؟      │
   └───────────────────────┘
```
- **Components:** clinic logo (placed above the form, modest size — this is not a branding moment, just an identity anchor), email field, password field with a visibility-toggle eye icon, "remember me" checkbox (appropriate here — a shared reception workstation logging in once per shift benefits from it, but it should remember the *email* only, never persist the password client-side), primary submit button full-width, "forgot password" as a tertiary text link below the button.
- **Main action:** Sign in. **Secondary:** Forgot password.
- **States:** default → loading (button shows spinner, fields disabled) → error (a single inline banner above the fields: "البريد الإلكتروني أو كلمة المرور غير صحيحة" — deliberately not specifying *which* field is wrong, standard security practice) → success (redirect to Dashboard).
- **UX note:** "Forgot password" should route to an Admin-mediated reset (per the open question in the requirements doc about who resets passwords) rather than an email-based self-service flow, unless that's been decided — flagged in §9.

### 5.2 Dashboard — *priority screen*
**Purpose:** a 5-second situational read of "what does today look like" the moment staff log in.
**Hierarchy (most → least visually dominant):**
1. **Today's revenue** — the single largest number on the page, in `text-display`, on a subtle `color-accent-warm` tinted panel (the one deliberate, sparing use of the warm accent — reserved for exactly this one "hero number" so it stays meaningful and doesn't dilute into generic decoration).
2. **Today's counts row** — appointments / visits / invoices as three compact stat tiles beside/below the revenue hero, `text-h1` size, plain white surface (not competing with the revenue hero for attention).
3. **Unpaid invoices** — a distinct, slightly warning-toned panel (uses `color-warning` accents, not a full red-alert treatment) since this is actionable financial follow-up, not just an FYI stat.
4. **Recent patients / recent invoices / upcoming appointments** — three compact lists below the fold-line, each with a "view all →" link into the relevant module. These are *reference*, not headline — smaller type, no large numerals.

```
┌─────────────────────────────┬───────────────┬───────────────┬───────────────┐
│   إيرادات اليوم (hero)         │  المواعيد اليوم │  الزيارات اليوم │  الفواتير اليوم │
│   1,240 د.ك                   │      12        │       9        │       7        │
└─────────────────────────────┴───────────────┴───────────────┴───────────────┘
┌───────────────────────────────────────────────────────────────────────────┐
│  ⚠ فواتير غير مسددة بالكامل (5)                                    عرض الكل → │
└───────────────────────────────────────────────────────────────────────────┘
┌──────────────────────┬──────────────────────┬─────────────────────────────┐
│ مرضى حديثون            │ فواتير حديثة           │ مواعيد قادمة                    │
└──────────────────────┴──────────────────────┴─────────────────────────────┘
```
- **Data displayed:** exactly the 8 items requested — today's appointments/visits/invoices/revenue, unpaid invoices, recent patients, recent invoices, upcoming appointments. Nothing else — resist adding decorative charts here; a trend chart belongs in Reports (§5.9), not the daily-operations dashboard.
- **User flow:** every element on this page is a link into its module — the dashboard itself has no forms, no creation actions. It's a jump-off point, not a workspace.
- **Filter:** a lightweight date-range control (defaults to "today," can shift to "yesterday" for morning catch-up) — no complex filtering here, that belongs in Reports.

### 5.3 Patients — List
**Purpose:** find a patient in under 2 seconds, or start a new one.
**Layout:** persistent search bar pinned at the top of the content area (44px height, per §2.8), filter row below it (status: active/archived), then the table.
**Components:** search input (searches Civil ID / name / phone simultaneously, per the requirement — no need for separate search-by fields, one box, smart matching), "+ مريضة جديدة" primary button top-right(-start), data table.
**Table columns:** Civil ID (bold, first column, largest visual weight — "make Civil ID highly visible" per the brief) · Name (Ar/En) · Phone · Last Visit Date · Actions.
**Main action:** Add patient. **Secondary:** open patient (row click), export list (if reporting requirement confirms need — see §9).
**States:** loading (skeleton rows) · empty (no patients yet — first-run state with a prominent "add your first patient" action) · no-search-results (per §2.13) · populated.

### 5.4 Patients — Patient Profile — *priority screen*
**Purpose:** the single hub a receptionist lives in for any given patient — everything about them, one click away from starting a new visit.
**Layout:** two-zone page — a fixed left-hand-in-RTL (visually right-side) profile summary panel, and a tabbed content area for history.
```
┌───────────────────────┬─────────────────────────────────────────┐
│  سارة أحمد               │  [نظرة عامة][الزيارات][الفواتير][المدفوعات][المواعيد] │
│  الرقم المدني: 12345XXXXX  │                                          │
│  الهاتف: 999xxxxx        │           (selected tab content)          │
│  [ + زيارة جديدة ]  ← primary, always visible, top of this panel     │
│  [ تعديل البيانات ]                                                    │
└───────────────────────┴─────────────────────────────────────────┘
```
- **Civil ID and the "+ New Visit" button are the two most visually dominant elements** of this screen — Civil ID because it's the clinic's real identity anchor (brief requirement), "+ New Visit" because it's the single most common action taken from this screen and starts the core reception flow.
- **Tabs:** Overview (summary: last visit, balance due if any, upcoming appointment) · Visits (history table) · Invoices (history table, status badges) · Payments (history table) · Appointments (history + upcoming).
- **User flow:** Search patient (§5.3) → land here → "+ New Visit" → §5.6.
- **UX note:** if this patient has any unpaid balance, show a small persistent warning strip at the top of the profile panel ("رصيد مستحق: 30 د.ك") — this is information the receptionist needs *before* deciding how to handle the next visit, not buried in the Invoices tab.

### 5.5 Appointments
**Purpose:** book, confirm, and track the day's schedule.
**Layout:** toggle between Calendar view (default — day/week) and List view (better for quick scanning of a single day, useful on smaller screens).
```
[ اليوم ▾ ]   [ يوم | أسبوع ]   [ + موعد جديد ]
┌──────────────────────────────────────────────┐
│ 09:00  سارة أحمد            [مؤكد]              │
│ 09:30  ————— متاح —————                        │
│ 10:00  مريم علي              [محجوز]            │
└──────────────────────────────────────────────┘
```
- **Components:** calendar grid or list, status badges (§2.10) inline on every slot, "+ New Appointment" primary action, patient-search-typeahead inside the create/edit modal (reuses the same search component as §5.3 — one search pattern across the whole app, not a bespoke one per screen).
- **Cancel flow:** requires a reason (short text or a small preset list: "طلب المريضة"/"تعارض بالمواعيد"/"أخرى") and a confirmation dialog (§2.11) — cancellation is logged, not silently deleted.
- **Status badges:** exactly the five requested (`booked/confirmed/done/cancelled/no-show`), colors per §2.10.

### 5.6 Visits — Creation Flow
**Purpose:** the bridge between "patient is here" and "invoice." Kept intentionally minimal — this is not a clinical documentation screen.
**Layout:** single-column form, no wizard/multi-step for this part (it's short enough not to need one — a wizard would add clicks the core flow doesn't need).
**Fields:** Patient (pre-filled if arriving from a patient profile or appointment; searchable if starting fresh), Visit type (checkup/follow-up/other — simple select), Date/time (defaults to now), Linked appointment (auto-linked if this visit originated from one; optional manual link otherwise), Notes (plain text, optional, administrative notes only — explicitly not a clinical notes field, since this is not a clinical system).
**Main action:** "متابعة إلى الفاتورة" (Continue to Invoice) — this is a single, clearly-labeled action verb, not a generic "Save," because it tells the receptionist exactly what happens next (per the writing guidance in §2 — action names should say what happens).
**Secondary action:** Save as draft visit without continuing (for the rare case services aren't decided yet).

### 5.7 Invoices — Creation — *most important screen in the system*
**Purpose:** build a correct invoice, fast, with the calculation always visible and no way to reach an ambiguous state.
**Layout:** two-column — left-in-RTL (visually right) is the service-selection/line-items area, right-in-RTL (visually left, i.e. the reading-end) is a **persistent totals summary panel that never scrolls out of view**.
```
┌───────────────────────────────────────┬───────────────────┐
│  إضافة خدمة  [ + ]                       │  ملخص الفاتورة        │
│ ┌───────────────────────────────────┐ │  ───────────────  │
│ │ الخدمة        الكمية   السعر    الإجمالي│ │  الإجمالي الفرعي  80.000│
│ │ كشف            1     30.000   30.000│ │  رسوم إضافية   0.000│
│ │ Sonar 4D       1     40.000   40.000│ │  ─────────────    │
│ │ تقرير          1     10.000   10.000│ │  الإجمالي     80.000  │
│ │                                [🗑]│ │                    │
│ └───────────────────────────────────┘ │  [ حفظ كمسودة ]      │
│  + رسوم إضافية (نسبة% / مبلغ ثابت)        │  [  إصدار الفاتورة  ] │
└───────────────────────────────────────┴───────────────────┘
```
- **Service selection:** a searchable/typeahead add-line control pulling from the Services catalog (read-only reference here) — never free-text service names, to keep reporting and pricing integrity intact.
- **Quantity / price:** quantity is editable inline per line (stepper or plain numeric input), price is filled from the catalog automatically but **editable per line only with a visible "معدّل" (adjusted) indicator** next to any manually-overridden price — this makes deviations from the catalog price visible at a glance, both to the receptionist and later on audit review, rather than silently letting any number be typed in.
- **Additional charge:** a distinct control below the line items (not disguised as another service line), explicitly toggled between **percentage** and **fixed amount**, applied to the subtotal, shown as its own row in the summary panel — this keeps the base service total and the extra charge auditable as two separate, clearly-labeled numbers.
- **Totals panel fields, in order:** Subtotal → Additional charge (if any) → **Total** (largest weight in the panel) → Paid (0 until payment is recorded) → Remaining → Status badge.
- **Draft vs. Issue — this is the most important interaction on the whole screen:**
  - "حفظ كمسودة" (Save as Draft) is a **secondary** button — fully editable afterward, no number assigned yet.
  - "إصدار الفاتورة" (Issue Invoice) is the **primary** button, visually heavier, and **requires a confirmation dialog** stating plainly: *"بعد الإصدار، لا يمكن تعديل الفاتورة. رقم الفاتورة: سيتم إصداره تلقائيًا."* ("Once issued, this invoice cannot be edited. An invoice number will be assigned automatically.") This confirmation is not decorative friction — it is the one moment in the whole app where an irreversible financial action happens, and the UI must make that unmistakable before it happens, not after.
- **Empty state:** no service lines yet → the totals panel shows all zeros with muted styling and the Issue button is disabled (can't issue an empty invoice) rather than hidden — a disabled-with-reason primary action teaches the workflow better than hiding it (per §14).

### 5.8 Invoice — Detail / Draft / Issued / Void / Revision — *most important screen in the system*
**Purpose:** the single source of truth for one invoice, in whichever of its three states it's currently in — and the entry point for payments, print, PDF, and WhatsApp.
**Layout:** same two-column skeleton as creation (§5.7), but line items and totals become **read-only text once issued** — this is a deliberate visual shift (not just disabled inputs) so "this is now a document, not a form" is felt, not just enforced.

**State-specific treatment:**
| State | Visual treatment | Available actions |
|---|---|---|
| **Draft** | Outlined "مسودة" badge (§2.10), fields remain editable inline | Edit line items, Save, Issue |
| **Issued** | Solid green "صادرة" badge, invoice number shown prominently in the header (`text-h2`, monospace/tabular), all financial fields rendered as static text | Record Payment, Print, Download PDF, Share via WhatsApp, Void (Admin only) |
| **Void** | Solid red "ملغاة" badge, entire content area gets a subtle diagonal watermark-style "ملغاة" treatment behind the content (not covering it, just unmistakably signaling "do not use this") | View only, jump to its replacement invoice if one exists |

- **Void / Revision flow:** clicking "إلغاء الفاتورة" (Admin only, per RBAC) opens a confirmation dialog requiring a short reason, then **automatically creates a new linked draft invoice pre-filled with the same line items**, and the original flips to Void with a visible "استُبدلت بالفاتورة #INV-000483" (replaced by invoice #...) reference — and the new draft shows the reverse reference ("تحل محل الفاتورة #INV-000482"). This bidirectional linkage is essential: anyone opening either invoice later can trace the full correction history in two clicks, which is exactly what the architecture doc's audit-log requirement needs a UI for.
- **Print / PDF / WhatsApp** are grouped together as a single action cluster (top-right of the issued invoice), since they're always used together at the end of the flow, not independently discovered.
- **UX note — the hardest requirement on this screen ("difficult to misuse"):** the *only* way to change numbers on an issued invoice is through the Void→Revision path — there is no "edit" affordance shown anywhere on an issued invoice, not even a disabled one. Removing the control entirely (rather than disabling it) prevents staff from repeatedly trying to click something that will never work, and makes the Void/Revision path the obvious, only path.

### 5.9 Payments — *priority screen*
**Purpose:** record money received against a specific invoice, cleanly.
**Layout:** primarily a modal/panel launched from Invoice Detail (§5.8), not a standalone creation flow — payments don't exist independent of an invoice.
```
┌──────────────────────────────┐
│  تسجيل دفعة                     │
│  المتبقي حاليًا: 30.000 د.ك        │
│  المبلغ  [______________]      │
│  الطريقة  ( ) نقدًا  ( ) فيزا      │
│  [   إلغاء   ]  [  تسجيل الدفعة  ]│
└──────────────────────────────┘
```
- The **remaining balance is shown inside the form itself**, immediately above the amount field — so staff never have to mentally hold that number while typing, and it acts as a natural anchor for partial-payment entry.
- **Validation:** amount must be > 0 and ≤ remaining balance; attempting to overpay shows an inline error immediately on blur, not only on submit ("لا يمكن أن يتجاوز المبلغ المتبقي 30.000 د.ك").
- **After recording:** the invoice's totals panel updates immediately (paid/remaining/status), a success toast confirms, and if the new status is "Paid," the status badge transition itself is the confirmation — no extra modal needed.
- **Payment history:** a simple chronological list on the Invoice Detail screen (date, amount, method, recorded by) — flat and scannable, not a separate page.
- **States:** partial payment → warning-toned status persists with visible remaining amount; full payment → success-toned status, remaining shown as `0.000` rather than hidden (showing zero explicitly confirms "yes, this really is settled," rather than the field just disappearing).

### 5.10 Reports
**Purpose:** answer "how did we do" questions across a date range — read-only for both roles.
**Layout:** a left(-start)-side filter rail (date range, report type: Revenue / Visits / Appointments / Services usage / Paid-Unpaid) driving a right(-content) results area that's a table plus at most one simple chart (bar/line, not decorative) per report type.
**Components:** date-range picker (with quick presets: today/this week/this month), report-type tabs, results table, export button (CSV/PDF — flagged in §9 since export wasn't explicitly confirmed as a requirement).
**UX note:** reports are explicitly *not* where dashboard-style "hero numbers" belong — this screen is for tables and modest supporting charts a receptionist or admin can act on (e.g., which services are underused), not a marketing-style analytics page.

### 5.11 Users (Admin only)
**Purpose:** manage staff accounts.
**Layout:** standard list + form pattern, consistent with Patients (§5.3) for learnability.
**Table columns:** Name · Email · Role (badge) · Status (active/inactive badge) · Last login · Actions.
**Create/Edit form:** Name, Email, Role (select: Admin/Receptionist), temporary password generation (system-generated, shown once, staff sets their own on first login — this answers the "who resets passwords" gap flagged in the earlier requirements review) rather than an admin typing a password directly.
**Activate/Deactivate:** a toggle with a confirmation dialog for deactivation specifically (not for activation — only the action that removes access needs friction).

### 5.12 Settings (Admin only)
**Purpose:** the handful of clinic-level configuration values the system needs.
**Layout:** a vertical sub-nav within the Settings page (Clinic Info / Invoice Settings / Service Settings / User Settings / General) — a settings-within-settings pattern is appropriate here since it's low-frequency and benefits from being organized, unlike the main app nav which optimizes for speed.
**Clinic Info:** name, logo upload (used on the invoice PDF and login screen), address, phone — feeds directly into the PDF template.
**Invoice Settings:** invoice number prefix/format, default additional-charge type if any, PDF template preview.
**Service Settings:** a shortcut into the Services catalog (already covered under the main nav — this is just a pointer, not a duplicate screen).
**General:** language/locale toggle if the system ever needs bilingual UI switching beyond Arabic-first (currently out of scope per the brief, but the settings slot is reserved so it doesn't require restructuring later).

---

## 6. Reception Workflow UX

The core flow gets a dedicated pass because it's explicitly the primary success metric for this design.

**Search patient → Open patient → Create visit → Select services → Create invoice → Record payment → Print / PDF / WhatsApp**

| Step | Screen | Clicks from previous step | Design decision that removes friction |
|---|---|---|---|
| Search patient | Dashboard or any screen (global search in topbar, recommended addition — see §9) or Patients list | 1 (type + select) | One unified search box matches Civil ID/name/phone simultaneously — no field-picker required |
| Open patient | Patients list → Profile | 1 (row click) | Entire row is clickable, not just a small "view" icon |
| Create visit | Patient Profile → Visit form | 1 ("+ New Visit," always visible in the fixed profile panel) | Patient is pre-filled; button is never scrolled out of view |
| Select services & create invoice | Visit form → Invoice creation | 1 ("Continue to Invoice") | Visit → Invoice is one continuous flow, not two separately-entered screens |
| Issue invoice | Invoice creation | 1 (+1 confirm) | The confirm step is intentional friction (§5.7) — the only deliberately-added click in the whole flow, because it guards an irreversible action |
| Record payment | Invoice Detail → Payment modal | 1 | Remaining balance pre-shown in the modal, no lookup needed |
| Print / PDF / WhatsApp | Invoice Detail | 1 each | Grouped as one action cluster, always visible once issued |

**Total: ~7 primary clicks plus one deliberate confirmation** from "empty search box" to "invoice shared via WhatsApp" for a returning patient — this is the number implementation should be checked against; if any future addition pushes this past roughly 8–9 clicks, that addition needs to be reconsidered, not just added.

---

## 7. Responsive Strategy

Desktop-first, but every screen must degrade gracefully — reception desks sometimes run on modest laptops, and Admin may check the dashboard on a tablet or phone.

| Breakpoint | Range | Sidebar | Tables | Forms |
|---|---|---|---|---|
| Desktop | ≥1280px | Expanded (240px), always visible | Full columns visible | Two-column layouts (e.g., Invoice creation) |
| Laptop | 1024–1279px | Collapsible to icon rail | Full columns, tighter padding | Two-column layouts retained, tighter gutters |
| Tablet | 768–1023px | Collapsed to icon rail by default, expandable via topbar toggle (overlay, not push) | Lower-priority columns hidden (e.g., patient list drops the "last visit" column, keeps Civil ID/Name/Phone) | Invoice creation's two columns stack — totals panel becomes a sticky bottom bar instead of a side panel, so it's still always visible |
| Mobile | <768px | Hidden behind a hamburger menu (full-screen overlay when open) | Tables convert to stacked cards (one record per card: primary identifier + 2–3 key fields + a chevron to open) | All forms single-column; the Invoice totals become a collapsible bottom sheet the user can expand while scrolling the line items |

**Reception workstations are assumed desktop/laptop** — mobile support exists for Admin oversight (checking the dashboard, approving something remotely), not for running the invoice flow day-to-day. This should be an explicit, stated assumption (§9) rather than an implicit one, since it affects how much mobile-specific polish the invoice screen actually needs.

---

## 8. Design Tokens (Implementation-Ready)

```
/* Color */
--color-primary-dark:   #111844;
--color-primary:        #4B5694;
--color-secondary:      #7288AE;
--color-accent-warm:    #EAE0CF;

--color-bg:              #F6F7FA;
--color-surface:         #FFFFFF;
--color-border:          #E3E6EE;
--color-border-strong:   #C9CEDC;
--color-text-primary:    #111844;
--color-text-secondary:  #5B6478;
--color-text-muted:      #8991A6;
--color-disabled-bg:     #EEF0F5;

--color-success:         #1B8A5A;
--color-success-bg:      #E7F6EE;
--color-warning:         #B4791F;
--color-warning-bg:      #FCF3E1;
--color-error:           #C4362B;
--color-error-bg:        #FBEAE8;
--color-info:            #2A5FBF;
--color-info-bg:         #EAF1FB;

/* Typography */
--font-family: 'Cairo', 'Segoe UI', Tahoma, sans-serif;
--text-display: 700 28px/36px var(--font-family);
--text-h1:      700 22px/30px var(--font-family);
--text-h2:      600 18px/26px var(--font-family);
--text-h3:      600 15px/22px var(--font-family);
--text-body:        400 14px/22px var(--font-family);
--text-body-medium: 500 14px/22px var(--font-family);
--text-small:       400 13px/18px var(--font-family);
--text-caption:     400 12px/16px var(--font-family);

/* Spacing */
--space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
--space-5: 20px; --space-6: 24px; --space-7: 32px; --space-8: 40px;
--space-9: 48px; --space-10: 64px;

/* Radius */
--radius-sm: 6px; --radius-md: 10px; --radius-lg: 14px; --radius-full: 999px;

/* Shadow */
--shadow-sm: 0 1px 2px rgba(17,24,68,0.06);
--shadow-md: 0 4px 12px rgba(17,24,68,0.08);
--shadow-lg: 0 12px 32px rgba(17,24,68,0.14);

/* Breakpoints */
--bp-tablet:  768px;
--bp-laptop:  1024px;
--bp-desktop: 1280px;
```

---

## 9. Accessibility Recommendations

- **Contrast:** `color-primary` (#4B5694) on white passes AA for large text/UI components but is borderline for small body text — use `color-primary-dark` (#111844) for any small-text links/labels, reserve `#4B5694` for buttons (white-on-primary passes comfortably) and large headings.
- **RTL correctness:** every directional icon (chevrons, back arrows) must mirror in RTL — this needs explicit QA, not just relying on `dir="rtl"` for layout (icons don't auto-flip).
- **Keyboard support:** the entire reception flow (§6) must be completable without a mouse — search box autofocus on page load for Patients/Dashboard, `Enter` to select the top search result, `Tab` order following visual/reading order (right-to-left), and the Invoice creation screen specifically needs fast keyboard entry for adding service lines (a receptionist should be able to add 3 services without touching the mouse).
- **Focus states:** every interactive element needs a visible focus ring (`color-primary`, 2px, offset) — required both for accessibility and because keyboard-driven speed is a core requirement for this specific role, not just a compliance checkbox.
- **Status not color-only:** already covered in §2.10 — every badge carries a text label, never a bare color.
- **Form errors:** associate error text with its field via `aria-describedby` so screen readers (and just generally, robust semantics) connect the two.
- **Motion:** respect `prefers-reduced-motion` — this UI shouldn't rely on animation to convey meaning at all (per the brief's "avoid unnecessary animations"), so this is a low-cost, easy win.

---

## 10. UX Risks & Ambiguities to Resolve Before Implementation

| # | Open question | Why it matters for this spec specifically |
|---|---|---|
| 1 | Is a **global search** (topbar, available from any screen) in scope, or is patient search only available from the Patients list page? | Materially changes the click-count in §6 — a global search shaves a step off the most common workflow in the entire system. Recommended if feasible. |
| 2 | Who resets a forgotten password — Admin-mediated (as assumed in §5.1/§5.11) or self-service email reset? | Determines whether the Login screen needs a "forgot password" flow at all, or just a message directing staff to ask an Admin. |
| 3 | Is invoice/report **export** (CSV/PDF beyond the invoice PDF itself) actually required? | Affects whether §5.10's export button ships in v1 or is a placeholder for later. |
| 4 | Should reception workstations ever run on tablet, or is desktop/laptop a safe hard assumption? | Determines how much implementation effort goes into the tablet breakpoint for the Invoice creation screen specifically (§7) — its two-column-to-sticky-bar transition is the most complex responsive behavior in the whole spec. |
| 5 | Does "additional charge" (percentage/fixed) ever need to be **per-line** rather than invoice-level? | The current spec (§5.7) treats it as one invoice-level charge, which matches the brief as written — confirm this is correct before building, since per-line would change the table structure. |
| 6 | Is there a real clinic logo/brand asset yet? | Login screen (§5.1) and invoice PDF both need it; a placeholder now means a design pass later. |
| 7 | Does "Reports" need any restriction for Receptionist (e.g., hide staff-performance-style breakdowns), or is it identical for both roles? | §5.10 currently assumes read-only-for-both with no content difference — confirm before implementation locks that in. |

---

*This specification intentionally leaves all application/backend logic, data modeling, and RBAC enforcement to the separate technical architecture document already produced for this project — it defines what staff see and do, not how the system stores or protects the data behind it.*
