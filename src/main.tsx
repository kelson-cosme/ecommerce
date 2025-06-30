// Caminho do arquivo: src/main.tsx

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { StoreProvider } from './lib/StoreContext'
import { CartProvider } from './lib/CartContext' // <-- 1. IMPORTE O CARTPROVIDER
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <CartProvider> {/* <-- 2. ENVOLVA A APLICAÇÃO COM O CARTPROVIDER */}
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </CartProvider>
    </StoreProvider>
  </StrictMode>,
)