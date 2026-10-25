import { renderCatalog, initCartLogic } from './catalog.js';

document.addEventListener('DOMContentLoaded', () => {
    renderCatalog('product-grid');
    
    initCartLogic();
});