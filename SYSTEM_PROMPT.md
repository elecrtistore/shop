# ALEXTRONICS — System Architecture

## Overview

ALEXTRONICS (formerly ElectriShop) is an inquiry-first electronics marketplace. Buyers browse products, add them to an inquiry cart, and submit a single request to the seller. The seller responds with pricing and availability directly. No payments are processed on-platform.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Routing | React Router v6 (basename: `/Alextronics`) |
| Auth | Firebase Auth (email/password) + Firebase Admin SDK |
| Icons | lucide-react |
| Backend | Node.js, Express, TypeScript |
| Database | MongoDB Atlas via Mongoose |
| Email | Nodemailer (Gmail SMTP with App Password) |
| Real-time | Socket.io (minimal — connection logging only) |
| Frontend host | GitHub Pages (deployed via GitHub Actions) |
| Backend host | Render |

## Project Structure

```
├── frontend/                  # React SPA
│   ├── src/
│   │   ├── components/        # Reusable UI (Layout, CookieConsent, DiscountModal, etc.)
│   │   ├── contexts/          # React contexts (AuthContext, InquiryContext)
│   │   ├── pages/             # Route pages (HomePage, ShopPage, ProductDetailsPage, etc.)
│   │   ├── services/          # API layer (api.ts, authService.ts, productService.ts)
│   │   ├── types/             # TypeScript interfaces (Product, User, etc.)
│   │   ├── firebase.ts        # Firebase client init
│   │   ├── App.tsx            # Route definitions
│   │   └── main.tsx           # Entry point (BrowserRouter)
│   ├── vite.config.ts         # base: /Alextronics/
│   └── index.html             # Favicon at /Alextronics/logo.png
├── backend/
│   ├── src/
│   │   ├── config/database.ts # Mongoose connection
│   │   ├── controllers/       # Route handlers (product, category, inquiry, auth, email, dashboard, site)
│   │   ├── middleware/        # adminGuard, validateFirebaseToken, errorHandler
│   │   ├── models/            # Mongoose schemas (Product, Category, Inquiry, Admin, Subscriber, SiteContent)
│   │   ├── routes/            # Express routers
│   │   └── index.ts           # Express app entry
│   ├── .env                   # Environment variables
│   └── scripts/               # One-off migration scripts
└── .github/workflows/         # GitHub Actions deploy config
```

## Routes

### Frontend Routes (React Router)

| Path | Page | Access |
|------|------|--------|
| `/` | HomePage | Public |
| `/shop` | ShopPage | Public |
| `/products/:id` | ProductDetailsPage | Public |
| `/inquiry-list` | InquiryListPage | Public (hidden from Admin) |
| `/inquiry` | InquiryFormPage | Public |
| `/success` | InquirySuccessPage | Public |
| `/login` | LoginPage | Public |
| `/signup` | SignupPage | Public |
| `/about` | AboutPage | Public |
| `/contacts` | ContactPage | Public |
| `/privacy` | PrivacyPage | Public |
| `/terms` | TermsPage | Public |
| `/my-inquiries` | MyInquiriesPage | Auth required (Buyer/Seller/Admin) |
| `/admin` | AdminDashboardPage | Admin only |

