import { renderCatalog, initCartLogic } from './catalog.js'
import { updateHeaderCartCount } from './cart.js'

document.addEventListener('DOMContentLoaded', () => {
    renderCatalog('product-grid')
    initCartLogic()
    updateHeaderCartCount()
})