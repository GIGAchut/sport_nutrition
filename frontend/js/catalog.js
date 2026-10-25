import { products } from './data/products.js';

const cartState = new Map();

export function renderCatalog(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = '';

    products.forEach(product => {
        const currentQty = cartState.get(product.id) || 0;
        
        const card = document.createElement('div');
        card.className = 'product-card';
        card.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.parentElement.innerText='[ИЗОБРАЖЕНИЕ НЕ НАЙДЕНО]';">
            </div>
            <h3 class="product-name">${product.name}</h3>
            <p class="product-description">${product.description}</p>
            <div class="product-footer">
                <span class="product-price">${product.price} ₽</span>
                
                <div class="quantity-control" data-id="${product.id}">
                    <button class="qty-btn minus" ${currentQty === 0 ? 'disabled' : ''}>−</button>
                    <span class="qty-value">${currentQty}</span>
                    <button class="qty-btn plus">+</button>
                </div>
            </div>
        `;
        container.appendChild(card);
    });
}

function updateHeaderCartCount() {
    const totalItems = Array.from(cartState.values()).reduce((sum, qty) => sum + qty, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = totalItems;
    }
}

function updateCardUI(productId) {
    const control = document.querySelector(`.quantity-control[data-id="${productId}"]`);
    if (!control) return;

    const qty = cartState.get(productId) || 0;
    const qtyValue = control.querySelector('.qty-value');
    const minusBtn = control.querySelector('.minus');

    qtyValue.textContent = qty;
    minusBtn.disabled = qty === 0;
    
    qty === 0 ? qtyValue.style.color = '#a0a0a0' : qtyValue.style.color = '#ffffff'
    
}

export function initCartLogic() {
    document.addEventListener('click', (event) => {
        const btn = event.target;
        if (!btn.classList.contains('qty-btn')) return;

        const control = btn.closest('.quantity-control');
        const productId = parseInt(control.dataset.id, 10);
        const currentQty = cartState.get(productId) || 0;

        if (btn.classList.contains('plus')) {
            cartState.set(productId, currentQty + 1);
        } else if (btn.classList.contains('minus') && currentQty > 0) {
            cartState.set(productId, currentQty - 1);
        }

        updateCardUI(productId);
        updateHeaderCartCount();
    });
}