# Dashboard — Manual Price Override Analysis

## What to build

A React dashboard for EET Group country Managing Directors. The purpose is to show why salespeople are changing prices manually, how often it happens, and which customers and salespersons are responsible.

The dashboard reads from pre-aggregated CSV files in `/analysis/{COUNTRY}/`. It does not connect to any database or API — all data is static CSV.

---

## Tech stack

- **React** with hooks
- **Recharts** for all charts
- **Tailwind CSS** for styling
- No backend, no authentication — pure static frontend

---

## Data files

Each country has its own folder under `/analysis/`. Currently available: `FR`, `DK`.

### `/analysis/{COUNTRY}/baseline_metrics.csv`
Monthly manual price change rate. One row per country/year/month.

| Column | Type | Description |
|---|---|---|
| BusinessUnit | string | Country code (FR, DK, etc.) |
| YearKey | int | Year (2024, 2025, 2026) |
| MonthKey | int | Month key (202401, 202402, etc.) |
| TotalLines | int | Total invoiced order lines |
| ManualLines | int | Lines where salesperson changed the price |
| ManualPct | float | ManualLines / TotalLines × 100 |
| DiscountEUR | float | Total EUR discount given vs system price |
| TurnoverEUR | float | Total EUR turnover |

### `/analysis/{COUNTRY}/category_breakdown.csv`
Volume and discount per adjustment category. One row per country/category.

| Column | Type | Description |
|---|---|---|
| BusinessUnit | string | Country code |
| OrderLines | int | Order lines in this category |
| DiscountEUR | float | EUR discount given in this category |
| TurnoverEUR | float | EUR turnover in this category |
| CategoryCode | string | Internal code (PA2_Manually, MPA_StaleQuote, etc.) |
| CategoryLabel | string | Plain language label for display |
| Type | string | 'Manual' or 'Expected' |
| TotalLines | int | Total lines in country (for % calculation) |
| PctOfTotal | float | OrderLines / TotalLines × 100 |

### `/analysis/{COUNTRY}/customer_ranking_by_category.csv`
Top 20 customers per category ranked by EUR discount.

| Column | Type | Description |
|---|---|---|
| BusinessUnit | string | Country code |
| CustomerNo | string | Customer number |
| CustomerName | string | Customer name (may be missing if FIX 7 not applied) |
| OrderLines | int | Order lines for this customer in this category |
| DiscountEUR | float | EUR discount for this customer in this category |
| TurnoverEUR | float | EUR turnover |
| CategoryCode | string | Category code |
| CategoryLabel | string | Category label |
| CatDiscountEUR | float | Total category discount (for % calculation) |
| PctOfCategory | float | This customer's share of category discount |

### `/analysis/{COUNTRY}/salesperson_detail.csv`
Salesperson breakdown per customer per category.

| Column | Type | Description |
|---|---|---|
| BusinessUnit | string | Country code |
| CustomerNo | string | Customer number |
| Salesperson | string | Salesperson code |
| OrderLines | int | Order lines |
| DiscountEUR | float | EUR discount |
| CategoryCode | string | Category code |
| CategoryLabel | string | Category label |
| CustCatDiscountEUR | float | Total for this customer+category |
| PctOfCustomer | float | This salesperson's share |

### `/analysis/{COUNTRY}/stale_quote_analysis.csv`
Manual rate by quote age bucket. Confirms the 7-day threshold hypothesis.

| Column | Type | Description |
|---|---|---|
| BusinessUnit | string | Country code |
| QuoteBucket | string | Age bucket (1. Same day, 2. 1-3 days, etc.) |
| TotalLines | int | Total lines in this bucket |
| ManualLines | int | Manual adjustments in this bucket |
| DiscountEUR | float | EUR discount in this bucket |
| ManualPct | float | Manual rate % |

### `/analysis/{COUNTRY}/overlap_matrix.csv`
How often two manual categories appear on the same order line.
Note: only meaningful when bit flag columns are in the export. Currently all zeros because the export uses text columns. Will populate once developer updates the SQL export.

---

## Category labels

Use these exact labels in the UI — never show the CategoryCode to the user.

| CategoryCode | Display label | Type |
|---|---|---|
| PA2_QtyDiscount | QTY Discount | Expected |
| PA2_Ukurans | PT_OBS / Campaign | Expected |
| PA2_XmlEdi | Order origin XML/EDI | Expected |
| PA2_WebRequested | Web Requested | Expected |
| PA2_FromProjectBid | Project Bid | Expected |
| PA2_PartnerVendor | Vendor/Partner Agreement | Expected |
| PA2_BlanketOrder | Blanket Order | Expected |
| PA2_FromBid | Bid Price | Expected |
| PA2_ReplacementSample | Replacement / Sample | Expected |
| PA2_Manually | Manual Price Change | Manual |
| MPA_MatchingPreviousSale | Matching Previous Sale | Manual |
| MPA_StaleQuote | Stale Quote | Manual |
| MPA_UnitFixedPrice | Fixed / Unit Price | Manual |
| MPA_CustomerAgreement | Local Profile | Manual |

---

## Dashboard structure — 3 pages

### Page 1 — Country overview

**Purpose:** One-page summary for the MD. How big is the problem and is it getting better?

**Country selector** at the top — loads data from the corresponding `/analysis/{COUNTRY}/` folder.

