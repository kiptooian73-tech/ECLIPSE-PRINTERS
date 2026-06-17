/* initial demo handlers removed — using delegated handlers below */
document.addEventListener('DOMContentLoaded', () => {
    // Merchant WhatsApp number (Kenya, no leading +).
    // Set to the number you provided.
    const merchantNumber = '254741296101';

    const cart = {};

    function formatKES(n) {
        return 'KES ' + Number(n).toLocaleString('en-KE');
    }

    function updateCartUI() {
        const itemsEl = document.getElementById('cartItems');
        const countEl = document.getElementById('cartCount');
        const totalEl = document.getElementById('cartTotal');
        itemsEl.innerHTML = '';
        let total = 0, qty = 0;
        Object.keys(cart).forEach(id => {
            const it = cart[id];
            const row = document.createElement('div');
            row.className = 'cart-row';
            row.innerHTML = `<span class="cart-name">${it.name} × ${it.qty}</span> <span class="cart-price">${formatKES(it.price * it.qty)}</span>`;
            itemsEl.appendChild(row);
            total += it.price * it.qty;
            qty += it.qty;
        })
        countEl.textContent = qty;
        totalEl.textContent = formatKES(total);
        // keep numeric total for payments
        window._cartTotalKES = total;
        // persist cart to localStorage
        try { localStorage.setItem('rs_cart', JSON.stringify(cart)); } catch (e) { }
    }

    function addToCart(id, name, price) {
        if (!cart[id]) cart[id] = { name, price: Number(price), qty: 0 };
        cart[id].qty += 1;
        updateCartUI();
    }

    // delegated add-to-cart: works for index and product pages
    document.addEventListener('click', (e) => {
        const btn = e.target.closest && e.target.closest('.add-to-cart');
        if (!btn) return;
        const card = btn.closest('.card') || btn.closest('.product-detail') || document;
        const nameEl = card.querySelector('h4') || card.querySelector('h2');
        const name = nameEl ? nameEl.textContent : 'Item';
        const price = btn.dataset.priceKes || btn.getAttribute('data-price-kes');
        const id = btn.dataset.id;
        addToCart(id, name, price);
    })

    // restore cart from localStorage
    try {
        const saved = localStorage.getItem('rs_cart');
        if (saved) {
            const parsed = JSON.parse(saved);
            Object.keys(parsed).forEach(k => cart[k] = parsed[k]);
        }
    } catch (e) { }

    // Cart drawer controls
    const cartBtn = document.getElementById('cartBtn');
    const cartDrawer = document.getElementById('cartDrawer');
    cartBtn.addEventListener('click', () => cartDrawer.classList.toggle('hidden'));

    document.getElementById('clearCart').addEventListener('click', () => {
        Object.keys(cart).forEach(k => delete cart[k]);
        updateCartUI();
    })

    function sendWhatsAppOrder() {
        const merchant = merchantNumber;
        if (!merchant || merchant === '254700000000') {
            alert('Please set the merchant WhatsApp number in script.js before sending orders.');
            return;
        }
        let total = 0; let lines = ['Order from RubberStamp Shop:'];
        const items = [];
        Object.keys(cart).forEach(id => {
            const it = cart[id];
            lines.push(`${it.qty} x ${it.name} — KES ${it.price * it.qty}`);
            items.push({ ...it, id });
            total += it.price * it.qty;
        })

        lines.push(`Total: KES ${total}`);

        // add customer details from form
        const cname = document.getElementById('custName')?.value || '';
        const cphone = document.getElementById('custPhone')?.value || '';
        const caddr = document.getElementById('custAddress')?.value || '';
        if (cname) lines.push(`Customer: ${cname}`);
        if (cphone) lines.push(`Phone: ${cphone}`);
        if (caddr) lines.push(`Delivery/Address: ${caddr}`);

        // Submit order to backend for storage and admin notification
        fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: cname,
                phone: cphone,
                address: caddr,
                items,
                total
            })
        }).catch(e => console.log('Backend order log: not available (running without server)'));

        const text = encodeURIComponent(lines.join('\n'));
        const url = `https://wa.me/${merchant}?text=${text}`;
        window.open(url, '_blank');
    }

    document.getElementById('whatsappBtn').addEventListener('click', sendWhatsAppOrder);

    // Floating WhatsApp button behaviour
    const floatingBtn = document.getElementById('floatingWhatsapp');
    if (floatingBtn) {
        floatingBtn.addEventListener('click', () => {
            const amount = window._cartTotalKES || 0;
            if (!amount || amount <= 0) {
                // open cart drawer so user can add items
                cartDrawer.classList.toggle('hidden');
                cartBtn.focus();
            } else {
                sendWhatsAppOrder();
            }
        });
    }

    // MPESA option removed — payments handled via WhatsApp orders or external flow

    // Contact form (simple demo)
    const form = document.getElementById('contactForm');
    if (form) {
        form.addEventListener('submit', e => {
            e.preventDefault();
            alert('Thanks — message received.');
            form.reset();
        })
    }

    updateCartUI();
})

// Accessible keyboard support: close cart with Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const cartDrawer = document.getElementById('cartDrawer');
        if (cartDrawer && !cartDrawer.classList.contains('hidden')) cartDrawer.classList.add('hidden');
    }
});
