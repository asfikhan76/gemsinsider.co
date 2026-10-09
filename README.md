# GEMS INSIDER

An online gemstone store built with React (Vite) and Node.js/Express + MongoDB. Browse a curated collection of natural gemstones with high-quality video previews, place orders, and manage everything through a secure admin-ready backend.

**Live site:** [gemsinsider.co](https://gemsinsider.co)

## Features

- **Gemstone Catalog** — Browse natural gemstones (Spinel, Sphene, Tourmaline, Kunzite, Topaz, Tanzanite, Rubellite, Aquamarine, and more) with lazy-loaded video previews
- **Search & Filter** — Filter by category and color, plus global search across the collection
- **Shopping Cart** — Add gems to cart (persisted in localStorage), buy now, or reserve items
- **User Authentication** — Register, login, logout, and profile management with JWT
- **Orders** — Place orders and view order history (authenticated users)
- **Contact Form** — Inquiries sent directly to the backend
- **Admin System** — Admin accounts auto-created from environment variables; order management (view, update status, delete)
- **Policy Pages** — Privacy policy, refund policy, terms of service, and FAQs built in
- **Dark/Light Theme** — Theme toggle persisted in localStorage
- **Responsive Design** — Works across desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 7 |
| Backend | Node.js, Express 4 |
| Database | MongoDB (Mongoose 8) |
| Auth | JSON Web Tokens, bcryptjs |
| Other | CORS, dotenv |

## Project Structure

```
gemstones/
├── public/                 # Static assets (logos, icons, gem videos)
├── src/                    # React frontend
│   ├── App.jsx             # Main app (all pages/components)
│   ├── App.css             # Styles
│   ├── api.js              # API client
│   ├── data/products.json  # Product catalog data
│   └── assets/             # Images and videos
├── server/                 # Express backend
│   └── src/
│       ├── index.js        # Server entry point
│       ├── config/db.js    # MongoDB connection
│       ├── middleware/auth.js
│       ├── models/         # User, Order, Contact
│       └── routes/         # auth, orders, contact
├── scripts/                # Utility scripts
├── .env.example            # Environment variable template
└── package.json            # Workspaces root (client + server)
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance (local or MongoDB Atlas)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/asfikhan76/Gemstones.git
cd Gemstones
```

2. Install dependencies (root and server via workspaces):

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Then create `server/.env`:

```
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/gems-insider
JWT_SECRET=your-strong-secret-key
ADMIN_PASSWORD=your-strong-admin-password
ADMIN_EMAILS=you@example.com,admin@example.com
CLIENT_URL=http://localhost:5173,https://gemsinsider.co
```

Also set in root `.env`:

```
VITE_API_URL=http://localhost:5000
```

> **Note:** `ADMIN_PASSWORD` is required — the server will not start without it. Accounts listed in `ADMIN_EMAILS` are auto-created as admin users on first boot using that password.

### Development

Run client and server together:

```bash
npm run dev
```

Or run them separately:

```bash
npm run dev:client   # Vite dev server on http://localhost:5173
npm run dev:server   # Express API on http://localhost:5000
```

### Production

Build the frontend and start the server:

```bash
npm run build
npm start
```

The server serves the built frontend from `dist/` automatically. If `dist/index.html` is missing, it attempts to build it on startup.

## API Endpoints

### Auth — `/api/auth`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/register` | — | Register a new user |
| POST | `/login` | — | Login, returns JWT |
| GET | `/me` | ✓ | Get current user |
| POST | `/logout` | — | Logout |
| PUT | `/profile` | ✓ | Update profile |

### Orders — `/api/orders`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/` | ✓ | Get user orders |
| POST | `/` | ✓ | Create an order |
| PUT | `/:id` | ✓ | Update order (admin) |
| DELETE | `/:id` | ✓ | Delete order |

### Contact — `/api/contact`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/` | — | Submit contact form |

### Other

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/auth/create-admin` | Create admin (dev only) |

## Admin Setup

Admin accounts are created automatically on server startup for every email listed in `ADMIN_EMAILS`, using the `ADMIN_PASSWORD` value. Login with one of those emails and the shared admin password.

In development, you can also create admins manually:

```bash
POST /api/auth/create-admin
Content-Type: application/json

{
  "name": "Admin",
  "email": "admin@example.com",
  "password": "securepassword"
}
```

## License

All rights reserved. Content, photos, and branding are property of GEMS INSIDER.
