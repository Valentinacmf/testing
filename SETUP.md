# Google Sheets tracking — setup

## 1. Create the Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new spreadsheet.
2. Name it something like "Pillar Test Events".

## 2. Add the Apps Script

1. In the sheet, click **Extensions → Apps Script**.
2. Delete the default `function myFunction() {}` placeholder.
3. Open [apps-script.gs](apps-script.gs) from this repo and paste the entire contents into the editor.
4. Click the **Save** icon (or Cmd+S).

## 3. Deploy as Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Fill in:
   - **Description:** "Pillar test tracker" (anything)
   - **Execute as:** Me
   - **Who has access:** **Anyone** ← important, so testers' browsers can POST without auth
4. Click **Deploy**.
5. Authorize when prompted (you may need to click "Advanced → Go to ... (unsafe)" — this is normal for personal Apps Scripts).
6. Copy the **Web app URL**. It looks like `https://script.google.com/macros/s/AKfy.../exec`.

## 4. Wire the URL into tracking.js

1. Open [tracking.js](tracking.js).
2. Replace `PASTE_YOUR_APPS_SCRIPT_URL_HERE` with your Web app URL.
3. Save.

## 5. Test it

1. Open `index.html` in a browser and click a pillar card.
2. Go back to your Google Sheet — you should see new rows appearing within a second or two.
3. If nothing shows up, open the browser DevTools console for error messages.

## 6. Share the test

Host the HTML files anywhere (GitHub Pages, Netlify drop, etc.) and send the URL to your testers. Every click and pageview lands in your sheet.

## Re-deploying after changes

If you ever edit the Apps Script: **Deploy → Manage deployments → pencil icon → Version: New version → Deploy**. The URL stays the same.

## Data you'll see

**One row per tester.** Each row updates in place as that tester's events come in.

| Column | Meaning |
|---|---|
| `sessionId` | Unique per-browser ID |
| `firstSeen` | First event from this tester |
| `lastSeen` | Most recent event from this tester |
| `pillarsVisited` | Comma-separated list, in visit order — e.g. `A,C,E` |
| `visitsA` … `visitsF` | How many times they viewed each pillar page |
| `timeA_s` … `timeF_s` | Total seconds spent on each pillar page (sums across visits) |
| `chosenPillar` | Which pillar they hit Add to Cart on (A–F). Empty = no conversion. |
| `reason` | Free-text answer from the thank-you survey |
| `totalClicks` | Total clicks anywhere across the test |
| `userAgent` | Browser info |

## Aggregating in the sheet

Add a second tab and use formulas like:

- **Conversions per pillar:**
  `=QUERY(Sheet1!A:T, "SELECT Q, COUNT(Q) WHERE Q <> '' GROUP BY Q LABEL COUNT(Q) 'count'")`
- **All survey reasons grouped by pillar:**
  `=QUERY(Sheet1!A:T, "SELECT Q, R WHERE R <> '' ORDER BY Q")`
- **Avg time on each pillar (only for testers who visited it):**
  Per pillar: `=AVERAGEIF(K:K, ">0")` (column K = `timeA_s`), L for B, M for C, etc.
- **Total testers / conversion rate:**
  Testers: `=COUNTA(A2:A)` · Conversions: `=COUNTIF(Q2:Q, "<>")` · Rate: `=COUNTIF(Q2:Q,"<>")/COUNTA(A2:A)`
- **Funnel — who visited each pillar:**
  Pillar A: `=COUNTIF(E2:E, ">0")` (column E = `visitsA`), F for B, etc.