**3 KPI cards:**
- Total order lines (sum of TotalLines from baseline, latest 12 months)
- Manual Price Change % (latest month ManualPct)
- Total discount given in EUR (sum of DiscountEUR from baseline, latest 12 months)

**Trend line chart:**
- Source: `baseline_metrics.csv`
- X axis: MonthKey formatted as MMM YYYY
- Y axis: ManualPct (%)
- Single line, 24 months
- Add a horizontal reference line at the average
- Title: "Share of order lines with a manual price change"

**Category bar chart:**
- Source: `category_breakdown.csv`
- Horizontal bars sorted descending by OrderLines
- Color: gray for Type = 'Expected', orange (#F97316) for Type = 'Manual'
- Show OrderLines count and PctOfTotal on each bar
- Clicking a bar navigates to Page 2 for that category
- Title: "What is driving price adjustments?"

---

### Page 2 — Category deep dive

**Purpose:** Which customers are driving this category and what does it cost?

Activated by clicking a category bar on Page 1.

**Header:** CategoryLabel in large text. One-line description below (use descriptions from the table in the main README).

**3 KPI cards:**
- Order lines in category (OrderLines)
- EUR discount (DiscountEUR formatted as €X,XXX,XXX)
- % of all lines (PctOfTotal)

**Category trend chart:**
- Source: `baseline_metrics.csv` — note: baseline only has PA2_Manually total, not per sub-category
- For PA2_Manually: show the monthly ManualPct trend
- For MPA categories: show as a static note "Trend available in next data refresh"
- This is a known limitation of the current export format

**Customer table:**
- Source: `customer_ranking_by_category.csv` filtered to selected category
- Columns: Rank | Customer name (or number if name missing) | Order lines | EUR discount | % of category
- Sorted by DiscountEUR descending
- Top 20 rows
- Clicking a row navigates to Page 3

**Back button** to Page 1.

---

### Page 3 — Customer and salesperson detail

**Purpose:** Actionable list for the MD to use in a conversation with their sales team.

Activated by clicking a customer row on Page 2.

**Header:** Customer name and number. Category label shown as a tag/badge.

**Salesperson table:**
- Source: `salesperson_detail.csv` filtered to selected customer + category
- Columns: Salesperson | Order lines | EUR discount | % of customer total
- Sorted by DiscountEUR descending

**Export button** — downloads the salesperson table as CSV

**Back button** to Page 2.

---

## Stale quote page (optional, standalone)

If time permits, add a fourth page accessible from the main nav:

**Source:** `stale_quote_analysis.csv`

**Bar chart:** ManualPct by QuoteBucket — one bar per age bucket
- Should show a clear step up at the "4. 7-14 days" bucket
- Title: "Manual price change rate by quote age"
- Subtitle: "System forces price recalculation after 7 days — manual adjustments spike as a result"

---

## Design guidelines

- Clean, professional — this goes in front of Managing Directors
- No dark mode needed
- Primary color: deep blue (#1B3A6B)
- Manual/alert color: orange (#F97316)
- Expected/neutral color: gray (#6B7280)
- Font: system sans-serif is fine
- All monetary values formatted with € prefix and thousands separator
- All percentages to 1 decimal place
- No jargon visible to the user — use plain language labels only

---

## Known data limitations

- **CustomerName may be missing** — fall back to CustomerNo if CustomerName column is empty or not present
- **MPA category trends not available** — baseline only tracks total manual %, not per sub-category. This will improve once the developer updates the SQL export with bit flag columns
- **Overlap matrix is all zeros** — limitation of text column export. Ignore for now
- **April 2026 data is partial** — only a few days. Exclude the current incomplete month from trend charts
- **FR uses UTF-8 encoding, DK uses latin-1** — handled in the Python analysis script, not relevant for the dashboard which reads pre-processed CSVs

---

## File loading pattern

```javascript
// Load data for a country
const loadCountryData = async (country) => {
  const [baseline, categories, customers, salespersons, staleQuote] = await Promise.all([
    fetch(`/analysis/${country}/baseline_metrics.csv`).then(r => r.text()),
    fetch(`/analysis/${country}/category_breakdown.csv`).then(r => r.text()),
    fetch(`/analysis/${country}/customer_ranking_by_category.csv`).then(r => r.text()),
    fetch(`/analysis/${country}/salesperson_detail.csv`).then(r => r.text()),
    fetch(`/analysis/${country}/stale_quote_analysis.csv`).then(r => r.text()),
  ]);
  // Parse CSVs and return
};
```

Use `papaparse` for CSV parsing — it handles edge cases cleanly:
```javascript
import Papa from 'papaparse';
const parsed = Papa.parse(csvText, { header: true, dynamicTyping: true });
const data = parsed.data;
```

---

## Running locally

```bash
npx create-react-app pricing-dashboard
cd pricing-dashboard
npm install recharts papaparse
# Copy /analysis/ folder into /public/analysis/
npm start
```

---

## Current data coverage

| Country | Period | Total rows | Manual % range |
|---|---|---|---|
| FR | Apr 2024 – Mar 2026 | 331,921 | 8.5% – 12.2% |
| DK | Apr 2024 – Mar 2026 | 373,902 | 1.3% – 2.9% |

More countries to be added before the MD presentation on April 16th.
