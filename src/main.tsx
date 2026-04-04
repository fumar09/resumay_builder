import React from 'react'
import ReactDOM from 'react-dom/client'
// REMOVED BOOTSTRAP TEMPORARILY TO TEST
// import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found - cannot mount React app')
}

// Test render - minimal content
try {
  ReactDOM.createRoot(rootElement).render(
    <div style={{ padding: '40px', fontFamily: 'system-ui', lineHeight: '1.6' }}>
      <h1 style={{ color: '#a51c30' }}>ResuMay! Test (Bootstrap Removed)</h1>
      <p>
        If you see this, React IS working! Bootstrap CSS was likely the issue.
      </p>
      <hr style={{ margin: '20px 0' }} />
      <details>
        <summary>System Info</summary>
        <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '4px', overflow: 'auto' }}>
          {JSON.stringify({
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
          }, null, 2)}
        </pre>
      </details>
    </div>,
  )
} catch (error) {
  console.error('React initialization error:', error)
  rootElement.innerHTML =
    '<div style="padding:40px;color:red;font-family:system-ui;"><h1>Critical Error</h1><p>' +
    String(error) +
    '</p><hr><p>Check browser console for details. Error was: ' +
    JSON.stringify(error) +
    '</p></div>'
}