### Backend API Routes

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/health` | GET | None | Health check |
| `/api/products` | GET/POST | None/Admin | List/Create products |
| `/api/products/:id` | GET/PUT/DELETE | None/Admin/Admin | Single product CRUD |
| `/api/categories` | GET/POST | None/Admin | List/Create categories |
| `/api/categories/:id` | PUT/DELETE | Admin/Admin | Update/Delete category |
| `/api/inquiries` | GET/POST | Admin/None | List inquiries / Submit inquiry |
| `/api/inquiries/:id` | GET/PUT | Admin/Admin | View/Update inquiry status |
| `/api/auth/signup` | POST | None | Create Admin account |
| `/api/auth/profile` | GET/PUT | Firebase token | Get/Update profile |
| `/api/dashboard/stats` | GET | Admin | Dashboard stats |
| `/api/site/:page` | GET/PUT | None/Admin | Get/Update site content |
| `/api/email/subscribe` | POST | None | Subscribe to newsletter |
| `/api/email/subscribers` | GET | Admin | List subscribers |
| `/api/email/subscribers/:id` | DELETE | Admin | Remove subscriber |
| `/api/email/send` | POST | Admin | Send email campaign |

## Authentication Flow

1. User signs up/logs in via Firebase Auth on the frontend
2. Firebase returns an ID token
3. Axios interceptor attaches token as `Authorization: Bearer <token>` to every request
4. Backend `validateFirebaseToken` middleware verifies token via Firebase Admin SDK
5. `adminGuard` checks Admin collection record OR `ADMIN_EMAILS` env var
6. Role is stored in `localStorage` under `electrishop-role`
7. Admin signup requires a secret code (`ADMIN_SECRET_CODE` env var)

## Data Models

### Product
```
name, description, images[], brand, category, price, discount, stock,
sellerName, sellerPhone, sellerWhatsapp, featured, specifications (Map)
```

### Inquiry
```
customer: { name, phone, county, town, estate, landmark, notes }
items: [{ productId (ref), name, quantity, price }]
estimatedTotal, status (New|Contacted|Negotiating|Reserved|Sold|Cancelled)
```

### Category
```
name (unique), icon, image
```

### Admin
```
firebaseUID (unique), email (unique), role
```

### Subscriber
```
email (unique, lowercase), name, active
```

### SiteContent
```
page (unique: hero, footer, contact, settings, about, etc.),
title, subtitle, body, sections[{heading, content}], meta (Map)
```

## Key Features

### Inquiry Cart
- Products added to cart (stored in localStorage under `electrishop-inquiry`)
- Cart persists across sessions
- Submitted as a single inquiry with customer details
- Each inquiry item stores productId, name, quantity, and price at time of inquiry

### Admin Dashboard
- Product management (add/edit/delete, drag-to-reorder, inline price edit, discount modal)
- Inquiry management (view all, update status, Sold button)
- Email campaigns (select template, write custom content, pick products, send to subscribers)
- Subscriber management (view/delete)
- Site content editor (CRUD pages with sections and meta)

### Email System
- Templates: new-arrival, discount, product-spotlight, custom
- HTML emails with navy (#1E3A5F) brand styling
- Sends via Gmail SMTP (App Password required)
- Unsubscribe note in footer

### Categories (Homepage)
- Derived from unique `product.category` values across all products
- Displayed as pill-shaped text links
- No mock data or emoji icons

### Cookie/Local Storage Consent
- Banner appears on first visit
- Choice stored in `localStorage` under `electrishop-cookie-consent`
- Links to Privacy Policy

## Deployment

### Frontend (GitHub Pages)
- Trigger: Push to main with changes under `frontend/**` or `.github/workflows/deploy-frontend.yml`
- Build command: `npm run build` (tsc + vite build)
- Published to `https://elecrtistore.github.io/Alextronics/`
- Vite base: `/Alextronics/`
- React Router basename: `/Alextronics`

### Backend (Render)
- Start command: `npm start` (runs `node dist/index.js`)
- Build command: `npm run build` (tsc)
- Environment variables must be set in Render dashboard:
  - `MONGODB_URI`, `FIREBASE_*`, `ADMIN_EMAILS`, `ADMIN_SECRET_CODE`, `SMTP_*`, `FRONTEND_URL`

## Environment Variables

### Backend (.env)
```
PORT=5000
MONGODB_URI=mongodb+srv://<user>:<pass>@cluster0.mongodb.net/Alextronics
FIREBASE_PROJECT_ID=electrishop-80dd6
FIREBASE_CLIENT_EMAIL=<firebase-service-account-email>
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
JWT_SECRET=your_jwt_secret_here
ADMIN_EMAILS=alextronics.shop01@gmail.com
API_URL=http://localhost:5000/api
ADMIN_SECRET_CODE=123456789
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alextronics.shop01@gmail.com
SMTP_PASS=<gmail-app-password>
EMAIL_FROM=alextronics.shop01@gmail.com
FRONTEND_URL=https://elecrtistore.github.io/Alextronics
```

### Frontend (.env)
```
VITE_API_URL=https://alextronics.onrender.com/api
```

## Firebase Admin SDK Setup

The backend initializes firebase-admin by trying (in order):
1. `FIREBASE_SERVICE_ACCOUNT_PATH` env var pointing to a JSON file
2. Common file paths: `firebase-service-account.json`, `serviceAccountKey.json`
3. `FIREBASE_PRIVATE_KEY` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PROJECT_ID` env vars

In v14+, `cert` is imported directly from `firebase-admin` (not `firebase-admin/credential`).

## Legal Pages

- `/privacy` — Covers localStorage usage, Firebase Auth, email subscriptions, third-party data sharing, user rights
- `/terms` — Covers account rules, inquiry process (not a binding sale), user conduct, liability limits
- Cookie consent banner — Accept/Reject, persists choice in localStorage
- Links to both in footer
