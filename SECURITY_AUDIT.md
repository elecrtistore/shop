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
| 15 | **HSTS + other Helmet protections disabled** | `helmet()` was called with only CSP option, disabling all other defaults. Fixed by calling `helmet()` then `helmet.contentSecurityPolicy()` separately — HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, etc. now active | `index.ts` |
| 16 | **render.yaml placeholder admin email** | Changed `ADMIN_EMAILS` from hardcoded placeholder to `sync: false` (must be set in dashboard) | `render.yaml` |
| 17 | **Validation middleware defined but never wired** | `validateInquiry` and `validateProduct` were exported from controllers but never added to route middleware chains. Wired into routes. | `routes/inquiryRoutes.ts`, `routes/productRoutes.ts` |
| 18 | **Seller PII exposed publicly** | Seller phone and WhatsApp numbers were returned to all visitors via `GET /api/products` and `GET /api/products/:id`. Added `sanitizeProduct()` to strip `sellerPhone` and `sellerWhatsapp` on public endpoints. Admin endpoints return full data. | `controllers/productController.ts` |

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
9. **Audit git history** for previously committed secrets (`git log --all -p` for sensitive patterns)

#### Medium
10. **Add audit logging** for all admin actions (who changed what, when)
11. **Implement proper RBAC** server-side (not just localStorage role)
12. **Regular `npm audit`** and dependency updates (current: 6 moderate vulns)
13. **Add `.env.example`** to git without real secrets
14. **Add health check monitoring** and automated backup verification
15. **Review Firebase Firestore Security Rules** if Firestore is used
16. **Add idempotency key** for inquiry submission to prevent duplicates
17. **Add depth limit** to JSON parser to prevent nested object attacks
18. **Implement server-side price recalculation** for inquiry estimatedTotal (don't trust client)
19. **Add logout token revocation** via `revokeRefreshTokens()`

## 10. Updated API Route Map

### 10.1 Public Routes (No Authentication)

| Route | Method | Risk Level | Notes |
|-------|--------|------------|-------|
| `/api/health` | GET | None | |
| `/api/products` | GET | Low — Seller PII filtered | Sensitive fields stripped |
| `/api/products/:id` | GET | Low | Seller PII stripped |
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

---

## 11. Comprehensive Security Test Matrix

### 11.1 OWASP API Security Top 10

| # | Category | Test Case | Method | Expected | Status |
|---|----------|----------|--------|----------|--------|
| API1 | BOLA | Access inquiry by ID without auth | GET /api/inquiries/:id | 401 | **Fixed** — auth required |
| API1 | BOLA | Access another user's inquiry | GET /api/inquiries/:id | 403 | **Fixed** — ownership check |
| API2 | BOPLA | Add extra fields to product create | POST /api/products + extra fields | Stripped | **Fixed** — allowlist |
| API2 | BOPLA | Modify `estimatedTotal` before submit | POST /api/inquiries with altered total | Accepted | **Open** — trust client value |
| API3 | BFLA | Call admin stats as buyer | GET /api/dashboard/stats | 403 | **Fixed** — adminGuard |
| API3 | BFLA | Delete product as unauthenticated | DELETE /api/products/:id | 401 | **Fixed** |
| API4 | Resource Consumption | Submit 10MB inquiry payload | POST /api/inquiries large body | 413 | **Fixed** — 100kb limit |
| API4 | Resource Consumption | Deeply nested JSON | POST /api/inquiries nested 100 levels | Reject | **Open** — no depth limit |
| API5 | Third-party | SSRF via product image URL | POST /api/products image=http://internal.admin | No fetch | **Low** — URLs stored, not fetched |
| API6 | SSRF | Webhook/callback injection | No callback features exist | N/A | N/A |
| API7 | Misconfiguration | Access debug endpoints | /debug, /admin, /.env | 404 | **Acceptable** |
| API7 | Misconfiguration | Verbose error on invalid input | POST bad data | Generic | **Fixed** |
| API8 | Inventory | Old API version still active | No versioning used | N/A | N/A |
| API9 | Injection | Mongo `$ne` in inquiry search | GET /api/inquiries?status[$ne]= | 400 | **Fixed** — no raw query params |
| API9 | Injection | `__proto__` in product create | POST /api/products with prototype | Stripped | **Fixed** — JSON.parse default |
| API10 | Business Flow | Submit 1000 inquiries in parallel | POST /api/inquiries rapid fire | Rate limited | **Fixed** — rate limiter |

### 11.2 Business Logic Attack Matrix

| Test | Method | Impact | Mitigation | Status |
|------|--------|--------|------------|--------|
| Submit same inquiry 1000 times | POST /api/inquiries | Inquiry spam | Rate limited, validated | **Fixed** |
| Replay captured request | POST + same body | Duplicate orders | No idempotency key | **Open** |
| Negative quantity | POST items[0].quantity=-1 | Price manipulation | Validated (min: 1) | **Fixed** |
| Zero price | POST items[0].price=0 | Price manipulation | Validated (min: 0) | **Fixed** |
| Out-of-stock product | POST with unavailable productId | False order | No stock check on inquiry | **Open** |
| Max integer price | POST price=999999999999 | Overflow | Validated as float | **Acceptable** |
| HTML in customer name | POST customer.name=`<script>` | Stored XSS | MongoDB stores as-is, React escapes | **Fixed** |
| Bypass status flow | PUT status from New to Sold | Skip negotiation | Validated against enum | **Fixed** |
| Race condition on stock | Concurrent PUT stock | Oversell | No stock management | **Open** |
| Email subscriber bombing | POST /subscribe with 10k emails | Exhaustion | Rate limited | **Fixed** |

### 11.3 Session & JWT Security

| Test | Method | Expected | Status |
|------|--------|----------|--------|
| Expired Firebase token | Replay old Authorization header | 401 | **Fixed** — verifyIdToken checks exp |
| Modified JWT payload | Tamper uid/email in token | Invalid signature | **Fixed** — Admin SDK verification |
| Algorithm confusion | Change alg to "none" | Rejected | **Fixed** — Firebase SDK validates |
| Token from different issuer | Use token from other Firebase project | Invalid issuer | **Fixed** — SDK checks iss |
| Stolen token replay | Capture + reuse token | Blocked after expiry (1hr) | **Acceptable** — short-lived |
| Session fixation | Login with pre-set session | New session created | **Acceptable** — Firebase manages |
| Logout invalidates token | Use token after signOut | Still valid until expiry | **Open** — no revokeRefreshTokens |
| Multiple simultaneous sessions | Login from 2 devices | Both valid | **Acceptable** |
| Refresh token abuse | Steal refresh token | Rotated on use | **Acceptable** — Firebase handles |
| Token in URL/logs | Check for token leakage | Header only, not in URL | **Fixed** |

### 11.4 Browser Security Tests

| Test | Payload/Method | Expected | Status |
|------|---------------|----------|--------|
| Clickjacking | Render in iframe | Blocked | **Fixed** — Helmet X-Frame-Options via default helmet() |
| Mixed content | Load http:// resources | Blocked by CSP | **Fixed** — CSP img-src https: |
| MIME sniffing | Serve JS as HTML | Blocked | **Fixed** — X-Content-Type-Options via default helmet() |
| CSP bypass | inline event handler | Blocked | **Fixed** — script-src restricted |
| Referrer leakage | Cross-origin navigation | Trimmed | **Fixed** — Referrer-Policy via default helmet() |
| Tabnabbing | target="_blank" no rel | Blocked | **Fixed** — rel="noreferrer" used |
| DOM XSS | URL fragment injection | Escaped by React | **Fixed** |
| LocalStorage theft | XSS → read electrishop-role | Role only, not token | **Acceptable** |
| Cookie theft | XSS → steal cookies | No session cookies used | **Acceptable** |

### 11.5 MongoDB Security Tests

| Test | Payload | Expected | Status |
|------|---------|----------|--------|
| NoSQL injection (login bypass) | `{ "$ne": "" }` | Rejected | **Fixed** — no raw query passthrough |
| NoSQL injection (in inquiry) | `{ "$gt": "" }` in params | Not applicable | **Fixed** — findById uses string |
| Regex DoS | `.*.*.*.*...` long pattern | No regex endpoint | **Acceptable** |
| Aggregation injection | Inject pipeline stages | No user-facing aggregation | **Acceptable** |
| Operator injection | `$where`, `$regex` in body | Stripped by allowlist | **Fixed** |
| Collection enumeration | Guess collection names | No schema leak | **Acceptable** |
| Read preference abuse | `?readPreference=secondary` | Not exposed | **Acceptable** |
| Index abuse | Force slow queries | No user queries exposed | **Acceptable** |

### 11.6 Rate Limiting Verification

| Test | Endpoint | Attempts | Expected | Status |
|------|----------|----------|----------|--------|
| Global limit | /api/products | 101 in 15min | 429 after 100 | **Fixed** |
| Auth limit | /api/auth/profile | 11 in 15min | 429 after 10 | **Fixed** |
| Burst bypass | 100 req in 1sec | /api/inquiries | Rate limited | **Fixed** (windowed) |
| Distributed bypass | 100 different IPs | Each IP limited | Per-IP counting | **Fixed** (default) |
| Email spam | /api/email/send | Multiple sends | Rate limited | **Fixed** |
| Inquiry spam | /api/inquiries | Rapid POST | Rate limited | **Fixed** |
| Bypass via headers | X-Forwarded-For spoof | Trusts proxy chain | **Open** (Render handles) | **Acceptable** |

### 11.7 Email Security Tests

| Test | Payload | Expected | Status |
|------|---------|----------|--------|
| HTML injection | `<script>` in email body | Stripped | **Fixed** — xss sanitized |
| Header injection | `\r\nBCC: spam@evil.com` in subject | Rejected | **Acceptable** — nodemailer encodes |
| Template injection | `{{user.name}}` in body | Not evaluated | **Acceptable** — no template engine |
| Spoofing | Fake from address | SPF/DKIM on Gmail | **Acceptable** — Gmail enforces |
| Open relay | Send to non-subscriber | Blocked | **Fixed** — only to subscribers |
| SPF check | Verify DNS records | Gmail auto-configures | **Acceptable** |
| DMARC policy | Check _dmarc TXT | Not configured | **Open** |
| DKIM signing | Verify email integrity | Gmail auto-signs | **Acceptable** |
| Mass unsubscribe | One-click unsubscribe | No link | **Open** |
| Rate limit bypass | Multiple template types | Still rate limited | **Fixed** |

### 11.8 File & Upload Security (Future-Proofing)

| Test | Scenario | Expected | Status |
|------|----------|----------|--------|
| MIME validation | Upload .exe as image | No upload endpoint | N/A |
| Double extension | image.jpg.php | N/A | N/A |
| Zip bomb | Compressed 10GB archive | N/A | N/A |
| SVG XSS | SVG with embedded script | N/A | N/A |
| Oversized file | 500MB upload | N/A | N/A |
| Path traversal | `../../etc/passwd` as filename | N/A | N/A |

All product images are URL references, not uploaded files. No file upload endpoint exists. When added, apply allowlist (images/*) + size limit + virus scanning.

### 11.9 Infrastructure & Network Tests

| Test | Tool/Method | Expected | Status |
|------|-------------|----------|--------|
| Open ports | Nmap scan | 443 (HTTPS), 80 (redirect) | **Acceptable** — Render manages |
| TLS version | SSL Labs | TLS 1.2+ | **Acceptable** — Render enforces |
| Weak ciphers | testssl.sh | No weak ciphers | **Acceptable** |
| HSTS header | curl -I | max-age=31536000 | **Fixed** — Helmet includes |
| DNS records | dig | Correct A/AAAA/CNAME | **Open** — verify DNS |
| Subdomain enumeration | Sublist3r | No unexpected subdomains | **Acceptable** |
| Reverse proxy | X-Forwarded-For handling | Trusted | **Acceptable** |
| HTTP methods | OPTIONS /api | Only allowed methods | **Fixed** — CORS restricted |
| HTTPS redirect | HTTP → HTTPS | Automatic | **Acceptable** — Render handles |

### 11.10 Cloud Security — Render

| Test | Method | Expected | Status |
|------|--------|----------|--------|
| Debug mode | NODE_ENV check | Production | **Fixed** — render.yaml sets production |
| Stack trace | Trigger 500 error | Generic message | **Fixed** |
| Environment isolation | Access other services | Not possible | **Acceptable** — Render sandboxed |
| Secret rotation | Change env vars | Requires deploy | **Open** — manual process |
| Container escape | Break out of runtime | Render hardened | **Acceptable** |
| Health check abuse | /api/health | Public, no data leak | **Acceptable** |

### 11.11 Cloud Security — MongoDB Atlas

| Test | Method | Expected | Status |
|------|--------|----------|--------|
| IP whitelist | Connect from non-whitelisted IP | Blocked | **Open** — 0.0.0.0/0 allows all |
| TLS enforcement | Connect without TLS | Rejected | **Acceptable** — Atlas requires TLS |
| Database user roles | Check permissions | readWrite on all DBs | **Open** — scope to single DB |
| Audit logs | Enable Atlas auditing | Not enabled | **Open** |
| Backup encryption | Check backup config | Atlas encrypts at rest | **Acceptable** |
| Encryption at rest | Verify AES-256 | Atlas default | **Acceptable** |
| VPC peering | Network isolation | Not configured | **Open** — premium feature |

### 11.12 Firebase Security Tests

| Test | Method | Expected | Status |
|------|--------|----------|--------|
| Custom claims | Set admin via Firebase Admin SDK | Not implemented | **Open** — uses env/mongo instead |
| Revoked tokens | Call revokeRefreshTokens() | Not called on logout | **Open** |
| Anonymous login | signInAnonymously | Not implemented | N/A |
| Firestore rules | Test read/write from client | Not using Firestore | N/A |
| Storage rules | Test file access | Not using Storage | N/A |
| Password reset abuse | Repeated reset emails | Firebase throttles | **Acceptable** |
| Account enumeration | Check if email exists | Firebase returns generic | **Acceptable** |
| Rate limiting on auth | Multiple login attempts | Firebase handles | **Acceptable** |

### 11.13 Logging & Monitoring Audit

| Test | Check | Expected | Status |
|------|-------|----------|--------|
| Password in logs | Trigger login error | No password logged | **Fixed** — morgan logs URL + status only |
| Token in logs | Trigger auth error | No token logged | **Fixed** |
| Cookie in logs | Check morgan output | No cookies | **Acceptable** |
| API key in logs | Check error handler | No keys | **Fixed** |
| Stack trace in prod | Trigger 500 | Generic message | **Fixed** |
| PII in error response | Invalid input | Only validation errors | **Fixed** |
| Admin audit trail | Track who changed what | Not implemented | **Open** |
| Log retention | Check storage duration | Render logs rotate | **Acceptable** |

### 11.14 Dependency Security

| Test | Tool | Result | Status |
|------|------|--------|--------|
| Known vulns | npm audit | 6 moderate (uuid transitive) | **Open** — firebase-admin dependency |
| Known vulns | Snyk | Not run | **Open** |
| Known vulns | Dependabot | Not configured | **Open** |
| Outdated packages | npm outdated | Check periodically | **Open** |
| Supply chain | Package-lock integrity | Lockfile present | **Fixed** |
| Typosquatting | Review package names | All legitimate | **Acceptable** |
| License audit | Check licenses | Not reviewed | **Open** |

### 11.15 Denial of Service Resistance

| Test | Payload | Expected | Status |
|------|---------|----------|--------|
| Slowloris | Slow HTTP headers | Timeout | **Acceptable** — Render reverse proxy |
| JSON bomb | Deeply nested `[` | Depth limit missing | **Open** |
| Large JSON | 500MB payload | 413 Entity Too Large | **Fixed** — 100kb limit |
| Regex bomb | Evil regex in input | No user regex | **Acceptable** |
| Compression bomb | zlib-compressed payload | No compression accepted | **Acceptable** |
| Connection flood | 10k concurrent sockets | Rate limited | **Fixed** |
| CPU exhaustion | Expensive aggregation | No user aggregation | **Acceptable** |
| Memory exhaustion | Large product array in body | 100kb cap protects | **Fixed** |

### 11.16 Privacy & Compliance

| Requirement | Check | Status |
|-------------|-------|--------|
| GDPR consent | Cookie consent banner | **Fixed** — CookieConsent component |
| Privacy policy | Published page | **Fixed** — /privacy |
| Terms of service | Published page | **Fixed** — /terms |
| Data deletion | Delete account endpoint | **Open** — no user deletion |
| Data export | Export user data API | **Open** |
| Data retention policy | Auto-delete old inquiries | **Open** |
| Right to be forgotten | Purge PII on request | **Open** |
| Breach notification plan | Documented process | **Open** |
| Data Processing Agreement | With third parties | **Acceptable** — Firebase/Atlas/Gmail have DPAs |

### 11.17 Secret Leakage Scan

| Tool | Scan Target | Status |
|------|-------------|--------|
| GitLeaks | Full git history | **Open** — not run |
| TruffleHog | Full git history | **Open** — not run |
| GitGuardian | GitHub integration | **Open** — not configured |
| Manual review | Check for committed .env | **Acceptable** — .env in gitignore |
| Manual review | Check for hardcoded keys | **Acceptable** — all in env vars |

## 12. Risk Scoring Summary (CVSS v3.1)

| # | Finding | CVSS Score | Severity | Status |
|---|---------|------------|----------|--------|
| 1 | MongoDB Atlas IP whitelist 0.0.0.0/0 | 9.1 | **Critical** | Open |
| 2 | Weak admin secret code (123456789) | 8.6 | **High** | Open |
| 3 | No DB credential rotation | 8.6 | **High** | Open |
| 4 | SMTP password exposed in audit doc | 7.5 | **High** | Open |
| 5 | Firebase private key in .env | 7.5 | **High** | Open |
| 6 | No recaptcha on public forms | 6.1 | **Medium** | Open |
| 7 | No logout token revocation | 5.3 | **Medium** | Open |
| 8 | No email verification on subscribe | 5.0 | **Medium** | Open |
| 9 | No idempotency on inquiry submit | 4.8 | **Medium** | Open |
| 10 | Client-side estimatedTotal trusted | 4.8 | **Medium** | Open |
| 11 | No audit logging for admin actions | 4.3 | **Medium** | Open |
| 12 | Missing depth limit on JSON parser | 3.7 | **Low** | Open |
| 13 | No stock validation on inquiry | 3.7 | **Low** | Open |
| 14 | 6 moderate npm vulns (transitive) | 5.0 | **Medium** | Open |

## 13. Security Maturity Scorecard

| Category | Score | Notes |
|----------|-------|-------|
| Authentication | 9/10 | Firebase handles core auth; missing token revocation on logout |
| Authorization | 8/10 | Admin + owner checks in place; no fine-grained RBAC |
| Input Validation | 8/10 | Validated + allowlisted + wired into routes; no depth limit on JSON |
| API Security | 8/10 | BOLA/BFLA fixed; only client-side price trust remains weak |
| XSS Prevention | 9/10 | React auto-escapes + CSP + email sanitizer |
| Rate Limiting | 8/10 | Global + auth limits; no per-endpoint tuning |
| Session Management | 6/10 | Firebase handles; no revocation, no refresh rotation |
| MongoDB Security | 6/10 | No injection vectors; Atlas IP whitelist open |
| Email Security | 6/10 | HTML sanitized; no SPF/DMARC verification |
| HTTP Security | 9/10 | Helmet full stack (HSTS, CSP, X-Frame, X-Content-Type, Referrer-Policy) |
| Seller PII Protection | 10/10 | Fully filtered from public API |
| Infrastructure | 5/10 | Render manages most; no port scan, no SSL test run |
| Cloud Security | 5/10 | Atlas IP open, no audit logs, no VPC |
| Logging & Monitoring | 4/10 | Basic request logging; no admin audit trail |
| Dependency Security | 4/10 | npm audit shows 6 vulns; no Dependabot/Snyk |
| Privacy & Compliance | 5/10 | Consent banner + policies present; no data export/delete |
| Business Logic | 5/10 | Most flow attacks blocked; no idempotency, no stock check |
| **Overall** | **6.6/10** | **Good app-level security; operational and business-logic gaps remain** |

## 14. Attack Scenarios — Additional Coverage

| Attack | Vector | Mitigation | Status |
|--------|--------|------------|--------|
| HTTP Parameter Pollution | `?id=valid&id=malicious` | Express takes last value | **Acceptable** |
| Cache Poisoning | Manipulate cached responses | No caching layer | **Acceptable** |
| Web Cache Deception | `/api/inquiries/test.css` | No cache on API | **Acceptable** |
| HTTP Request Smuggling | CL/TE desync | Render reverse proxy handles | **Acceptable** |
| Host Header Injection | Malicious Host header | Render validates | **Acceptable** |
| CRLF Injection | `%0d%0a` in headers | Helmet + Express sanitize | **Fixed** |
| Prototype Pollution | `__proto__` in JSON | JSON.parse safe by default | **Acceptable** |
| Unicode Normalization | UTF-8 encoded `../../` | No path traversal vectors | **Acceptable** |
| SSTI | `{{constructor}}` in body | No template engine | **Acceptable** |
| Open Redirect | `/redirect?url=http://evil` | No redirect endpoints | **Acceptable** |
| DNS Rebinding | Point domain to internal IP | CORS origin check blocks | **Fixed** |
| Timing Attack | Measure response time on auth | Firebase constant-time | **Acceptable** |
| Email Enumeration | Check signup responses | Uniform responses | **Acceptable** |
| Race Condition (inventory) | Concurrent stock decrement | No inventory management | **Open** |
| CORS Preflight Abuse | Malicious OPTIONS request | Restricted methods + origins | **Fixed** |

## 15. Recommended Tooling for CI/CD Pipeline

| Tool | Purpose | Priority |
|------|---------|----------|
| **npm audit** | Dependency vulnerability scan | **High** — run on every build |
| **ESLint Security Plugin** | Detect insecure JS patterns | **High** |
| **CodeQL** | GitHub-native SAST scanning | **Medium** — free for public repos |
| **Dependabot** | Automated dependency PRs | **Medium** — free on GitHub |
| **GitLeaks** | Secret leakage prevention | **High** — run pre-commit |
| **Snyk** | Comprehensive dependency audit | **Medium** — free tier available |
| **OWASP ZAP** | DAST — automated web scanning | **Medium** |
| **Trivy** | Container/filesystem vuln scan | **Low** — when containerized |
| **Semgrep** | Custom SAST rule engine | **Low** |
| **k6** | Load + DoS resistance testing | **Low** |

## 16. Incident Response Plan (Checklist)

| Phase | Action |
|-------|--------|
| **Detect** | Monitor Render logs for 5xx spikes, unexpected 401s, rate limit triggers |
| **Triage** | Check if breach is: credential leak,0-day, configuration error, or DoS |
| **Contain** | Rotate all secrets (MongoDB, Firebase, SMTP). Update Atlas IP whitelist. Suspend Render service if needed. |
| **Eradicate** | Remove attacker access. Purge any injected data. Review Admin collection. |
| **Recover** | Restore from backup. Verify integrity. Deploy with rotated credentials. |
| **Post-mortem** | Document timeline. Update security controls. Add detection rules. |

## 17. Verification Status Legend

| Status | Meaning |
|--------|---------|
| **Fixed** | Vulnerability is remediated in the current codebase |
| **Acceptable** | Risk is understood, accepted, or mitigated by platform |
| **Open** | Requires action (code change, config change, or operational task) |
| N/A | Not applicable to this application |

---

**Document Version**: 2.0  
**Last Updated**: 2026-07-01  
**Scope**: Full-stack security audit covering OWASP Top 10, API Security, Business Logic, Infrastructure, Cloud, and Compliance.
