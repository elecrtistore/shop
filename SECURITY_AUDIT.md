# ALEXTRONICS — Full Security & Architecture Audit

## 1. Network Architecture & Data Flow

```
User Browser
    │
    ├── HTTPS ──► GitHub Pages (CDN, static hosting)
    │                └── Serves React SPA (index.html + JS bundles)
    │
    ├── HTTPS ──► Firebase Authentication (Google)
    │                └── Returns ID token (JWT)
    │
    └── HTTPS ──► Render (Node.js Express backend)
                     │
                     ├── validateFirebaseToken middleware
                     │    └── Decodes JWT via Firebase Admin SDK
                     │
                     ├── adminGuard middleware
                     │    └── Checks MongoDB Admin collection OR ADMIN_EMAILS env var
                     │
                     ├── MongoDB Atlas (cloud database)
                     │    ├── Alextronics database
                     │    │    ├── products
                     │    │    ├── inquiries
                     │    │    ├── categories
                     │    │    ├── subscribers
                     │    │    ├── sitecontents
                     │    │    └── admins
                     │    └── test database (legacy, unused after migration)
                     │
                     └── Gmail SMTP (email sending via Nodemailer)
                          └── Sends to subscriber email addresses
```

## 2. Full API Route Map — Auth, Data, Vulnerabilities

### 2.1 Public Routes (No Authentication)

| Route | Method | Data Sent | Data Returned | Risk Level |
|-------|--------|-----------|---------------|------------|
| `/api/health` | GET | Nothing | `{ status: "ok" }` | None |
| `/api/products` | GET | Nothing | All products (name, brand, price, discount, stock, images, sellerPhone, sellerWhatsapp, sellerName, category, description, specifications) | **MEDIUM** — Seller phone/Whatsapp exposed publicly |
| `/api/products/:id` | GET | Product ID | Full product object (same as above) | **MEDIUM** |
| `/api/categories` | GET | Nothing | All categories (name, icon, image) | Low |
| `/api/site/:page` | GET | Page name (hero, footer, contact, settings, about) | Site content (title, subtitle, body, sections, meta) | Low |
| `/api/inquiries` | POST | Customer name, phone, county, town, estate, landmark, notes, items (productId, name, quantity, price), estimatedTotal | Created inquiry object | **MEDIUM** — No rate limiting, no recaptcha |
| `/api/auth/signup` | POST | firebaseUID, email, secretCode | Admin record created | **HIGH** — Secret code is static (`123456789` in .env) |
| `/api/email/subscribe` | POST | Email, optional name | Subscriber confirmation | **MEDIUM** — No email verification, anyone can subscribe any email |

### 2.2 Firebase Token Required Routes

| Route | Method | Data Sent | Risk Level |
|-------|--------|-----------|------------|
| `/api/auth/profile` | GET | Firebase token | Low — Returns own profile |
| `/api/auth/profile` | PUT | displayName | Low |
| `/api/inquiries` | GET | Firebase token | **MEDIUM** — Currently returns ALL inquiries regardless of user |

### 2.3 Admin Routes (Firebase Token + adminGuard)

| Route | Method | Data Sent | Risk Level |
|-------|--------|-----------|------------|
| `/api/products` | POST | Full product object | **MEDIUM** — No input sanitization |
| `/api/products/:id` | PUT | Partial product fields | **MEDIUM** |
| `/api/products/:id` | DELETE | Product ID | Low |
| `/api/categories` | POST | Category object | Low |
| `/api/categories/:id` | PUT | Updated category | Low |
| `/api/categories/:id` | DELETE | Category ID | Low |
| `/api/inquiries/:id` | GET | Inquiry ID | **MEDIUM** — Returns full customer PII |
| `/api/inquiries/:id` | PUT | Status, items | **CRITICAL** — No ownership check |
| `/api/dashboard/stats` | GET | Nothing | **HIGH** — Returns revenue metrics, order counts |
| `/api/site/:page` | PUT | Site content | **MEDIUM** — No validation on HTML content |
| `/api/email/subscribers` | GET | Nothing | **MEDIUM** — Returns all subscriber emails |
| `/api/email/subscribers/:id` | DELETE | Subscriber ID | Low |
| `/api/email/send` | POST | template, subject, body, productIds, subscriberIds | **HIGH** — Can send arbitrary emails to all subscribers |

