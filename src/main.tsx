import React from 'react'
import ReactDOM from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

// Minimal test render
ReactDOM.createRoot(document.getElementById('root')!).render(
  <div style={{padding: '50px', fontSize: '24px', fontFamily: 'system-ui', color: '#000', backgroundColor: '#f0f0f0'}}>
    <h1>✓ React is working!</h1>
    <p>If you see this, React successfully rendered.</p>
    <p>Issue is with the App component, not React itself.</p>
  </div>
)