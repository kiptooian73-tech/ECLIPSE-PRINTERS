# RubberStamp Shop

A full-featured e-commerce site for a rubber stamp business with WhatsApp checkout, order storage, and admin dashboard.

**📖 Documentation:**
- [Testing Guide](TESTING.md) — Comprehensive end-to-end testing scenarios
- [Deployment Guide](DEPLOYMENT.md) — Deploy to Heroku, Railway, AWS, DigitalOcean, and more

## Quick Start

### Static Mode (Development)

1. Open `index.html` in your browser.
2. Or serve with a simple HTTP server:

```bash
python -m http.server 8000
# then open http://localhost:8000
```

### Server Mode (Production)

With backend order storage and admin notifications:

```bash
npm install
cp .env.example .env
# Edit .env with your WhatsApp number and email settings
npm start
# Visit http://localhost:3000
```

## Features

**WhatsApp Checkout (KES)**
- Customers add items to cart and fill in name, phone, address.
- "Buy via WhatsApp" sends a pre-filled message to your merchant number.
- Orders automatically logged and admin notified via email.

**Admin Dashboard**
- Visit `/admin.html` to view all orders.
- Log in with `ADMIN_TOKEN` from `.env`.
- See customer details, items, and order status.

**Order Storage**
- Orders saved to `orders/orders.json`.
- Backup this file regularly.

## Configuration

Copy `.env.example` to `.env` and update:

```bash
MERCHANT_WHATSAPP=254741296101      # Your WhatsApp number (no +)
ADMIN_EMAIL=your-email@gmail.com    # Admin email for notifications
ADMIN_TOKEN=your-secret-token       # Token to access /admin.html
SMTP_HOST=smtp.gmail.com
SMTP_USER=your-gmail@gmail.com
SMTP_PASSWORD=your-app-password     # Gmail App Password

# Optional: Twilio for WhatsApp order notifications
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_WHATSAPP_NUMBER=+254700000000
```

### Email Setup (Gmail)
1. Enable 2-Step Verification
2. Generate an App Password at https://myaccount.google.com/apppasswords
3. Use the 16-character password in `.env`

### WhatsApp Order Notifications (Twilio)
1. Sign up at https://www.twilio.com/console
2. Get your Account SID and Auth Token
3. Request a WhatsApp Sender Number (or use the sandbox number for testing)
4. Add to `.env`:
   - `TWILIO_ACCOUNT_SID` — from Twilio Console
   - `TWILIO_AUTH_TOKEN` — from Twilio Console
   - `TWILIO_WHATSAPP_NUMBER` — your approved sender (e.g., `+254700000000`)

When enabled, orders will automatically be sent to your merchant WhatsApp number when customers check out.

## File Structure

```
index.html          — Homepage with products & cart
product.html        — Dynamic product detail page
admin.html          — Admin order dashboard
server.js           — Express backend (order storage, email)
script.js           — Frontend cart & WhatsApp logic
styles.css          — Responsive styling
data/products.json  — Product catalog
orders/orders.json  — Order history (created on first order)
```

## Deployment

### Heroku / Railway / Fly.io

Set environment variables in your dashboard, then deploy.

### Self-Hosted (Nginx)

```bash
npm install
npm start
# Runs on http://localhost:3000
# Proxy requests through Nginx
```

### Docker

Build and run locally:

```bash
docker build -t rubberstamp-shop:latest .
docker run -p 3000:3000 --env-file .env rubberstamp-shop:latest
```

Quick Heroku deploy (create app first):

```bash
heroku create your-app-name
heroku git:remote -a your-app-name
git push heroku main
heroku config:set $(cat .env | xargs)
```

GitHub Actions: A minimal CI workflow has been added at `.github/workflows/ci.yml`.

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

## Product Images

Upload to `/images/` with these filenames:

- `eclipseprinters-stamp-s312.jpg`
- `eclipseprinters-stamp-s300.jpg`
- `eclipseprinters-stamp-s303.jpg`
- `eclipseprinters-custom-30x50.jpg`
- `eclipseprinters-22x58-yellow.jpg`
- `eclipseprinters-22x58.jpg`
- `eclipseprinters-wooden-stamp.jpg`

Recommendations:
- Max width 1200px; JPEG quality ~80.
- Consider responsive variants (400px, 800px) using `srcset`.

## Support

- **WhatsApp Orders**: Customers can send orders manually, or enable Twilio to automatically send orders to your WhatsApp.
- **Email Notifications**: Set SMTP credentials to receive email alerts for new orders.
- **WhatsApp Notifications**: Set Twilio credentials to receive WhatsApp alerts for new orders.
- **Order Storage**: Orders are logged locally; back up `/orders/` regularly.
