import { getCart, getQuantity, setQuantity, updateHeaderCartCount, clearCart } from './cart.js'

// Все товары каталога. Загружаем один раз при открытии страницы.
let products = []

async function loadProducts() {
    const response = await fetch('/api/products')

    if (!response.ok) {
        throw new Error('Не удалось загрузить товары')
    }

    return await response.json()
}

// Если в корзине остался товар, которого уже нет в каталоге (скрыт или удалён),
// убираем его из корзины.
function removeUnknownProducts() {
    const cart = getCart()

    for (const productId in cart) {
        // some возвращает true, если хотя бы один товар подошёл под условие
        const exists = products.some((product) => product.id === Number(productId))
        if (!exists) {
            setQuantity(productId, 0)
        }
    }
}

// Собирает строки заказа: товар + сколько штук в корзине
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

    // Как и в каталоге: в шаблоне только статичная разметка,
    // данные товара вставляем через textContent
    row.innerHTML = `
        <span class="order-name"></span>
        <span class="order-price"></span>
        <div class="quantity-control">
            <button class="qty-btn minus">−</button>
            <span class="qty-value active"></span>
            <button class="qty-btn plus">+</button>
        </div>
        <span class="order-sum"></span>
    `

    row.querySelector('.order-name').textContent = product.name
    row.querySelector('.order-price').textContent = product.price + ' ₽'
    row.querySelector('.qty-value').textContent = quantity
    row.querySelector('.order-sum').textContent = product.price * quantity + ' ₽'
    row.querySelector('.quantity-control').dataset.id = product.id

    return row
}

// Перерисовывает список товаров, итоговую сумму и нужный блок страницы
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

        // Когда количество доходит до 0, товар пропадает из корзины и из списка
        setQuantity(productId, quantity)
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

// Приводит введённый номер к виду 7 000 000 0000
function formatPhone(value) {
    // \D означает "любой символ, кроме цифры": убираем всё лишнее
    let digits = value.replace(/\D/g, '')

    // Привычный ввод с 8 заменяем на 7
    if (digits.startsWith('8')) {
        digits = '7' + digits.slice(1)
    }

    // Если номер начали с другой цифры (например, 9123456789), дописываем 7 в начало
    if (digits !== '' && !digits.startsWith('7')) {
        digits = '7' + digits
    }

    // Не больше 11 цифр
    digits = digits.slice(0, 11)

    // Режем на части 1 + 3 + 3 + 4 и склеиваем непустые через пробел
    const parts = [
        digits.slice(0, 1),
        digits.slice(1, 4),
        digits.slice(4, 7),
        digits.slice(7, 11),
    ]

    return parts.filter((part) => part !== '').join(' ')
}

function sendOrder(event) {
    // Без этого браузер при отправке формы перезагрузит страницу
    event.preventDefault()

    const lines = getOrderLines()

    // Для сервера нужны только id и количество, цены он посчитает сам
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

    console.log('Заказ сформирован:', order)

    // TODO: здесь позже будет отправка заказа на сервер:
    // fetch('/api/orders', { method: 'POST', body: JSON.stringify(order), ... })

    const total = getTotal(lines)

    // Заказ оформлен, старые товары в корзине больше не нужны
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
}

initOrderPage()