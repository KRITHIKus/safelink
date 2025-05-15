# 🚀 Bullseye – URL Safety Scanner

Bullseye is a futuristic, professional-grade web application that allows users to scan URLs for safety threats such as phishing or malware. It combines modern frontend technology with real-time scanning APIs and a smart crawler. Users can view results with screenshots, status filters, and more, all wrapped in a sleek, mobile-responsive interface.

## 🛠️ Tech Stack

### 🔹 Frontend
- **Framework**: React + Vite
- **Styling**: Tailwind CSS 3
- **Theme Toggle**: Light/Dark Mode with smooth transitions
- **Icons**: FontAwesome
- **Routing**: React Router

### 🔹 Backend
- **Language**: Python (FastAPI or Flask)
- **Database**: MongoDB (two collections: `safesurf`, `screenshots`)
- **Screenshot Storage**: Cloudinary
- **Scan APIs**:
  - VirusTotal API (for URL safety analysis)
  - Custom crawler (for screenshot and metadata extraction)

### 🔹 Hosting
- **Frontend & Backend**: Deployed on Render
- **Database**: MongoDB Atlas
- **Screenshots**: Cloudinary (named by website domain)

## 📋 Features
- 🔍 Scan any URL for threats using VirusTotal
- 🌐 Take real-time screenshots of websites using a smart crawler
- 🖼️ View and fullscreen screenshots in scan results
- 🧩 Dual-pane layout: VirusTotal on the left, Crawler on the right
- 🌗 Light and Dark mode support with smooth UI transitions
- ✅ Status indicators for Safe / ⚠️ Malicious sites
- 📱 Fully responsive and mobile-friendly interface
- 🔄 Filter scans by status (All, Safe, Malicious)
- 🕓 Recent scans: displays the latest 10 by default
- 📂 “See More” page to view extended scan history
- 📸 QR Code popup for quick mobile access

## 📁 Frontend Folder Structure
```plaintext
src/
├── components/  # Reusable UI components (Navbar, Footer, Cards, etc.)
├── pages/       # Home, Scan, RecentScans, etc.
├── assets/      # Icons, images, logos
├── context/     # Theme and global state
├── utils/       # Helper functions
├── App.jsx
└── main.jsx
🗃️ MongoDB Collections
📂 1. safesurf
Stores scan result metadata:

json
Copy
Edit
{
  "url": "https://example.com",
  "status": "Safe",
  "scanDate": "2025-05-15T10:00:00Z",
  "virustotalData": { ... },
  "crawlerData": { ... }
}
📂 2. screenshots
Stores screenshot URLs hosted on Cloudinary:

json
Copy
Edit
{
  "url": "https://example.com",
  "websiteName": "example",
  "screenshotUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/example.png"
}
⚙️ How It Works – Workflow
User submits a URL

Frontend: Shows a loading indicator, sends a request to the backend.

Backend:

Calls the VirusTotal API for threat analysis.

Uses a custom crawler to visit the site and take a screenshot.

Uploads the screenshot to Cloudinary.

Saves results in MongoDB (safesurf & screenshots).

Frontend:

Displays results side-by-side (VirusTotal on left, crawler/screenshot on right).

Allows full-screen screenshot viewing.

Enables status-based filtering (Safe / Malicious / All).

🌐 Live Site
🔗 Bullseye URL Safety Scanner

🧩 UI Components Overview
Navbar – Site-wide navigation with theme toggle

URL Scanner – Input field for URL + Scan button

Scan Results View – Dual-panel result display

Screenshot Viewer – With fullscreen preview

Recent Scans – Shows the latest 10 scans

See More Page – All historical scans + filters

QR Code Button – Floating button revealing QR popup

Footer – Simple, theme-matching footer

📌 Design Highlights
VirusTotal-inspired layout with spacious alignment

Light and Dark theme support across all pages

Keyword highlighting for scan status

FontAwesome icons (no emojis)

Smooth transitions and visual clarity

No design inconsistencies across themes

📈 Future Enhancements
User login & scan history dashboard

Email / PDF reports for scanned URLs

Visual graphs for scan breakdown

Internationalization (i18n)

Performance improvements and smart caching

👨‍🎓 Author
Developed as a final year college project to combine cybersecurity, web crawling, and modern web development with real-world deployment and UI/UX best practices.




