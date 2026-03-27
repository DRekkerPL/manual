# # Pricing Manual Override Analysis

## Project overview

This repository contains the analytical framework for classifying and reducing manual price overrides made by salespeople in the NAV (Microsoft Dynamics Business Central) ERP system at EET Group.

The core KPI is to **reduce the share of manual price adjustments** by identifying why they happen, classifying them into meaningful categories, and building automation rules that eliminate the need for manual intervention.

The analysis runs on the `WebBE` database and is built on top of the `[Pricing].[PriceType_All]` SQL view, extended with a 17-category classification framework split into two sections:

- **Procedural (A1–A9):** System-driven adjustments, expected outcomes, not a concern
- **Manual (B10–B17):** Human discretion, the target for reduction

---

## Repository structure

```
/
├── README.md
├── sql/
│   ├── PriceType_All_annotated.sql        # Full view code with fix markers and comments
│   ├── price_adjusted_complete_17cat.sql  # Complete 17-category CASE block (drop-in)
│   ├── stale_quote_analysis.sql           # Empirical validation query for B13
│   └── pricing_analysis_fragments.sql     # Individual fragments per topic
├── docs/
│   ├── pricing_manual_analysis.docx       # Plain language description of each manual category
│   └── pricing_manual_B10_B17_simple.docx # Developer reference for B10-B17
├── data/
│   └── AT_results_manual.xlsx             # AT country test results (55k rows)
└── analysis/
    └── (output files from Python analysis go here)
```

---

## Classification framework

### Section A — Procedural (do not count against KPI)

| Code | Category | Key signal |
|------|----------|------------|
| A1 | PT_OBS / Campaign | `ile.[Cost changed Reasoncode]` IN ('UKURANS','AUTOOBS') |
| A2 | QTY Discount | `SIL.[Price Adjusted]` = 3 |
| A3 | Requested EDI/XML | Origin IN ('API','EDI','RPA','XML') + price matches requested |
| A4 | Requested Web | Origin = 'WEB' + price matches requested |
| A5 | Project Bid | Special Bid = 1 + Bid cost change reason code exists |
| A6 | Partner/Vendor Agreement | `CPPL.[Reason Type]` IN (2, 4) |
| A7 | BID (Claim) | Special Bid = 1 + Cost changed Type IN (1, 3) |
| A8 | Blanket Order | `SIL.[Blanket Order No.]` not empty |
| A9 | Replacement / RMA | `ile.[Unit Amount]` = 0 |

### Section B — Manual (KPI target: reduce)

| Code | Category | Key signal | Status |
|------|----------|------------|--------|
| B10 | Volume Qtys | Qty > 5, no `I.[Qty. Disc. Code]` exists | TBD — may leave out |
| B11 | Matching Previous Sale | Price matches LAG of previous sale for same Customer + Item | Implemented via CTE |
| B12 | Customer Agreement | `CPPL.[Reason Type]` not null, not 2 or 4 — split by type: 1 = Local Recommendation, 3 = Customer Recommendation | Active |
| B13 | Stale Quote | Quote > 7 days old (MinuteDiff > 10080) | Confirmed by data — manual rate 30% vs 5% baseline |
| B14 | Unit / Fixed Price | `EffectivePriceType` = 0 | Active |
| B15 | Cost Change | Cost reason code present, not UKURANS/AUTOOBS | Active |
| B16 | Currency | `SIH.[Currency Factor]` not 0 and not 1 | Active |
| B17 | Waterfall Prices | TBD | Placeholder only |

---

## Key fields

| Field | Source | Purpose |
|-------|--------|---------|
| `SIL.[Price Adjusted]` | SalesInvoiceLine | Primary adjustment flag (1=Manual, 2=Requested, 3=QtyDisc, 4=Suggested, 5=FromBid) |
| `SIL.[Original Unit Price]` | SalesInvoiceLine | System-calculated price before adjustment |
| `SIL.[Unit Price]` | SalesInvoiceLine | Final invoiced price |
| `ile.[Cost changed Reasoncode]` | ItemLedgerEntry | Cost change reason (COSTCHANGE, REGULERING, UKURANS, AUTOOBS, GR-COUNTRY) |
| `ile.[Special Bid]` | ItemLedgerEntry | Bid flag |
| `CPPL.[Reason Type]` | CustomerPriceProfileLine via cpp join | Profile type: 1=Local, 2=Partner, 3=Customer, 4=Vendor |
| `SSH.[Quote created on]` | SalesShipmentHeader | Quote creation timestamp |
| `SSH.[Order Created at]` | SalesShipmentHeader | Order placement timestamp |
| `I.[Qty. Disc. Code]` | Item | Whether a formal QTY discount profile exists |
| `SIH.[Currency Factor]` | SalesInvoiceHeader | Exchange rate factor (1 = LCY) |

