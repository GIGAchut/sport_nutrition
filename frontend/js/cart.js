const CART_KEY = 'user_cart'

export function getCart() {
    try {
        const saved = localStorage.getItem(CART_KEY)
        if (saved === null) {
            return {}
        }
        return JSON.parse(saved)
    } catch (error) {
        return {};
    }
}

export function getQuantity(productId) {
    const cart = getCart();
    return cart[productId] || 0;
}

export function setQuantity(productId, quantity) {
    const cart = getCart();

    if (quantity <= 0) {
        delete cart[productId];
    } else {
        cart[productId] = quantity;
    }

    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

export function getTotalCount() {
    const cart = getCart();
    let total = 0;

    for (const productId in cart) {
        total += cart[productId];
    }

    return total;
}

export function updateHeaderCartCount() {
    const element = document.getElementById('cart-count');
    if (element) {
        element.textContent = getTotalCount();
    }
}