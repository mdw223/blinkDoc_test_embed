import React, { useState } from 'react'
import ReactDOM from 'react-dom/client'
import { BlinkDocViewer } from 'blinkdoc-embed/react'
const DOC_ID = import.meta.env.VITE_BLINKDOC_DOC_ID

function App() {
  const [page, setPage] = useState(null)

  return (
    <div style={{ fontFamily: 'sans-serif', padding: 20 }}>
      <nav style={{ marginBottom: 16, fontSize: 14 }}>
        <a href="/" style={{ color: '#0070f3', textDecoration: 'none', marginRight: 16 }}>
          &larr; Script embed
        </a>
        <a href="/npm-viewer" style={{ color: '#0070f3', textDecoration: 'none', fontWeight: 'bold' }}>
          npm package viewer
        </a>
      </nav>
      <h1 style={{ marginTop: 0 }}>blinkDoc npm Package Viewer</h1>
      <p style={{ fontSize: 13, color: '#666', marginTop: -8 }}>
        Using <code>blinkdoc-embed/react</code> &mdash; React component, built with Vite.
        {page !== null && <span> &nbsp;|&nbsp; Page: {page}</span>}
      </p>
      <BlinkDocViewer
        apiUrl={import.meta.env.VITE_BLINKDOC_API}
        sessionUrl="/api/get-viewer-token"
        docId={DOC_ID}
        pages="*"
        height="80vh"
        onPageChange={setPage}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('app')).render(<App />)
