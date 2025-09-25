# 🚀 Bullseye – URL Safety Scanner

**Bullseye** is a futuristic, professional-grade web application designed to scan URLs for security threats like phishing and malware. It leverages real-time APIs, an intelligent crawler, and modern UI design to deliver fast, reliable results in a sleek, mobile-responsive interface.

---

## 🛠️ Tech Stack

### 💻 Frontend
- **Framework:** React + Vite  
- **Styling:** Tailwind CSS 3  
- **Theme:** Light/Dark mode with smooth transitions  
- **Icons:** FontAwesome  
- **Routing:** React Router  

### 🔧 Backend
- **Language:** Python (FastAPI or Flask)  
- **Database:** MongoDB (Collections: `safesurf`, `screenshots`)  
- **Screenshot Storage:** Cloudinary  
- **APIs Used:**  
  - VirusTotal API (URL threat analysis)  
  - Custom Crawler (Screenshot & metadata extraction)  

### ☁️ Hosting
- **Deployment:** Render (Frontend + Backend)  
- **Database:** MongoDB Atlas  
- **Media:** Cloudinary (Screenshots stored by domain)  

---

## 📋 Key Features
- 🔍 **Scan URLs** using VirusTotal API  
- 🌐 **Real-time screenshots** with a custom crawler  
- 🖼️ **Fullscreen screenshot** view  
- 🧮 **Dual-pane result layout** (VirusTotal + Crawler)  
- 🌗 **Dark/Light mode** with smooth UI transitions  
- ✅ **Status badges**: Safe / ⚠️ Malicious  
- 📱 **Fully responsive** and mobile-ready design  
- 🔄 **Status-based filtering** (All, Safe, Malicious)  
- 🕓 **Recent scans** – shows latest 10  
- 📂 **Scan History Page** with extended logs  
- 📸 **QR Code popup** for quick mobile access  

---

## 🧱 Folder Structure (Frontend)
```plaintext
src/
├── components/  # Shared UI components (Navbar, Footer, Cards, etc.)
├── pages/       # Route-based pages (Home, Scan, History, etc.)
├── assets/      # Static files (logos, icons)
├── context/     # Theme and global state providers
├── utils/       # Helper functions
├── App.jsx
└── main.jsx
```

---

## 🗃️ MongoDB Collections

### 📂 `safesurf`
Stores metadata of scanned URLs:
```json
{
  "url": "https://example.com",
  "status": "Safe",
  "scanDate": "2025-05-15T10:00:00Z",
  "virustotalData": { ... },
  "crawlerData": { ... }
}
```

### 📂 `screenshots`
Stores screenshot URLs hosted on Cloudinary:
```json
{
  "url": "https://example.com",
  "websiteName": "example",
  "screenshotUrl": "https://res.cloudinary.com/your-cloud-name/image/upload/example.png"
}
```

---

## ⚙️ Workflow

1. **User submits a URL**  
2. **Frontend**  
   - Shows loading indicator  
   - Sends URL to backend  
3. **Backend**  
   - Queries VirusTotal API  
   - Launches crawler to visit and capture screenshot  
   - Uploads screenshot to Cloudinary  
   - Saves results to MongoDB  
4. **Frontend**  
   - Displays side-by-side results  
   - Supports fullscreen screenshot view  
   - Allows filtering by threat status  

---

## 🌐 Live Site
🔗  [Bullseye URL Safety Scanner](https://bullseye-n9jz.onrender.com)

---

## 🧩 Component Overview
- **Navbar** – Site-wide navigation + theme toggle  
- **URL Scanner** – Input field + scan button  
- **Scan Results** – Dual-panel view  
- **Screenshot Viewer** – With fullscreen option  
- **Recent Scans** – Displays last 10 URLs  
- **See More Page** – Historical logs + filters  
- **QR Button** – Opens mobile QR access  
- **Footer** – Clean, theme-matching design  

---

## 🎨 Design Highlights
- Spacious, VirusTotal-style layout  
- Smooth transitions between themes  
- Status highlighting with professional iconography  
- Consistent UI in both dark/light modes  
- No emoji clutter — only essential symbols used  
- FontAwesome icons for clean visual communication  

---

## 🔮 Future Enhancements
- User login & personal scan dashboard  
- PDF / Email scan reports  
- Graphical scan summaries  
- Internationalization (i18n) support  
- Caching + performance optimization  

---

## 👨‍💻 Author

Developed as a **final year BCA project**, Bullseye merges cybersecurity, intelligent crawling, and modern web design into a single powerful tool with real-world deployment and professional UI/UX standards.


---

## 💼 My Portfolio

A curated showcase of my work, skills, and journey as a developer.  
Explore the projects, and impact behind my craft.

🔗 [Visit My Portfolio](https://krithikus.onrender.com/)

---

