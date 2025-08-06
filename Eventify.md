📘 EventiFy – Product Requirement Document (Prompt Style)
1. 🧭 Product Vision
Prompt:
"You're building a modern, minimalist event management platform called EventiFy. It should allow users to create, browse, RSVP to, and manage events. Focus on clean UI, fast UX, and Gen-Z vibes."

Context:
The platform targets college communities, indie creators, and small businesses needing a lightweight, intuitive way to run in-person or online events.

2. 👤 User Personas
Prompt:
"Include three types of users: Event Organizer, Attendee, and Admin. Each should have a distinct role and access level."

Context:

Organizer: Can create/manage their events, view RSVPs

Attendee: Can browse, RSVP, and save events

Admin: Oversees platform moderation, user management

3. 🏗️ Core Features (CRUD)
Prompt:
"Define models for Event, User, RSVP. Each model should support full CRUD operations and proper relationships."

Context:

Event: title, description, date/time, location, tags

User: name, email, password (JWT auth)

RSVP: link between user & event with status (going/interested/cancelled)

4. 📆 Event Listing & Discovery
Prompt:
"Design a clean, filterable Event List page with tags, search, and upcoming/past filters."

Context:
Attendees should easily find upcoming events by category (tech, art, music, etc.) and RSVP quickly.

5. 🧾 Event Creation Form
Prompt:
"Create an intuitive form for organizers to create/edit events. Include fields for title, description, date, time, location, cover image, tags."

Context:
A frictionless event creation flow is critical. Add simple validation and autosave if possible.

6. 🔐 User Authentication & Authorization
Prompt:
"Implement JWT-based auth with role-based access control for attendee, organizer, and admin."

Context:
Only authenticated users can RSVP or create events. Admin can manage reports or delete abusive content.

7. 📩 RSVP System
Prompt:
"Users should be able to RSVP to events. Status can be 'Going', 'Interested', or 'Not Going'. Allow organizers to view RSVP lists."

Context:
This is the heart of the app. RSVP data should be visible in organizer dashboards, with count stats and optional CSV export.

8. 📸 QR Code Check-In
Prompt:
"On RSVP confirmation, generate a unique QR code for the user. Allow event organizers to scan and mark check-ins."

Context:
This enables real-world use of the app. Use a library like qrcode in Python, and integrate QR scanning via webcam (JS) for organizers.

9. 📱 Responsive Frontend UI
Prompt:
"Use React + TailwindCSS to build a modern, mobile-friendly UI with a dashboard aesthetic. Prioritize accessibility."

Context:
Tailwind for fast styling. Consider using Headless UI for modals, dropdowns, and more. Must be beautiful on both phone and laptop.

10. 🗂️ Admin Dashboard
Prompt:
"Create a minimal admin interface to view all users, events, and flag/delete inappropriate content."

Context:
Admins ensure the community stays clean. Add pagination and sorting for large datasets.

11. 🌐 Event Details Page
Prompt:
"Each event should have a dedicated page showing full info, RSVP button, map location, and related events."

Context:
Single event pages are SEO-friendly and provide attendees a focused view. Add an 'Add to Google Calendar' button too.

12. 💬 Comments or Feedback
Prompt:
"Allow logged-in users to leave a comment or feedback on events. Let organizers moderate or reply."

Context:
Foster community. Basic text-based comments with date & username, optional likes/upvotes.

13. 📊 Analytics for Organizers
Prompt:
"Provide event stats to organizers: number of RSVPs, check-ins, and demographics if available."

Context:
Use Chart.js or Recharts to show simple bar/pie graphs. Help organizers understand their audience better.

14. 📥 Email Reminders (Optional Phase 2)
Prompt:
"Set up scheduled email reminders before events to RSVP’d users. Send confirmation upon RSVP."

Context:
Use SendGrid or SMTP with a job scheduler like Celery (Python) or CRON.

15. ☁️ Deployment
Prompt:
"Deploy frontend on Vercel and backend on Render or Railway. Use PostgreSQL and store secrets in env files."

Context:
Separate dev and prod environments. Include README with setup instructions, and ideally, a Docker config.