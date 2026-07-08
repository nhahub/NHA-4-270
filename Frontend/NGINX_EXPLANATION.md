# Nginx Reverse Proxy — Complete Explanation

> **Target Audience:** Junior DevOps Team (assumes basic HTTP knowledge, but NO Nginx or reverse proxy experience)
>
> **Goal:** Understand what Nginx is, what problem it solves in our project, how `nginx.conf` works line-by-line, and why the same code works in development but breaks in production.

---

## Table of Contents

1. [The Problem — Why does it work in dev but not in production?](#1-the-problem--why-does-it-work-in-dev-but-not-in-production)
2. [What is the Same-Origin Policy and CORS?](#2-what-is-the-same-origin-policy-and-cors)
3. [What is Nginx?](#3-what-is-nginx)
4. [The Solution — Nginx Reverse Proxy](#4-the-solution--nginx-reverse-proxy)
5. [nginx.conf — Full File](#5-nginxconf--full-file)
6. [nginx.conf — Line-by-Line Breakdown](#6-nginxconf--line-by-line-breakdown)
7. [The Updated Angular Interceptor](#7-the-updated-angular-interceptor)
8. [End-to-End Request Flow](#8-end-to-end-request-flow)
9. [Summary — Why all this matters](#9-summary--why-all-this-matters)

---

## 1. The Problem — Why does it work in dev but not in production?

### The code that causes the problem

Before the fix, our Angular app had this code in `Frontend/src/app/core/interceptors/api-url.interceptor.ts`:

```typescript
import { HttpInterceptorFn } from '@angular/common/http';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = 'http://localhost:5097';    // ← HARDCODED URL
  if (req.url.startsWith('/api/')) {
    const cloned = req.clone({
      url: `${apiBaseUrl}${req.url}`             // ← http://localhost:5097/api/products
    });
    return next(cloned);
  }
  return next(req);
};
```

### What this code does

Whenever the Angular app makes an API call (e.g., `this.http.get('/api/products')`), this interceptor **rewrites** the URL:

| Original Request | Becomes |
|---|---|
| `/api/products` | `http://localhost:5097/api/products` |
| `/api/categories` | `http://localhost:5097/api/categories` |

It takes the relative path `/api/products` and prepends `http://localhost:5097` to it.

### Why this works in development

```
┌──────────────────────────────────────────────────────┐
│              Development Machine                      │
│                                                       │
│  Browser at: http://localhost:4200                    │
│                                                       │
│  ┌──────────────────┐    ┌──────────────────────┐    │
│  │  Angular App      │    │  .NET Backend        │    │
│  │  (ng serve)       │    │  (dotnet run)        │    │
│  │  localhost:4200   │───►│  localhost:5097      │    │
│  │                   │    │                      │    │
│  │  Calls:           │    │  Returns:            │    │
│  │  localhost:5097/  │◄───│  JSON data           │    │
│  │  api/products     │    │                      │    │
│  └──────────────────┘    └──────────────────────┘    │
│                                                       │
│  BOTH on your computer → no network issues            │
└──────────────────────────────────────────────────────┘
```

In development:
- Angular runs on `http://localhost:4200`
- Backend runs on `http://localhost:5097`
- They're **both on your computer**
- The browser can reach `localhost:5097` just fine
- **Everything works... until you deploy to production**

### Why this BREAKS in production

```
┌─────────────────────────────────────────────────────────┐
│                    EKS Cluster                           │
│                                                          │
│  Node 2 (production)                                     │
│                                                          │
│  ┌────────────────────────┐  ┌────────────────────────┐ │
│  │  Frontend Pod          │  │  Backend Pod            │ │
│  │                        │  │                         │ │
│  │  Nginx (port 80)       │  │  .NET API (port 5097)   │ │
│  │  Serves Angular files  │  │  Pod IP: 10.244.0.10    │ │
│  │                        │  │                         │ │
│  │  Angular app loads     │  │  Backend is HERE        │ │
│  │  in the BROWSER        │  │  ───────────────────────│ │
│  │                        │  │  But browser CAN'T      │ │
│  │                        │  │  reach Pod IP directly! │ │
│  └────────────────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
         │
         │ Browser loaded the Angular app from:
         ▼
┌─────────────────────────────────────────────────────────┐
│                    USER'S BROWSER                        │
│                                                          │
│  Angular app tries: http://localhost:5097/api/products   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  🔴 ERROR:                                       │   │
│  │  "localhost:5097" → The user's OWN computer       │   │
│  │                                                     │   │
│  │  There's nothing running on localhost:5097          │   │
│  │  on the user's machine.                             │   │
│  │                                                     │   │
│  │  The backend is inside the K8s cluster at           │   │
│  │  10.244.0.10 — which the browser can't reach.      │   │
│  │                                                     │   │
│  │  Result: Network Error — API calls fail             │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

**Why this happens:**

| Aspect | Development | Production (Kubernetes) |
|---|---|---|
| Angular location | `http://localhost:4200` (your PC) | `http://<load-balancer-url>` (AWS cloud) |
| Backend location | `http://localhost:5097` (your PC) | `http://10.244.0.10:5097` (inside K8s pod) |
| Can browser reach backend? | ✅ Yes — same machine | ❌ No — different machine, private IP |
| What happens? | ✅ Works perfectly | ❌ **Broken — connection refused** |

**But there's a SECOND problem too — CORS.**

Even if the browser COULD reach the backend (e.g., we exposed it via another LoadBalancer), it would hit a **CORS error** because the frontend URL and backend URL are different origins.

---

## 2. What is the Same-Origin Policy and CORS?

### Same-Origin Policy

Browsers have a security rule: **a web page can only make requests to the same origin** (same protocol + domain + port).

```
Same origin (✅ ALLOWED):
  Page at:   http://myapp.com/products
  Request:   http://myapp.com/api/products
             ^^^^^^^^^^^^^^^^^^^^^^^^^^^^
             Same protocol (http), same domain (myapp.com), same port (80)

Different origin (❌ BLOCKED by browser):
  Page at:   http://myapp.com
  Request:   http://api.myapp.com/data
             ^^^^^^^^^^^^^^^^^^^^^^^^^
             Different domain (myapp.com vs api.myapp.com)

Different origin (❌ BLOCKED):
  Page at:   http://myapp.com
  Request:   http://myapp.com:5097/api
             ^^^^^^^^^^^^^^^^^^^^^^^^^
             Different port (80 vs 5097)
```

### CORS (Cross-Origin Resource Sharing)

CORS is a mechanism that **relaxes** the same-origin policy. The server sends special HTTP headers saying "It's OK — this origin is allowed."

**How CORS works:**

```
Browser at http://frontend.com
         │
         │── GET http://backend.com/api/products ────►
         │   Origin: http://frontend.com               │
         │                                              │
         │◄── Response + HEADERS:                       │
         │   Access-Control-Allow-Origin:               │
         │     http://frontend.com   ← "OK, you're allowed"
         │                                              │
Your app receives the data ✅
```

**Without CORS:**

```
Browser at http://frontend.com
         │
         │── GET http://backend.com/api/products ────►
         │   Origin: http://frontend.com               │
         │                                              │
         │◄── Response (missing CORS headers)           │
         │                                              │
  🔴 BLOCKED by browser: "No 'Access-Control-Allow-Origin' header"
```

### The CORS problem in our project

If we exposed the backend via a public LoadBalancer:

- **Frontend URL:** `http://a5b2c3d4e5f6-123456789.us-east-1.elb.amazonaws.com`
- **Backend URL (if exposed):** Different URL entirely 
    - (`http://10.244.0.10:5097` (inside K8s pod)) 
    or 
    - (http://backend-service.production.svc.cluster.local:5097)

The browser would block the request unless the backend sends the correct CORS headers allowing the frontend's origin.

**This is why we need the Nginx solution — it avoids CORS entirely.**

---

## 3. What is Nginx?

### The simple explanation

Nginx (pronounced "Engine-X") is a **web server** — a program that:
1. Serves files (HTML, CSS, JS, images) to browsers
2. Can act as a **reverse proxy** (forward requests to other servers)
3. Is known for being **fast and lightweight**

### Nginx vs other web servers

| Web Server | Used for | Memory usage |
|---|---|---|
| **Apache** | General web serving | ~50MB+ per process |
| **IIS** | Windows/.NET apps | Heavy |
| **Nginx** | Static files + proxy | ~2-5MB per process |
| **Node.js** | JavaScript apps | ~20MB+ |

### Why we chose Nginx for the frontend

- It can serve our Angular static files (HTML, JS, CSS) very efficiently
- It can also **proxy API requests** to the backend — this is the key feature
- The Docker image is tiny (`nginx:alpine` — only ~25MB)

---

## 4. The Solution — Nginx Reverse Proxy

### What is a reverse proxy?

A **reverse proxy** sits between the browser and the backend server. The browser talks ONLY to the proxy, and the proxy talks to the backend.

```
BEFORE (no proxy):
  Browser ──► Backend (direct, causes CORS)

AFTER (with proxy):
  Browser ──► Nginx ──► Backend
              (proxy)
```

### How this solves both problems

| Problem | How Nginx solves it |
|---|---|
| **Browser can't reach backend IP** | Nginx is in the SAME pod as the frontend — it can reach the backend via internal Kubernetes DNS (`backend-service.production.svc.cluster.local:5097`) |
| **CORS error** | Browser talks ONLY to Nginx (same origin). Nginx talks to the backend internally — **CORS is completely bypassed** |

### The architecture:

```
                           SAME ORIGIN (no CORS)
  ┌────────────────────────────────────────────────────────┐
  │  Browser                                               │
  │  http://<load-balancer-url>/api/products               │
  │                                                │       │
  └────────────────────────────────────────────────|───────┘
                                                   │
                                                   ▼
  ┌────────────────────────────────────────────────────────┐
  │  Nginx (in frontend pod)                               │
  │                                                        │
  │  Sees: /api/products                                   │
  │  Forwards to: http://backend-service.production.svc    │
  │                .cluster.local:5097/api/products        │
  │                                                │       │
  └────────────────────────────────────────────────|───────┘
                                                   │
                                                   ▼
  ┌────────────────────────────────────────────────────────┐
  │  Backend (.NET API)                                    │
  │                                                        │
  │  Receives request from Nginx (internal)                │
  │  Processes it, returns JSON                            │
  │                                                │       │
  └────────────────────────────────────────────────|───────┘
                                                   │
                                                   ▼
  JSON response flows back: Backend → Nginx → Browser
```

**Key insight:** From the browser's perspective, ALL requests go to `http://<load-balancer-url>/...` — the same origin. The browser has no idea Nginx is forwarding some requests to the backend. **CORS is never triggered.**

---

## 5. nginx.conf — Full File

Here's our complete `Frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;

    location / {
        root /usr/share/nginx/html;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend-service.production.svc.cluster.local:5097;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://backend-service.production.svc.cluster.local:5097;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    error_page 500 502 503 504 /50x.html;
    location = /50x.html {
        root /usr/share/nginx/html;
    }
}
```

---

## 6. nginx.conf — Line-by-Line Breakdown

### The server block

```nginx
server {
```

| Part | Meaning |
|---|---|
| `server {` | Defines a virtual server. Nginx can have MULTIPLE server blocks for different domains. We have one — for our app. |

---

### Listening configuration

```nginx
listen 80;
```

| Part | What it does | Why we need it |
|---|---|---|
| `listen 80` | Tells Nginx to accept HTTP connections on port 80 | Port 80 is the default HTTP port. All web traffic arrives here. Without this, Nginx wouldn't accept ANY connections. |
| `80` | Port number | The frontend Dockerfile has `EXPOSE 80` — this must match. |

---

### Server name

```nginx
server_name localhost;
```

| Part | What it does | Why we need it |
|---|---|---|
| `server_name localhost` | Tells Nginx which domain name to respond to | This is a placeholder. In Kubernetes, the actual domain is the LoadBalancer URL. Nginx doesn't care about the exact domain — it serves all requests. |

---

### Location / — Static files (SPA routing)

```nginx
location / {
    root /usr/share/nginx/html;
    index index.html index.htm;
    try_files $uri $uri/ /index.html;
}
```

#### `location /`

| Part | What it does |
|---|---|
| `location /` | Match ALL URL paths that start with `/`. This is the DEFAULT handler for any request that doesn't match a more specific `location` block. |

#### `root /usr/share/nginx/html`

| Part | What it does | Why we need it |
|---|---|---|
| `root` | Sets the directory where files are stored | After the Angular build, our compiled files (index.html, main.js, styles.css, etc.) are placed here. The Dockerfile copies them to this exact path: `COPY --from=build /app/dist/inventory-app/browser /usr/share/nginx/html` |

**Example:** If someone requests `http://myapp.com/main.js`, Nginx looks for the file at `/usr/share/nginx/html/main.js`.

#### `index index.html index.htm`

| Part | What it does | Why we need it |
|---|---|---|
| `index` | When someone visits a DIRECTORY path, serve this file | If someone visits `http://myapp.com/`, Nginx automatically serves `/usr/share/nginx/html/index.html`. |

#### `try_files $uri $uri/ /index.html` — THE MOST IMPORTANT LINE FOR ANGULAR

| Part | What it does | Why we need it |
|---|---|---|
| `try_files` | Try each option in order, fall back to last option | **This is the SPA routing fix.** Angular is a Single Page Application — it handles routing in the browser. When the user refreshes on `/products`, the browser asks Nginx for a FILE at `/products`. But there's no `products.html` file. |

**How `try_files` works step by step:**

```
User refreshes on: http://myapp.com/products

1. Nginx tries: $uri = "/products"
   → Looks for file: /usr/share/nginx/html/products
   → Not found ❌

2. Nginx tries: $uri/ = "/products/"
   → Looks for directory: /usr/share/nginx/html/products/
   → Not found ❌

3. Nginx falls back to: /index.html
   → Serves: /usr/share/nginx/html/index.html ✅
   → Angular loads, reads the URL, shows the products page

Result: No 404 errors on page refresh!
```

**What happens WITHOUT `try_files`:**

```
User refreshes on: http://myapp.com/products
→ Nginx looks for: /usr/share/nginx/html/products
→ File not found
→ Returns: 404 Not Found 🔴
→ App breaks on refresh!
```

---

### Location /api/ — Reverse proxy for backend

```nginx
location /api/ {
    proxy_pass http://backend-service.production.svc.cluster.local:5097;
    ...
}
```

#### `location /api/`

| Part | What it does | Why we need it |
|---|---|---|
| `location /api/` | Match ANY URL that starts with `/api/` | All our backend endpoints start with `/api/` (e.g., `/api/products`, `/api/categories`, `/api/auth/login`). This block catches them all. |

**The order matters:** Nginx uses the **most specific match**. `/api/` is more specific than `/`, so API requests go here, not to the static files handler.

#### `proxy_pass ...`

| Part | What it does | Why we need it |
|---|---|---|
| `proxy_pass` | Forward the request to another server | Instead of looking for a file, Nginx sends the request to the backend service running inside the Kubernetes cluster. |
| `http://backend-service.production.svc.cluster.local:5097` | The destination URL | This is the Kubernetes internal DNS name for the backend service. It resolves to the ClusterIP of the backend service. The `.production.svc.cluster.local` suffix is Kubernetes' internal DNS naming convention: `<service-name>.<namespace>.svc.cluster.local` |

**What happens:**

```
Browser request:  http://myapp.com/api/products
                                 │
                                 ▼
Nginx matches:    location /api/
                                 │
                                 ▼
proxy_pass to:    http://backend-service.production.svc.cluster.local:5097/api/products
                                 │
                                 ▼
Backend receives: /api/products
                 (same path after the hostname)
```

#### `proxy_http_version 1.1`

| Part | What it does | Why we need it |
|---|---|---|
| `proxy_http_version 1.1` | Use HTTP/1.1 when talking to the backend | Modern web features (WebSockets, keep-alive connections) require HTTP/1.1. Without this, Nginx would use HTTP/1.0 which lacks these features. |

#### `proxy_set_header` directives

```nginx
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection 'upgrade';
```

| Part | What it does | Why we need it |
|---|---|---|
| `Upgrade` / `Connection` | Support WebSocket connections | Some features (real-time updates, live notifications) use WebSockets. These headers allow the connection to "upgrade" from HTTP to WebSocket. Without them, WebSocket connections would fail. |

```nginx
proxy_set_header Host $host;
```

| Part | What it does | Why we need it |
|---|---|---|
| `Host $host` | Pass the ORIGINAL hostname to the backend | Without this, the backend would see the request as coming from `backend-service.production.svc.cluster.local` — the internal service name. The `Host` header tells the backend what domain the user actually used. |

**Why this matters:** If your backend generates links or redirects, it needs to know the real domain name. Without this header, it would generate links pointing to the internal Kubernetes service name, which the browser can't reach.

```nginx
proxy_set_header X-Real-IP $remote_addr;
```

| Part | What it does | Why we need it |
|---|---|---|
| `X-Real-IP $remote_addr` | Pass the user's REAL IP address to the backend | Without this, the backend would see ALL requests as coming from Nginx's IP (the pod IP). The `X-Real-IP` header tells the backend: "The original user was at this IP address." |

**Why this matters:** If you need IP-based features (logging, rate limiting, geo-location), the backend needs the real user IP, not the proxy's IP.

```nginx
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

| Part | What it does | Why we need it |
|---|---|---|
| `X-Forwarded-For` | List of all proxies the request passed through | If there are MULTIPLE proxies between the user and the backend (e.g., AWS LoadBalancer → Nginx → Backend), this header accumulates the chain of IPs. |

**Example:** `X-Forwarded-For: 203.0.113.5, 10.100.0.1` means the request came from user IP 203.0.113.5 through proxy IP 10.100.0.1.

```nginx
proxy_set_header X-Forwarded-Proto $scheme;
```

| Part | What it does | Why we need it |
|---|---|---|
| `X-Forwarded-Proto $scheme` | Tell the backend whether the original request was HTTP or HTTPS | The backend needs to know if the original connection was secure (HTTPS) to generate correct redirect URLs and enforce security policies. `$scheme` is either `http` or `https`. |

```nginx
proxy_cache_bypass $http_upgrade;
```

| Part | What it does | Why we need it |
|---|---|---|
| `proxy_cache_bypass` | Don't cache WebSocket upgrade requests | If the browser is trying to upgrade to WebSocket, we don't want Nginx to return a cached response. This ensures the upgrade request reaches the backend. |

---

### Location /uploads/ — Proxy for uploaded files

```nginx
location /uploads/ {
    proxy_pass http://backend-service.production.svc.cluster.local:5097;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

| Part | What it does | Why we need it |
|---|---|---|
| `location /uploads/` | Match URLs starting with `/uploads/` | The application has a file upload feature (product images, profiles, etc.). Uploaded files are served by the backend at `/uploads/`. This location block proxies those requests to the backend. |
| Fewer headers | Only essential headers | File uploads don't need WebSocket headers or cache bypass. We only pass the host and real IP. Simpler is better. |

---

### Error page

```nginx
error_page 500 502 503 504 /50x.html;
location = /50x.html {
    root /usr/share/nginx/html;
}
```

| Part | What it does | Why we need it |
|---|---|---|
| `error_page 500...` | For specific HTTP error codes, show a custom page | If the backend crashes (500), is unavailable (502/503), or times out (504), show a friendly error page instead of a white screen or raw error message. |
| `location = /50x.html` | Match EXACTLY `/50x.html` (the `=` means exact match) | Serve the error page file from the static files directory. |

---

## 7. The Updated Angular Interceptor

After adding the Nginx proxy, we also updated the Angular interceptor to work correctly in both environments:

```typescript
import { HttpInterceptorFn } from '@angular/common/http';
import { isDevMode } from '@angular/core';

export const apiUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const apiBaseUrl = isDevMode()
    ? 'http://localhost:5097'           // Development: direct to backend
    : window.location.origin;           // Production: same origin (Nginx proxy)

  if (req.url.startsWith('/api/')) {
    const cloned = req.clone({
      url: `${apiBaseUrl}${req.url}`
    });
    return next(cloned);
  }
  return next(req);
};
```

### How `isDevMode()` works

| Aspect | `ng serve` (dev) | Production build |
|---|---|---|
| `isDevMode()` | `true` | `false` |
| `apiBaseUrl` | `http://localhost:5097` | `window.location.origin` |
| Where request goes | Direct to backend on localhost | To the SAME SERVER that served the Angular app |
| CORS needed? | ✅ Yes (handled by `Cors:AllowedOrigins`) | ❌ No (same origin — Nginx handles proxying) |

### What `window.location.origin` evaluates to

| Environment | `window.location.origin` |
|---|---|
| Local development (`ng serve`) | `http://localhost:4200` |
| Production (K8s LoadBalancer) | `http://a5b2c3d4e5f6-123456789.us-east-1.elb.amazonaws.com` |

Since in production the interceptor uses `window.location.origin`, the API requests go to the SAME URL as the frontend app. Nginx receives them and proxies to the backend. **The browser never knows about the backend.**

---

## 8. End-to-End Request Flow

### Development Flow (without Nginx proxy)

```
[Developer's Machine]
         │
         │  ng serve on port 4200
         │  dotnet run on port 5097
         │
  Browser at http://localhost:4200
         │
         │── GET /api/products ──────────────────────────►
         │                                                 │
         │  Interceptor rewrites to:                       │
         │  http://localhost:5097/api/products             │
         │                                                 │
         │◄── JSON response ───────────────────────────────│
         │    .NET Backend at localhost:5097               │
         │                                                 │
         │  ✅ CORS works because                           │
         │     Cors:AllowedOrigins = "http://localhost:4200" │
```

### Production Flow (with Nginx proxy)

```
[User's Browser]
         │
         │  User visits http://a5b2c3d4e5f6.elb.amazonaws.com
         │
         │── HTML page loaded ────────────────────────────►
         │   Angular app starts, needs products data       │
         │                                                 │
         │── GET /api/products ───────────────────────────►│
         │                                                 │
         │  Nginx RECEIVES the request                     │
         │  (still on the SAME server — same origin)       │
         │                                                 │
         │  Nginx matches: location /api/ {                │
         │    proxy_pass http://backend-service.production │
         │                  .svc.cluster.local:5097        │
         │  }                                              │
         │                                                 │
         │  Nginx INTERNALLY forwards to backend:          │
         │  http://backend-service.production.svc          │
         │         .cluster.local:5097/api/products        │
         │                                                 │
         │◄── Backend processes request, returns JSON ──── │
         │                                                 │
         │  Nginx sends JSON back to browser               │
         │                                                 │
         │  ✅ NO CORS — browser only talked to Nginx      │
         │     (same origin throughout)                     │
```

### The CORS comparison table

| Scenario | Origin of page | API request URL | CORS needed? | Works? |
|---|---|---|---|---|
| **Dev (ng serve)** | `http://localhost:4200` | `http://localhost:5097/api/...` | ✅ Yes | ✅ (CORS configured) |
| **Prod WITHOUT Nginx proxy** | `http://<lb-url>` | `http://localhost:5097/api/...` | ✅ Yes | ❌ (wrong host + CORS) |
| **Prod WITHOUT Nginx proxy + public LB** | `http://<frontend-lb>` | `http://<backend-lb>/api/...` | ✅ Yes | ⚠️ (need CORS config) |
| **Prod WITH Nginx proxy** | `http://<lb-url>` | `http://<lb-url>/api/...` | ❌ No | ✅ (same origin) |

---

## 9. Summary — Why all this matters

### The three problems we solved

| # | Problem | Solution | File |
|---|---|---|---|
| 1 | Hardcoded `http://localhost:5097` in Angular | Use `isDevMode()` to switch URLs | `api-url.interceptor.ts` |
| 2 | Browser can't reach backend in production | Nginx reverse proxy forwards requests internally | `nginx.conf` |
| 3 | CORS errors in production | Browser talks to one origin — Nginx handles backend communication | `nginx.conf` (same as #2) |

### The files that changed

| File | Change |
|---|---|
| `Frontend/nginx.conf` | Added `location /api/` and `location /uploads/` reverse proxy blocks |
| `Frontend/src/app/core/interceptors/api-url.interceptor.ts` | Changed from hardcoded URL to `isDevMode() ? 'http://localhost:5097' : window.location.origin` |
| `Backend/InventoryManagement.API/Program.cs` | Made CORS origins configurable via `Cors:AllowedOrigins` env var |
| `k8s/application/backend-deployment.yaml` | Added `Cors__AllowedOrigins` environment variable |

### Key takeaway

**The Nginx reverse proxy is the bridge between the browser and the backend.** Without it:
- The browser would need to reach the backend's internal IP (impossible)
- OR the backend would need a public LoadBalancer (extra cost + security risk)
- AND we'd need complex CORS configuration for every environment

With it:
- One LoadBalancer for everything (cheaper, simpler)
- No CORS issues
- Backend stays private inside the cluster
- The user just opens a URL and the app works

---

**Related files:** [`nginx.conf`](nginx.conf) | [`api-url.interceptor.ts`](src/app/core/interceptors/api-url.interceptor.ts) | [`Program.cs`](../../Backend/InventoryManagement.API/Program.cs) | [`backend-deployment.yaml`](../../k8s/application/backend-deployment.yaml)
