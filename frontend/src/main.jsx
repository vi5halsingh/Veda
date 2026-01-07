import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'
import { AuthProvider } from './context/AuthContext'

registerSW({
    registerType: 'prompt',
    workbox: {
        navigateFallback: '/index.html',
        runtimeCaching: [
            {
                urlPattern: "*",
                handler: 'CacheFirst',
                options: {
                    cacheName: 'veda-cache',
                }
            },

        ]
    }
})

createRoot(document.getElementById('root')).render(
    <AuthProvider>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </AuthProvider>
)
