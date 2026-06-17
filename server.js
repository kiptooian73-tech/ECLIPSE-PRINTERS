require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const fs = require('fs');
const nodemailer = require('nodemailer');
const twilio = require('twilio');

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN;

const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim()).filter(Boolean)
    : [`http://localhost:${PORT}`];

if (!ADMIN_TOKEN) {
    console.error('WARNING: ADMIN_TOKEN is not set. Admin endpoints will reject all requests.');
}

app.disable('x-powered-by');
app.use(helmet());
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy violation: origin not allowed'));
    }
}));
app.use(bodyParser.json());

const apiLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' }
});

const adminLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many admin requests, please try again later.' }
});

app.use('/api/', apiLimiter);

function requireAdminAuth(req, res, next) {
    const token = req.headers['x-admin-token'] || req.headers.authorization?.split(' ')[1];
    if (!ADMIN_TOKEN || token !== ADMIN_TOKEN) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
}

app.use(express.static(path.join(__dirname)));

// Orders storage file
const ORDERS_FILE = path.join(__dirname, 'orders', 'orders.json');
const ORDERS_DIR = path.join(__dirname, 'orders');

// Ensure orders directory exists
if (!fs.existsSync(ORDERS_DIR)) {
    fs.mkdirSync(ORDERS_DIR, { recursive: true });
}

function isValidTwilioSid(sid) {
    return typeof sid === 'string' && /^AC[a-zA-Z0-9]{32}$/.test(sid.trim());
}

let twilioClient = null;
if (isValidTwilioSid(process.env.TWILIO_ACCOUNT_SID) && process.env.TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (e) {
        console.error('Twilio initialization failed:', e.message);
    }
} else {
    console.log('Twilio is disabled: valid TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN are required.');
}

// Email transporter setup (using environment variables)
const emailTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: process.env.SMTP_PORT || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASSWORD || ''
    }
});

function loadOrders() {
    try {
        if (fs.existsSync(ORDERS_FILE)) {
            return JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('Error loading orders:', e.message);
    }
    return [];
}

function saveOrders(orders) {
    try {
        fs.writeFileSync(ORDERS_FILE, JSON.stringify(orders, null, 2), 'utf8');
    } catch (e) {
        console.error('Error saving orders:', e.message);
    }
}

function isValidPhone(phone) {
    return typeof phone === 'string' && /^[+0-9\s-]{7,20}$/.test(phone.trim());
}

function isValidOrderItem(item) {
    return item && typeof item === 'object'
        && typeof item.name === 'string' && item.name.trim().length > 0
        && Number.isInteger(item.qty) && item.qty > 0
        && typeof item.price === 'number' && item.price >= 0;
}

function validateOrderPayload({ name, phone, address, items, total }) {
    if (typeof name !== 'string' || !name.trim()) return false;
    if (!isValidPhone(phone)) return false;
    if (typeof address !== 'string' || !address.trim()) return false;
    if (!Array.isArray(items) || items.length === 0) return false;
    if (!items.every(isValidOrderItem)) return false;
    if (typeof total !== 'number' || total <= 0) return false;
    const expectedTotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
    return expectedTotal === total;
}

async function sendAdminNotification(order) {
    if (!process.env.ADMIN_EMAIL || !process.env.SMTP_USER) {
        console.log('Admin email not configured; skipping email notification.');
    } else {
        try {
            const itemsList = order.items.map(it => `${it.qty} x ${it.name} - KES ${it.price * it.qty}`).join('\n');
            const mailOptions = {
                from: process.env.SMTP_USER,
                to: process.env.ADMIN_EMAIL,
                subject: `New Order #${order.id} - RubberStamp Shop`,
                html: `
                    <h2>New Order Received</h2>
                    <p><strong>Order ID:</strong> ${order.id}</p>
                    <p><strong>Customer Name:</strong> ${order.name}</p>
                    <p><strong>Phone:</strong> ${order.phone}</p>
                    <p><strong>Address:</strong> ${order.address}</p>
                    <h3>Items:</h3>
                    <pre>${itemsList}</pre>
                    <p><strong>Total:</strong> KES ${order.total}</p>
                    <p><strong>Order Time:</strong> ${new Date(order.timestamp).toLocaleString()}</p>
                `
            };
            await emailTransporter.sendMail(mailOptions);
            console.log(`Email notification sent to ${process.env.ADMIN_EMAIL}`);
        } catch (e) {
            console.error('Error sending email:', e.message);
        }
    }

    // Send WhatsApp notification via Twilio
    if (twilioClient && process.env.TWILIO_WHATSAPP_NUMBER && process.env.MERCHANT_WHATSAPP) {
        try {
            const itemsList = order.items.map(it => `${it.qty}x ${it.name} - KES ${it.price * it.qty}`).join('\n');
            const message = `🛒 New Order #${order.id}

👤 ${order.name}
📱 ${order.phone}
📍 ${order.address}

📦 Items:
${itemsList}

💰 Total: KES ${order.total}

⏰ ${new Date(order.timestamp).toLocaleString()}`;

            // Format Twilio WhatsApp format: whatsapp:+[country_code][number]
            const toNumber = `whatsapp:+${process.env.MERCHANT_WHATSAPP}`;
            const fromNumber = `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

            await twilioClient.messages.create({
                body: message,
                from: fromNumber,
                to: toNumber
            });
            console.log(`WhatsApp notification sent to ${process.env.MERCHANT_WHATSAPP}`);
        } catch (e) {
            console.error('Error sending WhatsApp:', e.message);
        }
    }
}

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/product.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'product.html'));
});

// API endpoint to submit order
app.post('/api/orders', async (req, res) => {
    try {
        const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
        const phone = typeof req.body.phone === 'string' ? req.body.phone.trim() : '';
        const address = typeof req.body.address === 'string' ? req.body.address.trim() : '';
        const items = Array.isArray(req.body.items) ? req.body.items : [];
        const total = typeof req.body.total === 'number' ? req.body.total : Number(req.body.total);

        if (!validateOrderPayload({ name, phone, address, items, total })) {
            return res.status(400).json({ error: 'Invalid order payload' });
        }

        const order = {
            id: 'ORD-' + Date.now(),
            name,
            phone,
            address,
            items,
            total,
            timestamp: new Date().toISOString(),
            status: 'pending'
        };

        const orders = loadOrders();
        orders.push(order);
        saveOrders(orders);

        // Send admin notification
        await sendAdminNotification(order);

        return res.json({
            success: true,
            orderId: order.id,
            message: 'Order received. We will contact you soon!'
        });
    } catch (e) {
        console.error('Error creating order:', e);
        return res.status(500).json({ error: 'Failed to create order' });
    }
});

// Admin endpoint to view all orders (protected by simple auth)
app.get('/api/admin/orders', adminLimiter, requireAdminAuth, (req, res) => {
    const orders = loadOrders();
    return res.json(orders);
});

// Admin endpoint to update order status
app.patch('/api/admin/orders/:id', adminLimiter, requireAdminAuth, (req, res) => {

    const { status } = req.body;
    if (!status) {
        return res.status(400).json({ error: 'Status required' });
    }

    const orders = loadOrders();
    const order = orders.find(o => o.id === req.params.id);

    if (!order) {
        return res.status(404).json({ error: 'Order not found' });
    }

    order.status = status;
    saveOrders(orders);

    return res.json({ success: true, order });
});

app.listen(PORT, () => {
    console.log(`RubberStamp Shop server running on http://localhost:${PORT}`);
    console.log('Orders stored in:', ORDERS_FILE);
});
