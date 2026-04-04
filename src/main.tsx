import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'
import App from './App.tsx'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found - cannot mount React app')
}

console.log('Mounting React app to', rootElement)

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
} catch (error) {
  console.error('React render error:', error)
  rootElement.innerHTML = '<div style="padding:20px;color:red;"><h1>Error rendering app</h1><p>' + String(error) + '</p></div>'
}