## 3. Data Storage & PII Inventory

| Data | Where Stored | PII? | Sensitivity |
|------|-------------|------|-------------|
| User email | Firebase Auth, MongoDB (Admin collection) | Yes | **High** |
| User display name | Firebase Auth | Yes | Low |
| Firebase UID | MongoDB (Admin collection) | Yes (identifier) | **Medium** |
| Customer name | MongoDB (Inquiry collection) | Yes | **Medium** |
| Customer phone | MongoDB (Inquiry collection) | Yes | **High** |
| Customer county, town, estate, landmark | MongoDB (Inquiry collection) | Yes | **Medium** |
| Customer notes | MongoDB (Inquiry collection) | Potentially | **Medium** |
| Seller phone | MongoDB (Product collection) | Yes | **High** |
| Seller whatsapp | MongoDB (Product collection) | Yes | **High** |
| Seller name | MongoDB (Product collection) | Yes | Medium |
| Subscriber email | MongoDB (Subscriber collection) | Yes | **High** |
| User role | localStorage (browser) | No | Low |

## 4. Identified Vulnerabilities & Issues

### 4.1 Critical

1. **Inquiry IDOR (Insecure Direct Object Reference)**
   - `GET /api/inquiries` returns ALL inquiries (no user filter)
   - `GET /api/inquiries/:id` allows any admin to view any inquiry
   - `PUT /api/inquiries/:id` allows status changes to any inquiry
   - No ownership/association between inquiry and user

2. **Static Admin Secret Code**
   - `ADMIN_SECRET_CODE=123456789` is trivial and hardcoded
   - Anyone who knows/phishes this can create an admin account
   - No rate limiting on signup attempts

3. **No Input Sanitization**
   - Product create/update accepts arbitrary fields
   - Site content accepts arbitrary HTML (stored XSS risk in admin dashboard rendering)
   - Inquiry submission validates nothing server-side

4. **CORS Misconfiguration**
   - Socket.io uses `cors: { origin: '*' }` (allow all)
   - Express CORS allows specific origins, but Socket.io does not

### 4.2 High

