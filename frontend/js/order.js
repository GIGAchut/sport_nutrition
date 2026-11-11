import { getCart, getQuantity, setQuantity, clearCart, updateHeaderCartCount } from './cart.js'
import { loadProducts } from './catalog.js'

let products = []

function removeUnknownProducts() {
    const cart = getCart()

    for (const productId in cart) {
        const exists = products.some(function(product) {
            return product.id === Number(productId)
        })
        if (!exists) {
            setQuantity(productId, 0)
        }
    }
}

function getOrderLines() {
    const cart = getCart()
    const lines = []

    for (const product of products) {
        const quantity = cart[product.id] || 0
        if (quantity > 0) {
            lines.push({ product: product, quantity: quantity })
        }
    }

    return lines
}

function getTotal(lines) {
    let total = 0

    for (const line of lines) {
        total += line.product.price * line.quantity
    }

    return total
}

function createOrderRow(product, quantity) {
    const row = document.createElement('div')
    row.className = 'order-row'

    row.innerHTML = `
        <span class="order-name"></span>
        <span class="order-price"></span>
        <div class="quantity-control">
            <button class="qty-btn minus">−</button>
            <input class="qty-value active" type="number" min="0" max="100">
            <button class="qty-btn plus">+</button>
        </div>
        <span class="order-sum"></span>
    `

    row.querySelector('.order-name').textContent = product.name
    row.querySelector('.order-price').textContent = product.price + ' ₽'
    row.querySelector('.qty-value').value = quantity
    row.querySelector('.order-sum').textContent = product.price * quantity + ' ₽'
    row.querySelector('.quantity-control').dataset.id = product.id

    return row
}

function renderOrder() {
    const list = document.getElementById('order-items')
    const lines = getOrderLines()

    list.innerHTML = ''
    for (const line of lines) {
        list.appendChild(createOrderRow(line.product, line.quantity))
    }

    document.getElementById('order-total').textContent = getTotal(lines)

    const isEmpty = lines.length === 0
    document.getElementById('order-empty').hidden = !isEmpty
    document.getElementById('order-body').hidden = isEmpty

    updateHeaderCartCount()
}

function initQuantityButtons() {
    const list = document.getElementById('order-items')

    list.addEventListener('click', (event) => {
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
        renderOrder()
    })
    
    list.addEventListener('change', (event) => {
        const input = event.target.closest('.qty-value')
        if (!input) {
            return
        }

        const control = input.closest('.quantity-control')
        const productId = Number(control.dataset.id)

        setQuantity(productId, Math.floor(Number(input.value)))
        renderOrder()
    })
}

function showSuccess(customerName, total) {
    document.getElementById('order-body').hidden = true
    document.getElementById('order-empty').hidden = true
    document.getElementById('order-success-text').textContent =
        'Спасибо, ' + customerName + '! Заказ на сумму ' + total + ' ₽ сформирован.'
    document.getElementById('order-success').hidden = false
}


function formatPhone(value) {
    let digits = value.replace(/\D/g, '')

    if (digits.startsWith('8')) {
        digits = '7' + digits.slice(1)
    }

    if (digits !== '' && !digits.startsWith('7')) {
        digits = '7' + digits
    }

    digits = digits.slice(0, 11)

    const parts = [
        digits.slice(0, 1),
        digits.slice(1, 4),
        digits.slice(4, 7),
        digits.slice(7, 11),
    ]

    return parts.filter((part) => part !== '').join(' ')
}

function formatCardNumber(value) {
    const digits = value.replace(/\D/g, '').slice(0, 16)
    const groups = []

    for (let i = 0; i < digits.length; i += 4) {
        groups.push(digits.slice(i, i + 4))
    }

    return groups.join(' ')
}

function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4)

    if (digits.length <= 2) {
        return digits
    }

    return digits.slice(0, 2) + '/' + digits.slice(2)
}

function formatCvc(value) {
    return value.replace(/\D/g, '').slice(0, 3)
}

function bindFormat(inputId, formatFunction) {
    const input = document.getElementById(inputId)

    input.addEventListener('input', () => {
        input.value = formatFunction(input.value)
    })
}

function sendOrder(event) {
    event.preventDefault()

    const lines = getOrderLines()

    const items = []
    for (const line of lines) {
        items.push({ product_id: line.product.id, quantity: line.quantity })
    }

    const order = {
        customer_name: document.getElementById('customer-name').value.trim(),
        phone: document.getElementById('phone').value.trim(),
        address: document.getElementById('address').value.trim(),
        items: items,
    }

    const total = getTotal(lines)

    clearCart()
    updateHeaderCartCount()

    showSuccess(order.customer_name, total)
}

async function initOrderPage() {
    try {
        products = await loadProducts()
    } catch (error) {
        const empty = document.getElementById('order-empty')
        empty.textContent = 'Ошибка загрузки данных. Попробуйте позже.'
        empty.hidden = false
        console.error(error)
        return
    }

    removeUnknownProducts()
    renderOrder()
    initQuantityButtons()
    document.getElementById('order-form').addEventListener('submit', sendOrder)

    bindFormat('phone', formatPhone)
    bindFormat('card-number', formatCardNumber)
    bindFormat('card-expiry', formatExpiry)
    bindFormat('card-cvc', formatCvc)
}

document.addEventListener('DOMContentLoaded', () => {
    initOrderPage()
})