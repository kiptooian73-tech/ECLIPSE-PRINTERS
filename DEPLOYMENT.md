# Deployment Guide — RubberStamp Shop

## Overview

RubberStamp Shop is a Node.js + Express app that runs on any platform with Node.js 18+. This guide covers popular deployment options.

## Prerequisites

- Node.js 18+
- Git (for most platforms)
- `.env` file configured with credentials

## Local Development

```bash
npm install
npm start
# Visit http://localhost:3000
```

---

## Deployment Options

### 1. Heroku (Easiest for beginners)

**Setup:**

1. Install Heroku CLI from https://devcenter.heroku.com/articles/heroku-cli
2. Login: `heroku login`
3. Create app: `heroku create your-app-name`
4. Add environment variables:
   ```bash
   heroku config:set MERCHANT_WHATSAPP=254741296101
   heroku config:set ADMIN_TOKEN=your-secret-token
   heroku config:set ADMIN_EMAIL=your@email.com
   heroku config:set SMTP_HOST=smtp.gmail.com
   heroku config:set SMTP_USER=your-email@gmail.com
   heroku config:set SMTP_PASSWORD=your-app-password
   ```
5. Deploy:
   ```bash
   git push heroku main
   ```

**Notes:**
- Heroku stores orders in ephemeral storage (lost on app restart)
- Add MongoDB add-on for persistent storage: `heroku addons:create mongolab:sandbox`
- Custom domain: `heroku domains:add yourdomain.com`

**Costs:** Free tier available (limited); paid plans from $5/month

---

### 2. Railway.app (Recommended)

**Setup:**

1. Create account at https://railway.app
2. Connect GitHub repo or create new project
3. Add Node.js service
4. Set environment variables in Railway dashboard
5. Deploy automatically on push

**Environment Variables:**
```
PORT=3000
MERCHANT_WHATSAPP=254741296101
ADMIN_TOKEN=your-secret-token
ADMIN_EMAIL=your@email.com
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Optional:** Add PostgreSQL or MongoDB for persistent order storage

**Costs:** $5/month free credit; pay-as-you-go after

---

### 3. Fly.io

**Setup:**

1. Create account at https://fly.io
2. Install CLI: `curl -L https://fly.io/install.sh | sh`
3. Create `fly.toml`:
   ```toml
   app = "rubberstamp-shop"
   
   [build]
   builder = "heroku"
   
   [env]
   PORT = "3000"
   
   [[services]]
   ports = [{ handlers = ["http"], port = 80 }, { handlers = ["tls", "http"], port = 443 }]
   ```
4. Deploy: `fly deploy`
5. Set secrets:
   ```bash
   fly secrets set MERCHANT_WHATSAPP=254741296101
   fly secrets set ADMIN_TOKEN=your-token
   ```

**Costs:** Free tier (3 shared-cpu VMs); paid plans from $3/month

---

### 4. DigitalOcean (VPS)

**Setup:**

1. Create Droplet (Ubuntu 22.04, $5/month)
2. SSH into server: `ssh root@your_ip`
3. Install Node.js:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt install -y nodejs
   ```
4. Clone repo:
   ```bash
   git clone https://github.com/your-user/rubberstamp-shop.git
   cd rubberstamp-shop
   ```
5. Install dependencies: `npm install`
6. Create `.env` file with credentials
7. Setup PM2 (keep app running):
   ```bash
   sudo npm install -g pm2
   pm2 start server.js --name "rubberstamp-shop"
   pm2 startup
   pm2 save
   ```
8. Setup Nginx reverse proxy:
   ```bash
   sudo apt install nginx
   sudo nano /etc/nginx/sites-available/default
   ```
   Add:
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       location / {
           proxy_pass http://localhost:3000;
       }
   }
   ```
