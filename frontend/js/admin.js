async function loadProducts() {
    const response = await fetch('/api/admin/products')

    if (!response.ok) {
        throw new Error('Не удалось загрузить товары')
    }

    return await response.json()
}

    async function setVisibility(productId, isVisible) {
        const response = await fetch('/api/admin/products/' + productId + '/visibility', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ is_visible: isVisible }),
        })

        if (!response.ok) {
            throw new Error('Не удалось изменить видимость')
        }
    }

function createCard(product) {
    const isVisible = product.is_visible === 1

    const card = document.createElement('div')
    card.className = 'product-card'
    card.innerHTML = `
        <span class="admin-status"></span>
        <div class="product-image">
            <img>
        </div>
        <h3 class="product-name"></h3>
        <p class="product-description"></p>
        <div class="product-footer">
            <span class="product-price"></span>
            <button class="admin-button"></button>
        </div>
    `

    const image = card.querySelector('img')
    image.src = '/' + product.image
    image.alt = product.name
    image.addEventListener('error', () => {
        image.parentElement.textContent = '[ИЗОБРАЖЕНИЕ НЕ НАЙДЕНО]'
    })

    card.querySelector('.product-name').textContent = product.name
    card.querySelector('.product-description').textContent = product.description
    card.querySelector('.product-price').textContent = product.price + ' ₽'

    const status = card.querySelector('.admin-status')
    const button = card.querySelector('.admin-button')
    button.dataset.id = product.id

    if (isVisible) {
        status.textContent = 'Виден покупателям'
        button.textContent = 'Скрыть'
        button.dataset.show = 'false'
    } else {
        card.classList.add('is-hidden')
        status.textContent = 'Скрыт'
        button.textContent = 'Показать'
        button.dataset.show = 'true'
    }

    return card
}

async function renderProducts() {
    const grid = document.getElementById('admin-products')
    const message = document.getElementById('admin-message')

    try {
        const products = await loadProducts()

        grid.innerHTML = ''
        for (const product of products) {
            grid.appendChild(createCard(product))
        }
        message.textContent = ''
    } catch (error) {
        message.textContent = 'Ошибка загрузки каталога.'
        console.error(error)
    }
}

function initButtons() {
    const grid = document.getElementById('admin-products')
    const message = document.getElementById('admin-message')

    grid.addEventListener('click', async (event) => {
        const button = event.target.closest('.admin-button')
        if (!button) {
            return
        }

        const productId = Number(button.dataset.id)
        const show = button.dataset.show === 'true'

        button.disabled = true

        try {
            await setVisibility(productId, show)
            await renderProducts()
        } catch (error) {
            message.textContent = 'Не удалось изменить товар. Попробуйте ещё раз.'
            console.error(error)
            button.disabled = false
        }
    })
}

document.addEventListener('DOMContentLoaded', () => {
    renderProducts()
    initButtons()
})
