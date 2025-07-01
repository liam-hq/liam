import { useState } from 'react'

export const App = () => {
  const [count, setCount] = useState(0)

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h1>Test Plan</h1>
      <div style={{ margin: '2rem 0' }}>
        <button
          type="button"
          onClick={() => setCount((count) => count + 1)}
          style={{
            padding: '0.5rem 1rem',
            fontSize: '1rem',
            backgroundColor: '#646cff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          count is {count}
        </button>
      </div>
      <p style={{ color: '#888' }}>
        Edit <code>src/App.tsx</code> and save to test HMR
      </p>
    </div>
  )
}
