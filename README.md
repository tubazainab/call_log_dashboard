# Call Log Dashboard

A modern, stateless, and privacy-focused Call Log Dashboard built with HTML, CSS, and Vanilla JavaScript. 
Easily manage your call logs, analyze statistics, and visualize your communication data without worrying about your data being stored on any server.

## Features

- **Stateless Architecture**: Operates entirely in the browser memory. Once you refresh or close the tab, all your data is securely erased. No backend required!
- **Jio Bill Import**: Automatically parse and extract voice call details from your Jio Postpaid/Prepaid PDF statements.
- **Dynamic Charts**: Interactive Line, Bar, and Doughnut charts built with Chart.js to visualize Call Durations, Call Types, and Top Contacts.
- **Dark & Light Mode**: Seamless theme switching for comfortable viewing at any time of day.
- **Export & Download**: 
  - Download a high-quality screenshot of your dashboard using the one-click Camera icon.
  - Export your parsed call logs to CSV or Excel for further analysis.
- **Mobile Responsive**: A beautiful, fluid layout that adapts perfectly to desktops, tablets, and smartphones.

## How to Use

1. **Open the App**: Simply open `index.html` in any modern web browser.
2. **Import Data**: Click the **Import Bill** button to upload your Jio PDF statement. The app will securely extract your call records locally.
3. **Analyze**: Navigate between the Dashboard, Analytics, and Call History tabs to view your communication insights.
4. **Save a Copy**: Click the **Download Screenshot** button to save a picture of your dashboard, or export the data to CSV before closing the tab.

## Technologies Used

- **HTML5 & CSS3** (Custom Glassmorphism UI)
- **Vanilla JavaScript** (ES6+)
- **Chart.js** (Data Visualization)
- **PDF.js** (Local PDF Parsing)
- **html2canvas** (Dashboard Screenshot capture)
- **FontAwesome** (Icons)

## Setup & Installation

Since this is a client-side only web application, no installation or build tools are required!

1. Clone the repository:
   ```bash
   git clone https://github.com/tubazainab/call_log_dashboard.git
   ```
2. Navigate to the project directory and double-click `index.html` to open it in your browser.

## Privacy Note

Your privacy is the top priority. This application does not connect to any database or backend server. All PDF parsing and data visualization happen directly within your browser. 
