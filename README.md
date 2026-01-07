# 🎭 EventiFy – Modern Event Management Platform

> A sleek, full-stack event management system for creating, discovering, and RSVP-ing to events — built for communities, creators, and small businesses.  
Built with **React + TailwindCSS + FastAPI**.

![EventiFy Banner](./docs/banner.png) <!-- Replace with your banner image -->

---

## ✨ Overview
EventiFy is a lightweight, mobile-friendly event platform designed for simplicity and speed.  
Organizers can create events, attendees can RSVP, and everyone gets a QR code for quick check-ins.

---

## 🚀 Tech Stack
**Frontend**
- React (Vite)
- TailwindCSS
- Axios (API calls)
- Headless UI (modals, dropdowns)

**Backend**
- FastAPI (Python)
- PostgreSQL / SQLite
- SQLAlchemy ORM
- JWT Auth

**Extras**
- QR Code Generator (`qrcode` Python lib)
- Google Maps / Leaflet integration
- Chart.js (analytics)

---

## 📦 Features
- 👤 **User Roles** – Attendee, Organizer, Admin
- 📝 **Event CRUD** – Create, read, update, delete events
- 📅 **Event Discovery** – Filter by category, search by name/date
- 📩 **RSVP System** – Going, Interested, Not Going
- 📷 **QR Check-In** – Unique QR for each RSVP
- 🗂️ **Admin Dashboard** – Manage users & events
- 📊 **Organizer Analytics** – RSVP count, check-ins, charts
- 📱 **Responsive UI** – Beautiful on mobile & desktop

---

## 🛠️ Setup & Installation

### 1️⃣ Clone the repo
```bash
git clone https://github.com/your-username/eventify.git
cd eventify
..
