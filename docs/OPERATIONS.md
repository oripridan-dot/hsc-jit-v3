# Operations & Deployment Guide

Comprehensive guide for deploying and operating Halilit Support Center v3.7 in production.

## Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`pnpm test`)
- [ ] No TypeScript errors (`pnpm typecheck`)
- [ ] Build succeeds (`pnpm build`)
- [ ] Performance benchmarks met (<50ms search, <2s load)
- [ ] Security scan completed
- [ ] Documentation updated
- [ ] Version number bumped
- [ ] Changelog updated
- [ ] Staging environment tested

### Build for Production
```bash
cd frontend
pnpm install
pnpm build
```

**Output**: `frontend/dist/` directory ready for deployment

### Deploy to Static Host
```bash
# Upload dist/ to web server
# Examples:
# - AWS S3 + CloudFront
# - Netlify
# - Vercel
# - GitHub Pages
# - Self-hosted Apache/Nginx
```

## Production Configuration

### Environment Variables
```bash
# .env.production
VITE_API_URL=https://api.example.com  # Optional backend
VITE_ANALYTICS_ID=your-tracking-id    # For analytics
```

### Web Server Configuration

#### Nginx
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/hsc-jit-v3/dist;

    # Enable compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache static assets
    location /assets {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Route all requests to index.html for SPA
    location / {
        try_files $uri $uri/ /index.html;
        expires -1;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

#### Apache
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    DocumentRoot /var/www/hsc-jit-v3/dist

    # Enable mod_rewrite
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /

        # SPA routing
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule ^ index.html [QSA,L]
    </IfModule>

    # Security headers
    Header set X-Content-Type-Options "nosniff"
    Header set X-Frame-Options "SAMEORIGIN"
    Header set X-XSS-Protection "1; mode=block"

    # Cache control
    <FilesMatch "\.(js|css)$">
        Header set Cache-Control "max-age=31536000, immutable"
    </FilesMatch>

    # Compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/plain text/html text/xml
        AddOutputFilterByType DEFLATE text/css text/javascript
        AddOutputFilterByType DEFLATE application/json application/javascript
    </IfModule>
</VirtualHost>
```

## Monitoring & Health Checks

### Health Check Endpoint
```typescript
// Monitor: App loads and data accessible
GET /
Response: 200 OK
Load: <2 seconds
JSON data: Available
```

### Key Metrics to Monitor
| Metric | Threshold | Action |
|--------|-----------|--------|
| Page Load (P95) | <2s | Alert if >3s |
| Search Latency | <50ms | Alert if >100ms |
| Error Rate | <0.1% | Alert if >1% |
| CPU Usage | <50% | Alert if >80% |
| Memory | <512MB | Alert if >1GB |
| Disk Space | <80% full | Alert if >90% |

### Analytics Events
- Page view (app loads)
- Product viewed (product selected)
- Search performed (query entered)
- Tab changed (user clicks tab)
- Media played (video/audio started)

## Troubleshooting

### App Not Loading
```bash
# 1. Check server is running
curl http://localhost:5175

# 2. Check browser console for errors
# Open DevTools → Console tab

# 3. Check network requests
# DevTools → Network tab
# Look for failed JSON requests

# 4. Verify JSON files exist
ls -la frontend/public/data/
ls -la frontend/public/data/catalogs_brand/
```

### Search Not Working
```bash
# 1. Check Fuse.js initialization
console.log('Fuse:', window.Fuse);

# 2. Verify JSON data loaded
const catalog = await fetch('/data/catalogs_brand/roland_catalog.json');
console.log(await catalog.json());

# 3. Check search configuration
grep -n "threshold" frontend/src/lib/instantSearch.ts
```

### Products Not Showing
```bash
# 1. Check product data structure
cat frontend/public/data/catalogs_brand/roland_catalog.json | jq '.products[0]'

# 2. Verify hierarchy creation
// In Navigator.tsx, check buildHierarchyFromProducts()
console.log('Hierarchy:', hierarchy);

# 3. Check store state
// In React DevTools, inspect navigationStore
```

### Performance Issues
```bash
# 1. Check bundle size
ls -lh frontend/dist/assets/

# 2. Check network waterfall
# DevTools → Network tab
# Look for slow requests

# 3. Profile JavaScript
# DevTools → Performance tab
# Record and analyze flamechart

# 4. Check memory usage
# DevTools → Memory tab
# Look for memory leaks
```

## Scaling Strategies

### Current Setup
- **Products**: 29 (Roland only)
- **Users**: 1,000 concurrent (static site)
- **Throughput**: Unlimited (static files)

### Scaling to 1,000+ Products
```bash
# Strategy 1: Split JSON by category
frontend/public/data/catalogs_brand/
  ├── roland_synthesizers.json
  ├── roland_keyboards.json
  ├── roland_drums.json
  └── index.json (references all)

# Strategy 2: Index optimization
- Reduce Fuse.js search scope
- Pre-filter before search
- Implement pagination
```

### Scaling to Multi-Brand
```bash
# Current framework supports:
frontend/public/data/catalogs_brand/
  ├── roland.json
  ├── yamaha.json
  ├── korg.json
  ├── nord.json
  └── moog.json

# Update catalogLoader to handle brand selection
```

### Scaling to Backend
```typescript
// Implement FastAPI backend
// Endpoints:
// GET /api/products
// GET /api/products/:id
// GET /api/search?q=...
// GET /api/products/:id/media

// Update catalogLoader.ts:
const loadBrand = async (brand) => {
  const response = await fetch(`/api/products?brand=${brand}`);
  return response.json();
};
```

## Security Hardening

### Content Security Policy
```html
<!-- In index.html -->
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: https:;
  media-src 'self' https:;
  connect-src 'self' https:;
">
```

### HTTPS Enforcement
```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
}
```

### Security Headers
```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: SAMEORIGIN
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
```

## Backup & Recovery

### What to Backup
- `frontend/public/data/` - Product catalogs
- `frontend/dist/` - Built application
- Configuration files
- Environment files (.env.production)

### Backup Strategy
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/hsc-jit-v3"
DATE=$(date +%Y%m%d)

cp -r /var/www/hsc-jit-v3/dist "$BACKUP_DIR/dist_$DATE"
cp -r /var/www/hsc-jit-v3/data "$BACKUP_DIR/data_$DATE"

# Keep last 30 days
find "$BACKUP_DIR" -mtime +30 -delete
```

### Recovery Procedure
```bash
# 1. Stop web server
sudo systemctl stop nginx

# 2. Restore from backup
cp -r /backups/hsc-jit-v3/dist_YYYYMMDD /var/www/hsc-jit-v3/dist

# 3. Verify file integrity
ls -la /var/www/hsc-jit-v3/dist/

# 4. Start web server
sudo systemctl start nginx

# 5. Verify app is running
curl http://localhost/
```

## Logging & Monitoring

### Application Logs
```bash
# Monitor web server logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log

# Or on Apache:
tail -f /var/log/apache2/access.log
tail -f /var/log/apache2/error.log
```

### Analytics
```typescript
// Send events to analytics service
fetch('/api/analytics', {
  method: 'POST',
  body: JSON.stringify({
    event: 'product_viewed',
    productId: 'roland-tr-808',
    timestamp: new Date().toISOString(),
  })
});
```

## Rollback Procedure

```bash
# If new version has issues:

# 1. Identify previous stable version
ls -lt /backups/hsc-jit-v3/dist_*/

# 2. Stop current deployment
sudo systemctl stop nginx

# 3. Restore previous version
cp -r /backups/hsc-jit-v3/dist_20260118 /var/www/hsc-jit-v3/dist

# 4. Restart web server
sudo systemctl start nginx

# 5. Verify rollback
curl http://localhost/
tail -f /var/log/nginx/access.log
```

## Version Management

### Versioning Scheme
- Major.Minor.Patch (e.g., 3.7.0)
- Update in:
  - `frontend/package.json` (version field)
  - `docs/OPERATIONS.md` (Last Updated)
  - `README.md` (Version badge)

### Release Process
```bash
# 1. Update version number
npm version patch  # 3.7.0 → 3.7.1

# 2. Run tests
pnpm test

# 3. Build
pnpm build

# 4. Tag release
git tag -a v3.7.1 -m "Release 3.7.1"

# 5. Push to GitHub
git push origin main
git push origin v3.7.1

# 6. Deploy to production
./deploy.sh
```

---

**Last Updated**: January 19, 2026  
**Version**: 3.7 Mission Control  
**Status**: Production Ready