9. Enable HTTPS:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx
   ```

**Costs:** $5/month for Droplet

---

### 5. AWS Elastic Beanstalk

**Setup:**

1. Install AWS CLI & EB CLI
2. Create `.ebextensions/nodecommand.config`:
   ```yaml
   option_settings:
     aws:elasticbeanstalk:container:nodejs:
       NodeCommand: "npm start"
   ```
3. Deploy:
   ```bash
   eb create rubberstamp-shop-env
   eb deploy
   eb setenv MERCHANT_WHATSAPP=254741296101
   ```

**Costs:** Free tier for 12 months; then ~$5-10/month

---

### 6. Docker Deployment

**Create `Dockerfile`:**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

**Build & run locally:**

```bash
docker build -t rubberstamp-shop .
docker run -p 3000:3000 -e MERCHANT_WHATSAPP=254741296101 rubberstamp-shop
```

**Deploy to AWS ECS, Google Cloud Run, or any container platform**

---

## Persistent Data Storage

### Option A: JSON File (Current - Good for small sites)

Orders stored in `orders/orders.json`. 

**Backup:**
```bash
cp orders/orders.json orders/orders-$(date +%Y%m%d-%H%M%S).json
```

**Limitations:**
- Works up to ~1000 orders
- Not suitable for distributed deployments (multiple servers)

### Option B: MongoDB (Recommended for production)

Update `server.js` to use MongoDB instead of JSON:

```javascript
const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    id: String,
    name: String,
    phone: String,
    address: String,
    items: Array,
    total: Number,
    timestamp: Date,
    status: String
});

const Order = mongoose.model('Order', orderSchema);

// Replace saveOrders with:
async function saveOrder(order) {
    await Order.create(order);
}
```

**Services with MongoDB:**
- MongoDB Atlas (free tier 512MB)
- Railway (add-on)
- AWS DocumentDB
- Google Cloud MongoDB

---

## Performance Optimization

### Enable Caching

```javascript
// server.js
app.use((req, res, next) => {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    next();
});
```

### Compress responses

```bash
npm install compression
```

```javascript
const compression = require('compression');
app.use(compression());
```

### CDN for images

- Cloudflare (free tier)
- CloudFront (AWS)
- Bunny CDN

---

## Monitoring & Logging

### Free Options

- **Heroku Logs:** `heroku logs --tail`
- **Railway Logs:** Built-in dashboard
- **PM2 Logs:** `pm2 logs`
- **Sentry:** Error tracking (https://sentry.io)

### Production Monitoring

- New Relic
- DataDog
- Elastic/ELK Stack

---

## Custom Domain Setup

### Namecheap / GoDaddy

1. Point domain nameservers to your hosting provider
2. Or use CNAME/A records:
   - For Heroku: Add CNAME to `[your-app].herokuapp.com`
   - For Railway/Fly.io: Use provided IP/domain

### Free SSL Certificate

- Let's Encrypt (most platforms include this)
- AWS Certificate Manager (free with AWS)

---

## Environment Variables Checklist

```
✅ PORT=3000
✅ MERCHANT_WHATSAPP=254741296101 (no +)
✅ ADMIN_TOKEN=strong-random-token
✅ ADMIN_EMAIL=your@email.com
✅ SMTP_HOST=smtp.gmail.com (or your provider)
✅ SMTP_PORT=587
✅ SMTP_USER=your@gmail.com
✅ SMTP_PASSWORD=app-specific-password
✅ TWILIO_ACCOUNT_SID=your-sid (optional)
✅ TWILIO_AUTH_TOKEN=your-token (optional)
✅ TWILIO_WHATSAPP_NUMBER=+254700000000 (optional)
```

---

## Quick Deployment Comparison

| Platform | Cost | Setup Time | Scalability | Data Backup |
|----------|------|-----------|-------------|------------|
| Heroku | Free → $7/mo | 5 min | Good | Ephemeral |
| Railway | Free credit → $5/mo | 3 min | Good | DB add-on |
| Fly.io | Free → $3/mo | 5 min | Excellent | DB add-on |
| DigitalOcean | $5/mo | 15 min | Excellent | Manual |
| AWS | Free → $5/mo | 20 min | Excellent | RDS add-on |
| VPS + Nginx | $5-10/mo | 30 min | Very good | Manual |

---

## Recommended for Beginners

**Railway.app** — Best balance of ease and features:
- Auto-deploy from GitHub
- Free $5 credit
- Built-in database add-ons
- Easy environment setup
- Custom domain support

**For maximum simplicity with backups:**
1. Deploy to Railway
2. Add PostgreSQL for persistent orders
3. Use their backup features
4. Monitor via dashboard

---

## Support

- Railway Docs: https://railway.app/docs
- Heroku Docs: https://devcenter.heroku.com
- Fly.io Docs: https://fly.io/docs
- DigitalOcean: https://www.digitalocean.com/docs

