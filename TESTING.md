# RubberStamp Shop — End-to-End Testing Guide

## Prerequisites

Install **Node.js 18+** from https://nodejs.org/

Verify installation:
```bash
node --version
npm --version
```

## Setup

### 1. Install Dependencies

```bash
cd rubberstamp-shop
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```bash
PORT=3000
MERCHANT_WHATSAPP=254741296101
ADMIN_EMAIL=your-email@gmail.com
ADMIN_TOKEN=test-admin-token
```

Optional (for email & WhatsApp notifications):
- Set SMTP credentials (Gmail, SendGrid, etc.)
- Set Twilio credentials for WhatsApp notifications

### 3. Start the Server

```bash
npm start
```

Expected output:
```
RubberStamp Shop server running on http://localhost:3000
Orders stored in: /path/to/orders/orders.json
```

## Test Scenarios

### Scenario 1: Browse Products & Add to Cart

1. Open http://localhost:3000
2. Verify all 7 products display with images
3. Click "Add to cart" on a product
4. Verify cart count increases (top-right)
5. Click cart button to open drawer
6. Verify item appears with quantity & price

**Expected result:** ✅ Cart shows added items with correct prices

---

### Scenario 2: Navigate Product Detail Page

1. From homepage, note a product's image/title
2. Open browser console (F12)
3. Manually visit `http://localhost:3000/product.html?id=stamp-1`
4. Verify product loads with title, price, description
5. Click "Add to cart"
6. Verify cart updates

**Expected result:** ✅ Product detail page loads and cart updates

---

### Scenario 3: Complete Checkout (WhatsApp)

1. Add 2-3 items to cart
2. Open cart drawer (click "Cart" button)
3. Fill in customer details:
   - Name: `Test Customer`
   - Phone: `254700000000`
   - Address: `123 Main St, Nairobi`
4. Click "Buy via WhatsApp"
5. WhatsApp opens with pre-filled message showing:
   - Items with quantities & prices
   - Customer name, phone, address
   - Total amount

**Expected result:** ✅ WhatsApp opens with correctly formatted order

---

### Scenario 4: Order Storage & Admin Dashboard

After completing Scenario 3:

1. Check order was saved to file:
   ```bash
   cat orders/orders.json
   ```
   Should show order with:
   - Order ID (ORD-[timestamp])
   - Customer name, phone, address
   - Items array with quantities & prices
   - Total amount
   - Timestamp
   - Status: "pending"

2. Visit admin dashboard: http://localhost:3000/admin.html
3. Click login field and enter: `test-admin-token`
4. Click "Login"
5. Verify order appears in table with:
   - Order ID
   - Customer name
   - Phone
   - Total
   - Items
   - Date
   - Status badge

**Expected result:** ✅ Order persisted and visible in admin dashboard

---

### Scenario 5: Cart Persistence

1. Add items to cart
2. Refresh the page (Ctrl+R)
3. Verify cart items still appear

**Expected result:** ✅ Cart survives page refresh (localStorage)

---

### Scenario 6: Accessibility

1. Press `Tab` to navigate:
   - Should focus on nav links
   - Should focus on product buttons
   - Should focus on cart button
2. Press `Escape` key when cart is open
   - Cart should close

**Expected result:** ✅ Keyboard navigation works; Escape closes cart

---

### Scenario 7: Clear Cart

1. Add items to cart
2. Open cart drawer
3. Click "Clear cart"
4. Verify cart empties and count resets to 0

**Expected result:** ✅ Cart clears and count updates

---

### Scenario 8: Multiple Orders

1. Complete 2-3 orders (Scenario 3)
2. Visit admin dashboard
3. Verify all orders display in table

**Expected result:** ✅ Multiple orders stored and displayed

---

## Troubleshooting

### Port already in use

If port 3000 is busy:
```bash
PORT=3001 npm start
# Visit http://localhost:3001
```

### Orders file not created

After first order, check:
```bash
ls -la orders/
```

Should show `orders.json` file. Create manually if needed:
```bash
mkdir -p orders
echo "[]" > orders/orders.json
```

### Images not loading

Verify image paths in `index.html` match filenames in `/images/` directory:
```bash
ls images/
```

### WhatsApp link doesn't open

- Verify `MERCHANT_WHATSAPP` is set in `.env` (no `+` prefix)
- For testing: manually check WhatsApp message format in browser console

---

## Performance & Load Testing

### Simulate Multiple Orders

```bash
# Create test script: test-orders.js
const orders = [];
for (let i = 0; i < 10; i++) {
  orders.push({
    id: `ORD-${Date.now() + i}`,
    name: `Customer ${i}`,
    phone: `254700000${i}`,
    address: `Address ${i}`,
    items: [{ id: 'stamp-1', name: 'Stamp', qty: 1, price: 1650 }],
    total: 1650,
    timestamp: new Date().toISOString(),
    status: 'pending'
  });
}
console.log(JSON.stringify(orders, null, 2));
```

Then:
```bash
node test-orders.js > orders/orders.json
npm start
# Visit admin dashboard to see 10 orders
```

---

## Success Checklist

- [ ] Server starts without errors
- [ ] Products display with images and prices
- [ ] Add to cart works
- [ ] Cart persists on refresh
- [ ] WhatsApp checkout opens with correct details
- [ ] Order saved to `orders/orders.json`
- [ ] Admin dashboard displays all orders
- [ ] Keyboard navigation works (Tab, Escape)
- [ ] Multiple orders can be created and viewed
- [ ] Cart clears properly

---

## Notes

- All data is stored locally (JSON file)
- No database required for basic testing
- Email/WhatsApp notifications are optional (work if configured)
- Admin token is simple password (use strong token in production)
- For production, use real database (MongoDB, PostgreSQL, etc.)