5. **Email Subscription — No Verification**
   - Anyone can subscribe any email address
   - No double opt-in or confirmation
   - Potential for abuse (someone could subscribe a victim's email to spam them)

6. **Admin Access via Env Var**
   - `ADMIN_EMAILS` env var grants admin to anyone with that Firebase email
   - If env var leaks, attacker can create Firebase account with same email and gain admin

7. **PII Exposed via Product API**
   - Seller phone and WhatsApp numbers are returned to every visitor in product listings
   - No access control on who can view seller contact info

8. **MongoDB URI in .env / Render Dashboard**
   - Full connection string with credentials in plaintext
   - If either environment leaks, database is fully compromised

### 4.3 Medium

9. **No HTTPS Enforcement Warning**
   - Backend CORS includes `http://` origins alongside `https://`
   - No HSTS header

10. **Firebase Private Key in .env**
    - Stored as multiline string with `\n` escapes
    - If `.env` leaks, attacker can mint Firebase tokens

11. **No Rate Limiting**
    - No rate limiting on any endpoint
    - Login, signup, inquiry submission, email send are all unthrottled

12. **No Logging/Monitoring**
    - Morgan only logs basic HTTP request info
    - No audit trail for admin actions (who changed what, when)

13. **No Request Size Limit**
    - `express.json()` uses default 100kb limit
    - No file upload validation (product images are URLs, no actual upload endpoint)

### 4.4 Low

14. **Helmet configured but minimal**
    - Default helmet settings (no custom CSP)
    - Missing: `X-Frame-Options`, `Referrer-Policy` customizations

15. **Socket.io open**
    - Socket.io server accepts connections from any origin
    - Currently only logs connections, but open attack surface

16. **Git History Exposes Secrets**
    - Previous commits may contain old API keys, passwords, or test data
    - `.env` is in `.gitignore` but `FIREBASE_PRIVATE_KEY` was previously committed (check git log)

## 5. External Connections & Third-Party Services

| Service | Connection Type | Data Shared | Compliance |
|---------|----------------|-------------|------------|
| **Firebase Auth** | REST API (from browser) | Email, password | SOC 2, GDPR |
| **Firebase Admin SDK** | REST API (from backend) | ID tokens for verification | SOC 2, GDPR |
| **MongoDB Atlas** | MongoDB wire protocol (TLS) | All app data | SOC 2, GDPR, HIPAA eligible |
| **Gmail SMTP** | SMTP over TLS (587) | Subscriber emails | GDPR (DPA available) |
| **GitHub Pages** | HTTPS static hosting | None (serves public files) | SOC 2, GDPR |
| **Render** | HTTPS + Node.js hosting | Environment variables, app data | SOC 2, GDPR |

## 6. Authentication Flow — Detailed

```
1. User opens app
2. Firebase Auth checks for existing session token (IndexedDB/localStorage)
3. If no session → Login page → email + password → Firebase returns ID token
4. Axios interceptor reads token from auth.currentUser.getIdToken()
5. Every API call includes: Authorization: Bearer <token>
6. Backend validateFirebaseToken:
   a. Extracts token from Authorization header
   b. Calls admin.auth().verifyIdToken(token)
   c. Returns firebaseUID, email in req.user
   d. If token invalid → 401 Unauthorized
7. adminGuard:
   a. Checks if req.user exists (from validateFirebaseToken)
   b. Queries Admin collection for matching firebaseUID
   c. If not found, checks if req.user.email is in ADMIN_EMAILS env var
   d. If neither → 403 Forbidden
8. Role stored client-side in localStorage: electrishop-role
   - Set on login/signup via authService.assignRole()
   - Read on app init in AuthContext
   - No server-side role validation beyond adminGuard
```

## 7. Database Connection

```
MongoDB URI: mongodb+srv://elecrtistore_db_user:Ig400H2uMP4BLls6@cluster0.cactqvd.mongodb.net/Alextronics
             └───────── username ─────────┘└─────── password ───────┘└────── host ───────┘└─── db ───┘

- Connection: TLS required (Atlas enforces)
- Auth: SCRAM (username/password in URI string)
- No IP whitelist configured (Atlas allows all IPs by default)
- No VPC peering
- Database user has readWrite on all databases
```

## 8. Environment Variables Exposure Points

| Location | What's Exposed | Risk |
|----------|---------------|------|
| `.env` (local) | MONGODB_URI, FIREBASE_PRIVATE_KEY, SMTP_PASS | **Critical** — Full database + email access |
| Render dashboard | Same as `.env` | **Critical** — If Render account compromised |
| GitHub Actions logs | May print env vars if not masked | **High** — Check workflow files |
| `frontend/.env` | VITE_API_URL only | Low — Just the API endpoint |

## 9. Fixes Applied (Security Audit Remediation)

### Completed Fixes

| # | Issue | Fix | Files Changed |
|---|-------|-----|---------------|
| 1 | **No auth on product write routes** | Added `validateFirebaseToken` + `adminGuard` to POST/PUT/DELETE | `routes/productRoutes.ts` |
| 2 | **No auth on category write routes** | Added `validateFirebaseToken` + `adminGuard` to POST/PUT/DELETE | `routes/categoryRoutes.ts` |
| 3 | **No auth on inquiry GET routes** | Added `validateFirebaseToken` + `adminGuard` to GET `/`, GET `/:id` | `routes/inquiryRoutes.ts` |
| 4 | **No auth on dashboard routes** | Added `validateFirebaseToken` + `adminGuard` to GET `/stats` | `routes/dashboardRoutes.ts` |
| 5 | **Inquiry IDOR (all users see all inquiries)** | Added `firebaseUID` field to Inquiry model; new `GET /my` endpoint returns only user's own inquiries; ownership check on `GET /:id` | `models/Inquiry.ts`, `controllers/inquiryController.ts`, `routes/inquiryRoutes.ts`, `frontend/MyInquiriesPage.tsx` |
| 6 | **Mass assignment on create/update** | Added `pickAllowed()` allowlist functions for Product and Category; explicitly destructure Inquiry fields | `controllers/productController.ts`, `controllers/categoryController.ts`, `controllers/inquiryController.ts` |
| 7 | **No input validation** | Added `express-validator` validation chains for Product, Category, and Inquiry creation | `controllers/productController.ts`, `controllers/categoryController.ts`, `controllers/inquiryController.ts` |
| 8 | **No rate limiting** | Added `express-rate-limit` with 100 req/15min global limit and 10 req/15min auth-specific limit | `index.ts`, `package.json` |
| 9 | **No request body size limit** | Added `express.json({ limit: '100kb' })` | `index.ts` |
| 10 | **Error messages leaked in production** | Error handler returns generic message when `NODE_ENV=production` | `middleware/errorHandler.ts` |
| 11 | **Socket.io wildcard CORS** | Restricted Socket.io CORS to match Express allowed origins | `index.ts` |
| 12 | **Email template XSS** | Added `xss` sanitization for all user-supplied email content (body, subject, product name/brand) | `controllers/emailController.ts` |
| 13 | **Morgan dev mode in production** | Conditional: `morgan('combined')` in production, `dev` otherwise | `index.ts` |
| 14 | **Missing CSP header** | Configured Helmet with strict CSP (script-src, style-src, img-src, connect-src, font-src limited) | `index.ts` |
| 15 | **render.yaml placeholder admin email** | Changed `ADMIN_EMAILS` from hardcoded placeholder to `sync: false` (must be set in dashboard) | `render.yaml` |

### Remaining Recommendations (Manual / Operational)

#### Critical (Requires Manual Action)
1. **Rotate MongoDB password** — current password `Ig400H2uMP4BLls6` is in this audit document
2. **Rotate Gmail App Password** — `jbxs diqr rqbp sizg` is exposed
3. **Rotate Firebase Private Key** — private key is in `backend/.env`
4. **Change `ADMIN_SECRET_CODE`** from `123456789` to a strong random value
5. **Add IP whitelist** to MongoDB Atlas cluster (currently allows all IPs)
6. **Restrict `ADMIN_EMAILS`** to a single verified admin email (set in Render dashboard)

#### High
7. **Add recaptcha** to inquiry and subscribe forms to prevent bot abuse
8. **Implement email verification** for subscriptions (double opt-in)
9. **Restrict seller contact info** to authenticated users only (phone/Whatsapp currently public)
10. **Audit git history** for previously committed secrets (`git log --all -p` for sensitive patterns)

#### Medium
11. **Add audit logging** for all admin actions (who changed what, when)
12. **Implement proper RBAC** server-side (not just localStorage role)
13. **Regular `npm audit`** and dependency updates (current: 6 moderate vulns)
14. **Add `.env.example`** to git without real secrets
15. **Add health check monitoring** and automated backup verification
16. **Review Firebase Firestore Security Rules** if Firestore is used

## 10. Updated API Route Map

### 10.1 Public Routes (No Authentication)

| Route | Method | Risk Level | Notes |
|-------|--------|------------|-------|
| `/api/health` | GET | None | |
| `/api/products` | GET | **MEDIUM** — Seller phone/Whatsapp exposed | |
| `/api/products/:id` | GET | **MEDIUM** | |
| `/api/categories` | GET | Low | |
| `/api/site/:page` | GET | Low | |
| `/api/inquiries` | POST | Low — Rate limited + validated | Input validation applied, rate limited |
| `/api/email/subscribe` | POST | **MEDIUM** — No verification | Rate limited |

### 10.2 Authenticated Routes (Firebase Token Required)

| Route | Method | Notes |
|-------|--------|-------|
| `/api/auth/profile` | GET/PUT | Returns/changes own profile |
| `/api/inquiries/my` | GET | Returns only current user's inquiries |
| `/api/inquiries/:id` | GET | Ownership check (owner or admin) |

### 10.3 Admin Routes (Firebase Token + adminGuard)

| Route | Method | Notes |
|-------|--------|-------|
| `/api/products` | POST | Validated + allowlist |
| `/api/products/:id` | PUT/DELETE | Validated + allowlist |
| `/api/categories` | POST | Validated + allowlist |
| `/api/categories/:id` | PUT/DELETE | Validated |
| `/api/inquiries` | GET | All inquiries (admin only) |
| `/api/inquiries/:id/status` | PUT | Status enum validation |
| `/api/dashboard/stats` | GET | Protected |
| `/api/site/:page` | PUT/DELETE | Protected |
| `/api/email/subscribers` | GET/DELETE | Protected |
| `/api/email/send` | POST | HTML sanitized |
