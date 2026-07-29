# Implement Custom Filters and Data/SMS Tracking

Based on your request, we need to add a custom "Time Between" filter and significantly expand the dashboard to track Internet (Data) and SMS usage alongside Voice Calls. This involves modifying the PDF parser, storage, and completely redesigning the dashboard layout and menus.

## User Review Required

> [!IMPORTANT]
> **Dashboard Redesign:** You mentioned "call ke liye sirf ek column rakho". I plan to update the main dashboard to have **3 main cards (columns)** at the top: **Total Calls**, **Total Internet (GB)**, and **Total SMS**. Is this what you meant?

> [!WARNING]
> **Data Privacy:** As always, all data will remain completely local and stateless. When the page is refreshed, the imported Data, SMS, and Call logs will be cleared.

## Proposed Changes

### Custom Date Range Filter
- **[MODIFY]** `index.html`: Add a "Custom Range" option in the Time Range dropdown. When selected, two new date input fields (`Start Date` and `End Date`) will appear.
- **[MODIFY]** `script.js`: Update the `getDashboardFilteredLogs()` function to filter the data based on the selected custom start and end dates.

### PDF Parser Engine (`jio-parser.js`)
- **[MODIFY]** `jio-parser.js`: Update the extraction engine to split the PDF text into three sections based on Jio Bill headers: `Voice`, `Data`, and `SMS`.
- Parse **Internet Usage** (Date, Start/End Time, Volume in MB).
- Parse **SMS Usage** (Date, Time, Mobile Number, Count).

### UI & Menus Restructuring
- **[MODIFY]** `index.html`: 
  - Add two new tabs in the navigation bar: **Internet** and **SMS**.
  - Create new HTML sections for these menus, containing Data and SMS tables and relevant charts.
  - Redesign the main Dashboard summary to focus on high-level metrics for all three categories (Calls, Internet, SMS).
- **[MODIFY]** `style.css`: Add styles for the new date inputs and the new Data/SMS tables.

### JavaScript Logic
- **[MODIFY]** `storage.js`: Add functions to store and retrieve `dataLogs` and `smsLogs`.
- **[MODIFY]** `script.js` & `dashboard.js`: Process the newly parsed data and populate the Internet and SMS menus dynamically. Add tab-switching logic for the new menus.

## Verification Plan

### Manual Verification
1. Import the Jio Bill PDF.
2. Verify that the Dashboard successfully shows Total Calls, Total Internet, and Total SMS.
3. Use the new Custom Date Range filter to select a "Between" date range and verify that the stats update.
4. Navigate to the new "Internet" and "SMS" menus and ensure the tables and charts populate correctly with data from the PDF.
