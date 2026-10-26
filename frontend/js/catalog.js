import { getQuantity, setQuantity, updateHeaderCartCount } from './cart.js';

async function loadProducts() {
    const response = await fetch('/api/products')

    if (!response.ok) {
        throw new Error('Не удалось загрузить товары')
    }

    return await response.json()
}

function showQuantity(control, quantity) {
    const value = control.querySelector('.qty-value')
    const minusButton = control.querySelector('.minus')

    value.textContent = quantity
    minusButton.disabled = quantity === 0
    if (quantity === 0) {
        value.classList.remove('active')
    } else {
        value.classList.add('active')
    }
}

function createProductCard(product) {
    const card = document.createElement('div')
    card.className = 'product-card'
    card.innerHTML = `
        <div class="product-image">
            <img>
        </div>
        <h3 class="product-name"></h3>
        <p class="product-description"></p>
        <div class="product-footer">
            <span class="product-price"></span>
            <div class="quantity-control">
                <button class="qty-btn minus">−</button>
                <span class="qty-value"></span>
                <button class="qty-btn plus">+</button>
            </div>
        </div>
    `

    const image = card.querySelector('img')
    image.src = product.image
    image.alt = product.name
    image.addEventListener('error', () => {
        image.parentElement.textContent = '[ИЗОБРАЖЕНИЕ НЕ НАЙДЕНО]'
    })

    card.querySelector('.product-name').textContent = product.name
    card.querySelector('.product-description').textContent = product.description
    card.querySelector('.product-price').textContent = product.price + '₽'

    const control = card.querySelector('.quantity-control')
    control.dataset.id = product.id
    showQuantity(control, getQuantity(product.id))

    return card
}

export async function renderCatalog(containerId) {
    const container = document.getElementById(containerId)
    if (!container) {
        return
    }

    try {
        const products = await loadProducts()

        container.innerHTML = ''
        for (const product of products) {
            container.appendChild(createProductCard(product))
        }
    } catch (error) {
        container.textContent = 'Ошибка зарузки каталога. Попробуйте позже.'
        console.error(error)
    }
}

export function initCartLogic() {
    const grid = document.getElementById('product-grid')
    if (!grid) {
        return
    }

    grid.addEventListener('click', (event) => {
        const button = event.target.closest('.qty-btn')
        if (!button) {
            return
        }

        const control = button.closest('.quantity-control')
        const productId = Number(control.dataset.id)
        let quantity = getQuantity(productId)

        if (button.classList.contains('plus')) {
            quantity = quantity + 1
        } else {
            quantity = quantity - 1
        }
        setQuantity(productId, quantity)
        showQuantity(control, getQuantity(productId))
        updateHeaderCartCount()
    });
}