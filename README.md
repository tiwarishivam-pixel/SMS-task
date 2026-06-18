# Event Ticket Booking Assignment

This project implements a simplified ticket booking flow with seat reservation and booking confirmation using:
- Backend: Node.js, Express, MongoDB (Mongoose)
- Frontend: React (Vite)

## Features Implemented

### Backend
- `GET /api/events` - list all events with seat stats
- `GET /api/events/:id` - event details with full seat grid
- `POST /api/reserve` - reserve seats for 10 minutes
- `POST /api/bookings` - confirm booking from active reservation
- Basic auth:
  - `POST /api/auth/register`
  - `POST /api/auth/login`
- Atomic seat updates with MongoDB transactions to prevent double booking
- Expired reservations are released before reserve/booking operations

## Frontend Stack (shadcn + Tailwind)

The frontend uses:
- **TypeScript** + **Vite**
- **Tailwind CSS v4** (`@tailwindcss/vite`)
- **shadcn-style structure** with components in `src/components/ui/`
- Path alias `@/` → `src/`

### shadcn / UI setup (already configured)

```bash
cd frontend
npm install
```

Key paths:
- `src/components/ui/` — shadcn UI primitives (`button`, `card`, `background-paths`)
- `src/lib/utils.ts` — `cn()` helper
- `src/index.css` — Tailwind + theme CSS variables
- `components.json` — shadcn config

To add more shadcn components later:

```bash
npx shadcn@latest init   # if setting up fresh elsewhere
npx shadcn@latest add button
```

> **Why `/components/ui`?** shadcn expects reusable primitives in this folder so imports like `@/components/ui/button` stay consistent across the app and match community docs.

### User routes

| Route | Description |
|-------|-------------|
| `/` | Landing page with animated `BackgroundPaths` hero |
| `/login` | Auth (session persists 7 days) |
| `/events` | Events dashboard |
| `/events/:id` | Seat map with occupant names |
| `/bookings` | Your own bookings only |
| `/profiles` | Smart profile search + bio viewer |

## Admin Access

After running `npm run seed`, an admin account is created:

| Field | Value |
|-------|-------|
| Email | `admin@ticketbooking.com` |
| Password | `admin123` |

Override via `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `backend/.env`.

Login at `http://localhost:5173/auth` — admins are redirected to `/admin`.

### Admin capabilities
- **Dashboard** — overview stats (events, bookings, reservations, users, seats)
- **Events** — create, edit, delete events (auto-generates seat grid)
- **Bookings** — view all bookings, cancel and release seats
- **Reservations** — view all reservations, cancel and release seats
- **Users** — view users, promote/demote admin role, delete users

### Admin API routes (all require `Authorization: Bearer <admin-token>`)
- `GET /api/admin/dashboard`
- `GET|POST /api/admin/events`, `PUT|DELETE /api/admin/events/:id`
- `GET|DELETE /api/admin/bookings/:id`
- `GET|DELETE /api/admin/reservations/:id`
- `GET /api/admin/users`, `PATCH|DELETE /api/admin/users/:id`
- `GET /api/admin/events/:id/seats`, `PATCH /api/admin/seats/:id`

## Folder Structure

- `backend` - MEN backend
- `frontend` - React Vite frontend

## Backend Setup

1. Open terminal in `backend`
2. Install dependencies:
   - `npm install`
3. Copy env file:
   - Create `.env` from `.env.example`
4. Ensure MongoDB is running (local or remote URI)
5. Seed sample data:
   - `npm run seed`
6. Start backend:
   - Dev: `npm run dev`
   - Prod: `npm start`

Backend default URL: `http://localhost:5000`

## Frontend Setup

1. Open terminal in `frontend`
2. Install dependencies:
   - `npm install`
3. Copy env file:
   - Create `.env` from `.env.example`
4. Run app:
   - `npm run dev`

Frontend default URL: `http://localhost:5173`

## Assumptions

- A reservation belongs to one logged-in user and can only be booked by that same user.
- Booking is only allowed with a valid, non-expired reservation.
- Seats are pre-generated per event using the seed script.

## Security Notes

- Protected API routes require JWT (`/api/events`, `/api/reserve`, `/api/bookings`, `/api/users/search`)
- Full booking history is **admin-only**; regular users only see seat-level occupant names on event pages
- Profile search returns limited fields (name, email, role) — no passwords
- Register always creates `user` role; admin cannot be self-assigned
- Last admin cannot be deleted or demoted
- 401 responses clear session and redirect to login

## Design Decisions

- **Double booking prevention:** seat reservation and booking are wrapped in MongoDB transactions with guarded `updateMany` filters on current status.
- **Reservation expiry handling:** before reserve/booking, expired reservations are released by resetting reserved seats to `available` and deleting stale reservations.
- **Privacy model:** occupant names are exposed only at the seat level on event detail pages; there is no public bookings list for regular users.
- **Session persistence:** JWT stored in localStorage with 7-day expiry (`JWT_EXPIRES_IN` in backend `.env`).

**landing Page -> Events Page -> Reservation & Booking Page**
<img width="949" height="436" alt="Screenshot 2026-06-18 140901" src="https://github.com/user-attachments/assets/24fddf85-38ef-40a1-8921-8c76f3f5155b" />
<img width="949" height="434" alt="Screenshot 2026-06-18 140929" src="https://github.com/user-attachments/assets/87ea2421-97c3-4a68-88f8-a90a46e0a3f6" />
<img width="945" height="428" alt="Screenshot 2026-06-18 141010" src="https://github.com/user-attachments/assets/466c1862-58c4-4729-a7e8-b3756a930934" />


