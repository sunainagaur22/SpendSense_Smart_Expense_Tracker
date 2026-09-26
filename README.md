# 💳 SpendSense — Smart Notification-Based Expense Tracker
### Hackathon-Ready Project | HTML + CSS + JavaScript

---

## 🚀 How to Run

### Option 1: VS Code Live Server (Recommended)
1. Open the `smart-expense-tracker/` folder in VS Code
2. Install the **"Live Server"** extension (Ritwick Dey)
3. Right-click `index.html` → **"Open with Live Server"**
4. App opens at `http://127.0.0.1:5500`

### Option 2: Python HTTP Server
```bash
cd smart-expense-tracker
python -m http.server 8080
# Open: http://localhost:8080
```

### Option 3: Node.js
```bash
cd smart-expense-tracker
npx serve .
# Open: http://localhost:3000
```

> ⚠️ **Do NOT open `index.html` directly as `file://`** — the mock JSON fetch will fail.  
> The app has a built-in fallback, but Live Server is strongly recommended.

---

## 📁 File Structure
```
smart-expense-tracker/
├── index.html                  # Main HTML — all pages/sections
├── style.css                   # Complete stylesheet (dark/light themes)
├── script.js                   # All JavaScript logic (22 sections)
├── data/
│   └── mockNotifications.json  # 20 sample bank SMS messages
├── assets/                     # (placeholder for images/icons)
└── README.md                   # This file
```

---

## 🎯 Features Overview

| Feature | Status |
|---|---|
| 📩 SMS Parser (regex-based) | ✅ |
| 🏷️ Auto Categorization | ✅ |
| 💰 Dashboard with Stats | ✅ |
| 📊 Line, Pie, Bar, Doughnut Charts | ✅ |
| ➕ Manual Expense Entry | ✅ |
| ✏️ Edit / Delete Transactions | ✅ |
| 🔔 Budget Alerts (80% / 100%) | ✅ |
| 🔍 Search & Multi-Filter | ✅ |
| 📈 Insights & Smart Suggestions | ✅ |
| 🔐 Auth (LocalStorage) | ✅ |
| 🌙 Dark / Light Mode | ✅ |
| 📤 CSV Export | ✅ |
| 🎤 Voice Input | ✅ |
| 📱 Responsive (Mobile) | ✅ |

---

## 🔐 Authentication
- Sign up with any email + password (min 6 chars)
- Stored in **localStorage** (no backend required)
- Demo: just register once and you're in

---

## 📩 SMS Parser — Supported Formats
The parser handles all major Indian bank formats:

```
INR 250.00 spent on Zomato. SBI Card XX4521. Avl Bal: INR 45,230.00
Rs. 1,200 debited from HDFC A/c XX8821 via UPI to Amazon.
Paid Rs. 80 to Uber via UPI. Balance: Rs. 18,450.00
INR 50,000 credited to ICICI A/c. Narration: SALARY APRIL 2025
Rs. 499 deducted for Netflix subscription renewal.
INR 1,800 debited for ELECTRICITY BILL via Paytm.
```

---

## 🏷️ Auto-Categorization Rules

| Category | Keywords |
|---|---|
| 🍔 Food | Swiggy, Zomato, BigBasket, Starbucks, Blinkit... |
| 🚗 Travel | Uber, Ola, Rapido, IRCTC, MakeMyTrip, Petrol... |
| 🛍️ Shopping | Amazon, Flipkart, Myntra, Ajio, Nykaa... |
| 💡 Bills | Electricity, Netflix, Spotify, Jio, Airtel, Rent... |
| 🏥 Health | Apollo, MedPlus, Pharmacy, Hospital... |
| 🎬 Entertainment | PVR, BookMyShow, Gaming, Movie... |
| 📦 Other | Everything else |

---

## 🎨 Design System
- **Dark theme** (default) + Light theme toggle
- **Font**: Syne (headings) + Figtree (body) + DM Mono (numbers/code)
- **Charts**: Chart.js 4.4.0 (CDN)
- **Fully responsive** — works on mobile, tablet, desktop

---

## 🚀 Hackathon Pitch Points
1. **Saves time** — no manual entry needed; just paste your bank SMS
2. **Zero setup** — pure HTML/CSS/JS, no build tools required
3. **Smart insights** — week-over-week spending comparisons
4. **Scalable** — can integrate real banking APIs (Plaid, Setu, RazorpayX)
5. **Privacy-first** — all data stored locally, never leaves your device

---

## 🔮 Future Roadmap
- Firebase real-time sync
- Bank API integration (Setu AA, Open Banking)
- Android SMS broadcast listener
- WhatsApp bot integration
- ML-based spending prediction
- Multi-currency support

---

*Built for hackathon demo. All data stored in localStorage.*