---

## Known issues in current code (PriceType_All_new_code_002.sql)

These are marked with `-- !! FIX N` comments in `sql/PriceType_All_annotated.sql`.

1. **FIX 1 — Line 84:** `LEFT JOIN` on SalesInvoiceLine should be `INNER JOIN`. Causes 1,068 ghost rows with NULL pricing fields classified as 'Manually'.
2. **FIX 2 — Lines 587–592:** WEB origin is dead code — already caught in the line above. Split into separate conditions with correct labels ('XML/EDI' vs 'Web Requested').
3. **FIX 3 — Lines 601–603:** 2,000 rows with `PriceAdjustedCode = 5` (From Bid) fall through to 'Manually'. Decide whether code 5 alone is sufficient to classify as 'From Bid'.
4. **FIX 4 — Lines 616–618:** B12 Customer Agreement fires on Reason Types 2 and 4 which are already Partner/Vendor in A6. Add `NOT IN (2, 4)` guard.
5. **FIX 5 — After line 626:** B10, B15, B16 are missing from `[Manual Price Adjustments]` column. Commented-out code is ready to uncomment in annotated file.
6. **FIX 6 — Line 627:** No `ELSE` clause in `[Manual Price Adjustments]`. Unclassified rows return NULL. Add `ELSE 'Manually'`.

---

## Analysis tasks (for Claude Code)

When running analysis on this repository, the following tasks are the priority:

### 1. Correlation analysis
Load the main data file from `/data/` and find correlations between manual override categories. Specifically:
- Which `[Price Adjusted2]` and `[Manual Price Adjustments]` category combinations appear most frequently on the same row
- Overlap matrix across all B10–B17 categories
- Whether overlapping rows tend to have higher or lower margin erosion than non-overlapping rows

### 2. Prioritization matrix
For each manual category, compute:
- Row count (volume)
- Sum of `TurnoverLCY` (revenue at stake)
- Average margin erosion: `(Original Unit Price - Unit Price) / Original Unit Price`
- Rank categories by combined volume + value impact

### 3. Overlap resolution
The CASE block classifies each row into exactly one category based on priority order. Rows that match multiple conditions are classified by whichever fires first. Analyse whether the current priority order is optimal — i.e. when a row matches both B11 and B12, which is the more informative label?

### 4. Concentration analysis
- Which salespersons, brands, and customers account for the highest share of manual adjustments per category?
- Are manuals concentrated (fixable by targeting a few actors) or diffuse (requires system-level rules)?

### 5. Stale quote validation
B13 is confirmed — manual rate jumps from 5% to 30% at the 7-day mark. Extend this analysis:
- At what exact day threshold does the rate start climbing?
- Is the rate different by order origin (WEB vs EDI vs manual entry)?
- Which brands are most affected?

---

## Database context

- **ERP:** Microsoft Dynamics NAV / Business Central
- **Database:** WebBE (per-country databases, same schema)
- **Base view:** `[Pricing].[PriceType_All]`
- **BI layer:** Power BI connected to WebBE views
- **Countries:** AT (Austria) used for initial testing — same logic deploys to all country DBs

---

## Output conventions

- All monetary values in LCY (local currency) unless suffixed `_DKK`
- `TurnoverLCY` = `ile.Amount * -1`
- `Qty` = `ile.[Invoiced Quantity] * -1`
- Margin erosion = `Original Unit Price - (Unit Price + Line Discount Amount)`
- A NULL in `[Price Adjusted2]` means no price change occurred (not an adjustment)
- A NULL in `[Manual Price Adjustments]` means either not manually adjusted or not yet classified

---

## Contact

Analysis owner: Marcin (Pricing Specialist, EET Group)
Developer: AT team
