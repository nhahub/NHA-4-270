# Phase 5 — Application Kubernetes Manifests: Complete Explanation

> **Target Audience:** Junior DevOps Team (assumes basic Kubernetes knowledge from Phases 1-2, but NO experience writing K8s manifests)
>
> **Goal:** Understand what every YAML file in `k8s/application/` does, how the application runs on EKS, how Kubernetes Services and Secrets work, and how this phase connects to the CI/CD pipeline from Phase 4.

---

## Table of Contents

1. [What is Phase 5?](#1-what-is-phase-5)
2. [Our Kubernetes Architecture](#2-our-kubernetes-architecture)
3. [File 1: namespace.yaml](#3-file-1-namespaceyaml)
4. [File 2: secrets.yaml](#4-file-2-secretsyaml)
5. [File 3: backend-deployment.yaml](#5-file-3-backend-deploymentyaml)
6. [File 4: backend-service.yaml](#6-file-4-backend-serviceyaml)
7. [File 5: frontend-deployment.yaml](#7-file-5-frontend-deploymentyaml)
8. [File 6: frontend-service.yaml](#8-file-6-frontend-serviceyaml)
9. [How Phase 5 connects to the Jenkinsfile](#9-how-phase-5-connects-to-the-jenkinsfile)
10. [End-to-End Data Flow](#10-end-to-end-data-flow)
11. [Troubleshooting Common Issues](#11-troubleshooting-common-issues)
12. [Review Questions](#12-review-questions)

---

## 1. What is Phase 5?

### The problem before Phase 5

After Phase 4, we had:
- ✅ EKS cluster with 2 worker nodes
- ✅ Jenkins running on Node 1 with full CI/CD pipeline
- ✅ Docker images pushed to DockerHub
- ❌ **No application running**

The CI/CD pipeline built images and pushed them to DockerHub, but there was nothing to **deploy** those images to. Phase 5 creates the Kubernetes resources that **run your application** on the cluster.

### What Phase 5 creates

| File | Resource | Purpose |
|---|---|---|
| `namespace.yaml` | Namespace | Isolates the app from Jenkins and system resources |
| `secrets.yaml` | Secret | Stores RDS password, JWT key (sensitive data) |
| `backend-deployment.yaml` | Deployment | Runs the .NET 8 API as pods |
| `backend-service.yaml` | Service (ClusterIP) | Internal communication to the backend |
| `frontend-deployment.yaml` | Deployment | Runs the Angular app as pods |
| `frontend-service.yaml` | Service (LoadBalancer) | Exposes the frontend to users |

---

## 2. Our Kubernetes Architecture

```
                                  ┌─────────────────────────────────────────────┐
                                  │              EKS Cluster                    │
                                  │                                             │
                                  │  Node 1 (role=tools)                        │
                                  │  ┌──────────────────────────┐               │
                                  │  │  Jenkins Pod             │               │
                                  │  │  ├── Jenkins master      │               │
                                  │  │  └── dind sidecar        │               │
                                  │  └──────────────────────────┘               │
                                  │                                             │
                                  │  Node 2 (role=production)                   │
                                  │  ┌──────────────────┐ ┌──────────────────┐  │
                                  │  │  Backend Pod 1   │ │  Backend Pod 2   │  │
                                  │  │  (.NET 8 API)    │ │  (.NET 8 API)    │  │
                                  │  └──────┬───────────┘ └──────┬───────────┘  │
                                  │         │                     │             │
                                  │  ┌──────▼─────────────────────▼───────────┐ │
                                  │  │  backend-service (ClusterIP)           │ │
                                  │  │  port 5097 (internal)                  │ │
                                  │  └────────────────────────────────────────┘ │
                                  │         ▲                                   │
                                  │         │ (HTTP requests)                   │
                                  │  ┌──────┴──────────────────────────────┐    │
                                  │  │  Frontend Pod 1  │ Frontend Pod 2   │    │
                                  │  │  (Nginx + Angular)                  │    │
                                  │  └──────┬──────────────────────────────┘    │
                                  │         │                                   │
                                  │  ┌──────▼──────────────────────────────┐    │
                                  │  │  frontend-service (LoadBalancer)    │    │
                                  │  │  port 80 (public)                   │    │
                                  │  └─────────────────────────────────────┘    │
                                  └─────────────────────────────────────────────┘
                                              │
                                              ▼
                                     ┌─────────────────┐
                                     │    RDS SQL      │
                                     │    Server       │
                                     │ (Private Subnet)│
                                     └─────────────────┘
```

### Key design decisions:

| Decision | Why |
|---|---|
| **2 replicas per app** | High availability — if one pod fails, the other keeps serving |
| **`nodeSelector: role=production`** | Both frontend and backend pods run on Node 2, keeping Jenkins isolated on Node 1 |
| **Backend Service = ClusterIP** | Only accessible from within the cluster (secure — no public API exposure) |
| **Frontend Service = LoadBalancer** | Publicly accessible so users can reach the Angular app |
| **Secrets stored separately** | Sensitive data (passwords, keys) are not hardcoded in deployment YAMLs |

---

## 3. File 1: namespace.yaml

```yaml
apiVersion: v1
kind: Namespace
metadata:
  name: production
  labels:
    environment: production
    tier: application
  annotations:
    description: "Production namespace for the Multi-Tenant Inventory SaaS Platform"
```

### What it does

Creates a **Namespace** called `production`. All application resources (pods, services, secrets) live inside this namespace.

### Why do we need a separate namespace?

| Namespace | Contains | Purpose |
|---|---|---|
| `kube-system` | Kubernetes system pods | Managed by AWS, don't touch |
| `jenkins` | Jenkins + dind | CI/CD tools |
| `production` | Frontend + Backend + Secrets | **Our application** |
| `default` | Anything without a namespace | Avoid putting things here |

Namespaces provide **isolation** — you can't accidentally `kubectl delete` the Jenkins pod while working on the application, and vice versa.

### Breaking it down:

| Line | What it means |
|---|---|
| `apiVersion: v1` | Core Kubernetes API (namespaces are a fundamental resource) |
| `kind: Namespace` | This YAML creates a namespace |
| `name: production` | The name of the namespace — all other Phase 5 files use `namespace: production` |
| `labels:` | Metadata for organization (optional but helpful) |
| `annotations:` | Additional metadata (optional but helpful for documentation) |

---

## 4. File 2: secrets.yaml

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: production
type: Opaque
stringData:
  db_connection_string: "Server=inventory-mgmt-sqlserver.c2fc20q44515.us-east-1.rds.amazonaws.com,1433;Database=InventoryManagementDb;User Id=admin;Password=YourSecurePassword123!;MultipleActiveResultSets=true;TrustServerCertificate=True;"
  jwt_key: "super_secret_key_long_enough_to_be_secure_256_bits_123456"
  jwt_issuer: "InventoryManagementAPI"
  jwt_audience: "InventoryManagementFrontend"
```

### What is a Kubernetes Secret?

A **Secret** is a Kubernetes object that stores sensitive data (passwords, API keys, connection strings) separately from the pod definitions. This means:

- You DON'T hardcode passwords in your deployment YAML
- You CAN change secrets without modifying the deployment (just update and re-apply)
- Secrets are stored securely in etcd (Kubernetes' database)

### What secrets do we store?

| Key | Value | Used by |
|---|---|---|
| `db_connection_string` | RDS SQL Server connection string | Backend deployment — connects to the database |
| `jwt_key` | Secret key for signing JWT tokens | Backend deployment — authenticates users |
| `jwt_issuer` | JWT token issuer name | Backend deployment — validates tokens |
| `jwt_audience` | JWT token audience name | Backend deployment — validates tokens |

### The connection string explained:

```
Server=inventory-mgmt-sqlserver.c2fc20q44515.us-east-1.rds.amazonaws.com,1433;
Database=InventoryManagementDb;
User Id=admin;
Password=YourSecurePassword123!;
MultipleActiveResultSets=true;
TrustServerCertificate=True;
```

| Part | Meaning |
|---|---|
| `Server=...amazonaws.com,1433` | RDS endpoint + port (from Terraform output) |
| `Database=InventoryManagementDb` | The database we created in Phase 1 |
| `User Id=admin` | The master username from our RDS configuration |
| `Password=...` | The password we passed as `rds_master_password` to Terraform |
| `TrustServerCertificate=True` | Required for SQL Server connections over TLS |

### Why `stringData` instead of `data`?

| Field | Input format | Output format |
|---|---|---|
| `data` | Base64-encoded (must encode yourself) | Base64 (opaque) |
| `stringData` | **Plain text** (Kubernetes encodes it for you) | Base64 (secure) |

We use `stringData` so we can write the secret values in plain text. Kubernetes automatically Base64-encodes them when storing.

### ⚠️ Important: You MUST update the RDS endpoint

The `Server=` value in `db_connection_string` contains a **placeholder RDS endpoint** from the original Terraform run. Every time you destroy and recreate, the RDS endpoint changes. After recreating, run:

```powershell
terraform output rds_endpoint
```

Then update `k8s/application/secrets.yaml` with the new endpoint. Then:

```powershell
kubectl apply -f k8s/application/secrets.yaml
```

---

## 5. File 3: backend-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend
  namespace: production
  labels:
    app: backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      nodeSelector:
        role: production
      containers:
        - name: backend
          image: mohamedelshahaby/inventory-backend:latest
          ports:
            - containerPort: 5097
          env:
            - name: ASPNETCORE_ENVIRONMENT
              value: "Production"
            - name: ASPNETCORE_URLS
              value: "http://+:5097"
            - name: ConnectionStrings__DefaultConnection
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: db_connection_string
            - name: Jwt__Key
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: jwt_key
            - name: Jwt__Issuer
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: jwt_issuer
            - name: Jwt__Audience
              valueFrom:
                secretKeyRef:
                  name: app-secrets
                  key: jwt_audience
          resources:
            requests:
              memory: "256Mi"
              cpu: "250m"
            limits:
              memory: "512Mi"
              cpu: "500m"
          livenessProbe:
            httpGet:
              path: /health
              port: 5097
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 5097
            initialDelaySeconds: 10
            periodSeconds: 5
```

### What is a Deployment?

A **Deployment** tells Kubernetes:
- Which Docker image to run
- How many copies (replicas) to run
- Which node to run on
- What environment variables to set
- How to check if the app is healthy

### Line-by-line breakdown:

#### Core configuration

| Line | What it does |
|---|---|
| `replicas: 2` | Run 2 identical pods. If one crashes, the other still serves requests |
| `matchLabels: app: backend` | The Deployment manages pods with the label `app: backend` |
| `template.metadata.labels` | Each pod gets the label `app: backend` so the Service can find them |

#### nodeSelector — runs on Node 2

```yaml
nodeSelector:
  role: production
```

This tells Kubernetes: "Only schedule this pod on a node that has the label `role=production`." Since we labeled one node as `role=tools` (for Jenkins) and the other as `role=production` (for the app), the backend always runs on the correct node.

**What happens if no node has `role=production`?**
The pod stays in `Pending` state indefinitely. This is why labeling nodes is an important step after recreating.

#### Image — from DockerHub

```yaml
image: mohamedelshahaby/inventory-backend:latest
```

This tells Kubernetes to pull the backend image from DockerHub. The `:latest` tag is a **placeholder** — the Jenkins pipeline (Phase 4) replaces it with the build number when deploying:

```
Jenkins does: sed -i "s|image: .*inventory-backend:.*|image: mohamedelshahaby/inventory-backend:42|g" ...
```

So after a pipeline run, the deployment uses a versioned image (e.g., `:42`), not `:latest`.

#### Environment variables from Secrets

```yaml
env:
  - name: ConnectionStrings__DefaultConnection
    valueFrom:
      secretKeyRef:
        name: app-secrets
        key: db_connection_string
```

This reads the `db_connection_string` value from the `app-secrets` Secret and sets it as the environment variable `ConnectionStrings__DefaultConnection`.

**Why double underscores (`__`)?**
ASP.NET Core maps environment variables to configuration using colons (`ConnectionStrings:DefaultConnection`). But Kubernetes doesn't allow colons in environment variable names. The double underscore `__` is the convention that .NET recognizes as a colon replacement.

#### Resource limits

```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

| Term | Meaning | What happens if exceeded |
|---|---|---|
| `requests` | Minimum guaranteed resources | Kubernetes only schedules the pod on a node with this much free capacity |
| `limits` | Maximum allowed resources | Pod is **throttled** (CPU) or **restarted** (memory) if it exceeds this |

#### Health probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5097
  initialDelaySeconds: 30
  periodSeconds: 10
```

| Probe | Purpose | If it fails |
|---|---|---|
| **Liveness** | "Is the app alive?" (not crashed) | Kubernetes restarts the container |
| **Readiness** | "Is the app ready to serve traffic?" | Kubernetes stops sending traffic to this pod |

Think of it like a hospital checkup:
- **Liveness** = checking if the patient has a pulse
- **Readiness** = checking if the patient can walk

---

## 6. File 4: backend-service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: production
  labels:
    app: backend
spec:
  selector:
    app: backend
  ports:
    - port: 5097
      targetPort: 5097
      protocol: TCP
      name: http-api
  type: ClusterIP
```

### What is a Service?

Pods in Kubernetes are **ephemeral** — they can be created, destroyed, or rescheduled at any time. Each time a pod starts, it gets a new IP address. A **Service** provides a stable IP address and DNS name that other pods can use to reach the backend, regardless of which specific pod is serving.

### Why ClusterIP?

| Service Type | Accessible from | Use case |
|---|---|---|
| **ClusterIP** (default) | Inside the cluster only | Backend API — only the frontend needs it |
| **NodePort** | External via node IP:port | Testing/debugging |
| **LoadBalancer** | External via a public IP | Frontend — users need to reach it |
| **ExternalName** | Via an external DNS name | External services |

The backend is `ClusterIP` because:
- Only the **frontend** needs to talk to the backend
- There's NO reason to expose the API to the internet
- Internal DNS name: `backend-service.production.svc.cluster.local:5097`

### How it routes traffic:

```
backend-service (ClusterIP: 10.100.0.5)
         │
         ├──► Pod 1 (10.244.0.10:5097)  ✓ Ready
         │
         └──► Pod 2 (10.244.0.11:5097)  ✓ Ready
```

The Service **load balances** between all pods that match `app: backend`.

---

## 7. File 5: frontend-deployment.yaml

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
  labels:
    app: frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      nodeSelector:
        role: production
      containers:
        - name: frontend
          image: mohamedelshahaby/inventory-frontend:latest
          ports:
            - containerPort: 80
          resources:
            requests:
              memory: "128Mi"
              cpu: "100m"
            limits:
              memory: "256Mi"
              cpu: "250m"
          livenessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 30
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /
              port: 80
            initialDelaySeconds: 5
            periodSeconds: 5
```

### How it differs from the backend:

| Aspect | Backend | Frontend |
|---|---|---|
| **Image** | `inventory-backend` | `inventory-frontend` |
| **Port** | 5097 (.NET) | 80 (Nginx) |
| **CPU request** | 250m | 100m |
| **Memory request** | 256Mi | 128Mi |
| **Secrets needed** | Yes (DB, JWT) | No (static files) |
| **Health check path** | `/health` | `/` (root) |

### What's inside the frontend container?

The Docker image contains:
1. **Nginx** — a lightweight web server that serves static files AND proxies API requests
2. **Compiled Angular files** — HTML, CSS, JavaScript
3. **nginx.conf** — configuration for SPA routing AND reverse proxy for the backend

### How the frontend communicates with the backend (No CORS issues):

Instead of making API calls directly from the browser to the backend (which would require CORS), we use Nginx as a **reverse proxy**:

```
Browser                  Nginx (same host)            Backend (ClusterIP)
   │                          │                              │
   │── GET /api/products ────►│                              │
   │                          │── proxy_pass ───────────────►│
   │                          │   http://backend-service     │
   │                          │   .production.svc.cluster    │
   │                          │   .local:5097/api/products   │
   │                          │◄── JSON response ────────────│
   │◄── JSON response ────────│                              │
```

**Why this is better than CORS:**

| Approach | Problem | Solution |
|---|---|---|
| Browser → Backend directly | CORS errors (different origins) | Requires CORS headers, complex |
| **Browser → Nginx → Backend** | ✅ No CORS — same origin | Nginx proxies internally, browser sees same host |

The `nginx.conf` reverse proxy configuration:

```nginx
location /api/ {
    proxy_pass http://backend-service.production.svc.cluster.local:5097;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    ...
}

location /uploads/ {
    proxy_pass http://backend-service.production.svc.cluster.local:5097;
    ...
}
```

**How it works step by step:**

1. Angular app sends a request to `/api/products` (relative URL)
2. The browser sends it to `http://<frontend-lb-url>/api/products`
3. Nginx receives it and matches the `/api/` location block
4. Nginx proxies (forwards) the request to `http://backend-service.production.svc.cluster.local:5097/api/products`
5. The backend processes the request and returns JSON
6. Nginx sends the JSON back to the browser
7. **The browser sees only one origin** — no CORS needed!

### How the Angular app switches between development and production:

The `api-url.interceptor.ts` uses Angular's `isDevMode()` to determine the base URL:

```typescript
const apiBaseUrl = isDevMode()
  ? 'http://localhost:5097'           // ng serve (localhost)
  : window.location.origin;           // Production (same as Nginx)
```

| Mode | `isDevMode()` | API Base URL | How requests work |
|---|---|---|---|
| **Development** (`ng serve`) | `true` | `http://localhost:5097` | Browser calls backend directly (needs CORS) |
| **Production** (Nginx in K8s) | `false` | `window.location.origin` | Browser calls same origin, Nginx proxies to backend |

**Development setup:**
- Angular runs on `http://localhost:4200` (`ng serve`)
- Backend runs on `http://localhost:5097`
- The interceptor adds `http://localhost:5097` prefix → direct browser-to-backend calls
- CORS policy (`backend Program.cs`) must allow `http://localhost:4200` → handled by `Cors:AllowedOrigins`

**Production setup (Kubernetes):**
- Angular runs behind Nginx on the LoadBalancer URL
- The interceptor uses `window.location.origin` (the LB URL) as the prefix
- Requests go to `http://<lb>/api/products` → Nginx catches `/api/` → proxies to backend service
- **No CORS needed** because everything is same origin

### CORS configuration (only needed for development):

The backend's CORS policy is now configurable via environment variable:

```csharp
var corsOrigins = builder.Configuration["Cors:AllowedOrigins"] ?? "http://localhost:4200";
```

In the Kubernetes deployment, we set this to `http://localhost:4200` for development compatibility. In production, CORS is not triggered because Nginx handles all cross-origin concerns internally.

---

## 8. File 6: frontend-service.yaml

```yaml
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: production
  labels:
    app: frontend
spec:
  selector:
    app: frontend
  ports:
    - port: 80
      targetPort: 80
      protocol: TCP
      name: http
  type: LoadBalancer
```

### Why LoadBalancer?

The `LoadBalancer` type tells AWS to provision a **real Application Load Balancer (ALB)** in front of your frontend pods. This gives you:

1. **A public IP** — users can access the app from anywhere
2. **Health checks** — the ALB checks if your pods are healthy before routing traffic
3. **Auto-scaling** — the ALB automatically balances traffic across pods

### What happens when you apply this:

```
1. kubectl apply → sends YAML to EKS API
2. EKS detects LoadBalancer type
3. AWS Controller provisions an ALB in your AWS account
4. ALB gets a DNS name: a5b2c3d4e5f6-123456789.us-east-1.elb.amazonaws.com
5. Traffic flows:

   User ──► http://<ALB-DNS> ──► frontend-service ──► frontend pod ──► backend-service ──► backend pod ──► RDS
```

---

## 9. How Phase 5 connects to the Jenkinsfile

The Jenkins pipeline from Phase 4 is already forward-compatible with Phase 5. Here's how:

### Before Phase 5:

```groovy
stage('Deploy to Kubernetes') {
    steps {
        script {
            sh '''
                if [ -d k8s/application ]; then
                    sed -i "s|image: .*inventory-backend:.*|image: ${BACKEND_IMAGE}:${IMAGE_TAG}|g" k8s/application/*.yaml
                    sed -i "s|image: .*inventory-frontend:.*|image: ${FRONTEND_IMAGE}:${IMAGE_TAG}|g" k8s/application/*.yaml
                    kubectl apply -f k8s/application/
                else
                    echo "k8s/application/ directory not found — skipping (Phase 5 — create it first)"
                fi
            '''
        }
    }
}
```

### After Phase 5:

Now that `k8s/application/` exists, this stage will:

| Step | What Jenkins does |
|---|---|
| **Check** | `if [ -d k8s/application/ ]` → ✅ exists |
| **Update images** | `sed` replaces `:latest` with `:${BUILD_NUMBER}` in ALL YAML files |
| **Apply** | `kubectl apply -f k8s/application/` creates/updates all resources |
| **Rolling update** | Kubernetes gradually replaces old pods with new image (zero downtime) |

### The `sed` substitution in action:

```
Before kubectl apply:
  image: mohamedelshahaby/inventory-backend:latest       ← in Git

After sed (BUILD_NUMBER=42):
  image: mohamedelshahaby/inventory-backend:42           ← deployed to K8s

Also pushed to DockerHub:
  mohamedelshahaby/inventory-backend:42
  mohamedelshahaby/inventory-backend:latest
```

**No changes to the Jenkinsfile were needed.** The pipeline was designed to automatically detect Phase 5.

---

## 10. End-to-End Data Flow

### Complete request flow:

```
                                  ┌──────────────────────┐
                                  │     GitHub Repo      │
                                  │  Frontend, Backend,  │
                                  │  Jenkinsfile, K8s YAML│
                                  └─────────┬────────────┘
                                            │ push triggers
                                            ▼
                                  ┌──────────────────────┐
                                  │   Jenkins Pipeline   │
                                  │                      │
                                  │ 1. Checkout code     │
                                  │ 2. Build Backend     │
                                  │ 3. Build Frontend    │
                                  │ 4. Push to DockerHub │
                                  │ 5. kubectl apply     │
                                  └─────────┬────────────┘
                                            │
                     ┌──────────────────────┼──────────────────────┐
                     │                      ▼                      │
                     │           ┌──────────────────────┐          │
                     │           │     DockerHub        │          │
                     │           │  inventory-backend:42│          │
                     │           │  inventory-frontend:42│         │
                     │           └──────────────────────┘          │
                     │                                             │
                     ▼                                             ▼
         ┌─────────────────────────┐           ┌─────────────────────────┐
         │      EKS Cluster        │           │    User's Browser       │
         │                         │           │                         │
         │  ┌───────────────────┐  │           │  http://<ALB-DNS>/      │
         │  │  Jenkins Node 1   │  │           └───────────┬─────────────┘
         │  │  (role=tools)     │  │                       │
         │  │  - Jenkins + dind │  │                       │
         │  └───────────────────┘  │                       ▼
         │                         │           ┌─────────────────────────┐
         │  ┌───────────────────┐  │           │   AWS Load Balancer     │
         │  │ Production Node 2 │  │           │  (frontend-service)     │
         │  │ (role=production) │  │           └───────────┬─────────────┘
         │  │                   │  │                       │
         │  │  ┌───────────┐    │  │                       ▼
         │  │  │ Frontend  │────┼──┼────►  ┌─────────────────────────┐
         │  │  │ Pods x2   │    │  │       │   frontend pod (Nginx)  │
         │  │  └─────┬─────┘    │  │       │   Serves Angular        │
         │  │        │          │  │       └───────────┬─────────────┘
         │  │  ┌─────▼─────┐    │  │                   │
         │  │  │ Backend   │────┼──┼───────────────────►  backend-service
         │  │  │ Pods x2   │    │  │                   │
         │  │  └─────┬─────┘    │  │                   ▼
         │  └───────────────────┘  │           ┌─────────────────────────┐
         └─────────────────────────┘           │   backend pod (.NET)    │
                                               │   /api/products, etc.   │
                                               └───────────┬─────────────┘
                                                           │
                                                           ▼
                                               ┌─────────────────────────┐
                                               │   RDS SQL Server        │
                                               │   (Private Subnet)      │
                                               │   InventoryManagementDb │
                                               └─────────────────────────┘
```

### What happens on every code push:

1. **Developer commits** to GitHub (`git push`)
2. **Webhook triggers** Jenkins pipeline
3. **Pipeline runs** (checkout → build → test → push → deploy)
4. **New images** are on DockerHub (`inventory-backend:43`, `:latest`)
5. **Kubernetes updates** pods with the new images (rolling update)
6. **User refreshes** → sees the new version

---

## 11. Troubleshooting Common Issues

### Issue 1: Pod stuck in "Pending"

```
kubectl get pods -n production
NAME                       READY   STATUS    RESTARTS   AGE
backend-7d9f8c6b4-x5k2h   0/1     Pending   0          2m
```

**Cause:** The node doesn't have the `role=production` label.

**Fix:**
```powershell
# Find the node that should be production
kubectl get nodes

# Label it
kubectl label node <node-name> role=production

# The pod will start within a few seconds
```

### Issue 2: Pod in "CrashLoopBackOff"

```
kubectl get pods -n production
NAME                       READY   STATUS             RESTARTS   AGE
backend-7d9f8c6b4-x5k2h   0/1     CrashLoopBackOff   3          1m
```

**Cause:** The application starts but immediately crashes. Common reasons:
- Wrong database endpoint
- Wrong database password
- Database doesn't exist yet

**Fix:**
```powershell
# Check the logs
kubectl logs -n production <pod-name>

# If it's a connection string issue, update secrets.yaml and re-apply
# Then delete the pod (Kubernetes will recreate it with the new secret)
kubectl delete pod -n production <pod-name>
```

### Issue 3: Pod in "ImagePullBackOff"

```
kubectl get pods -n production
NAME                       READY   STATUS             RESTARTS   AGE
frontend-5d4f8c6b4-y7k2h  0/1     ImagePullBackOff   0          1m
```

**Cause:** The Docker image doesn't exist on DockerHub.

**Fix:** Run the Jenkins pipeline first to build and push the images:
```powershell
# In Jenkins, click "Build Now" on the pipeline job
# Wait for it to complete (all stages green)
# Then check the pods again
```

### Issue 4: Frontend loads but shows blank page or API errors

**Cause:** The Angular app can't reach the backend API.

**Check:**
```powershell
# 1. Are backend pods running?
kubectl get pods -n production

# 2. Is the backend service configured correctly?
kubectl get svc -n production backend-service

# 3. Can you reach the backend from inside the cluster?
kubectl run test-pod --image=curlimages/curl:latest --rm -it --restart=Never -- curl -s http://backend-service.production.svc.cluster.local:5097/health

# 4. Check frontend logs for CORS errors
kubectl logs -n production -l app=frontend
```

### Issue 5: LoadBalancer doesn't get an external IP

```
kubectl get svc -n production frontend-service
NAME               TYPE           CLUSTER-IP      EXTERNAL-IP   PORT(S)        AGE
frontend-service   LoadBalancer   10.100.0.10     <pending>     80:30001/TCP   2m
```

**Cause:** AWS is still provisioning the LoadBalancer (can take 1-2 minutes).

**Fix:** Wait and check again:
```powershell
kubectl get svc -n production frontend-service -w
```

If it stays `<pending>` for more than 5 minutes, check AWS Console → EC2 → Load Balancers.

### Issue 6: Need to update the RDS endpoint after recreating

```powershell
# 1. Get the new endpoint
terraform output rds_endpoint

# 2. Update the secret
# Edit k8s/application/secrets.yaml and change the Server= value

# 3. Re-apply
kubectl apply -f k8s/application/secrets.yaml

# 4. Restart the backend pods to pick up the new secret
kubectl delete pod -n production -l app=backend
```

---

## 12. Review Questions

1. **What is the difference between a Deployment and a Service?** (Deployment runs pods, Service provides stable networking)
2. **Why is the backend Service type `ClusterIP` and not `LoadBalancer`?** (Backend should only be accessible from within the cluster — no public API exposure)
3. **What does `nodeSelector: role: production` do?** (Schedules pods only on nodes with the label `role=production` — Node 2)
4. **What happens if no node has the label `role=production`?** (Pods stay in `Pending` state)
5. **How does the Jenkins pipeline inject build numbers into the deployment?** (Using `sed` to replace `:latest` with `:${BUILD_NUMBER}` before `kubectl apply`)
6. **What is a Kubernetes Secret and why do we use `stringData` instead of `data`?** (Secret stores sensitive data; `stringData` allows plain text input, Kubernetes encodes it)
7. **How does the frontend find the backend?** (Nginx reverse proxy — browser sends requests to the same origin, Nginx proxies `/api/` and `/uploads/` to `backend-service.production.svc.cluster.local:5097` internally)
8. **How does the app handle CORS in production?** (No CORS needed — Nginx proxies API requests, so the browser sees only one origin)
9. **What does `isDevMode()` do in the Angular interceptor?** (Switches API base URL from `http://localhost:5097` in dev to `window.location.origin` in production)
10. **What is the difference between liveness and readiness probes?** (Liveness = restart if crashed; Readiness = stop sending traffic if not ready)
11. **Why do we have 2 replicas for each deployment?** (High availability — if one pod fails, the other still serves traffic)
12. **After destroying and recreating, what needs to be updated in Phase 5?** (RDS endpoint in `secrets.yaml`)
13. **What does `kubectl apply -f k8s/application/` do?** (Creates or updates all resources in the directory — namespace, secrets, deployments, and services)
14. **How does the LoadBalancer type work in Kubernetes on AWS?** (EKS provisions an AWS Application Load Balancer with a public DNS name)

---

## Summary

Phase 5 completes the DevOps lifecycle by deploying the actual application onto the EKS cluster. The key files are:

| File | What it creates | Why it matters |
|---|---|---|
| `namespace.yaml` | Production namespace | Isolation from Jenkins and system resources |
| `secrets.yaml` | Database + JWT secrets | Secure configuration without hardcoding |
| `backend-deployment.yaml` | .NET 8 API (2 replicas) | Runs the backend on Node 2 |
| `backend-service.yaml` | Internal ClusterIP | Frontend reaches backend via internal DNS |
| `frontend-deployment.yaml` | Angular app (2 replicas) | Runs the frontend on Node 2 |
| `frontend-service.yaml` | Public LoadBalancer | Users access the app from the internet |

**No changes to the Jenkinsfile were needed** — the pipeline was already forward-compatible with Phase 5.

---

**Previous phases:** [Phase 1 — Terraform](../../terraform/PHASE1_EXPLANATION.md) | [Phase 2 — K8s Jenkins](../jenkins/PHASE2_EXPLANATION.md) | [Phase 3 — Dockerfiles](../../PHASE3_EXPLANATION.md) | [Phase 4 — Jenkins Pipeline](../../PHASE4_EXPLANATION.md)
