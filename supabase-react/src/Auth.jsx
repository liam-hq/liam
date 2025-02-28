import { useState } from 'react'
import { supabase } from './supabaseClient'

export default function Auth() {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')

  const handleLogin = async (event) => {
    event.preventDefault()

    setLoading(true)
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'github'
    })

    if (error) {
      alert(error.error_description || error.message)
    }
    setLoading(false)
  }

  return (
    <div className="row flex flex-center">
      <div className="col-6 form-widget">
        <h1 className="header">Supabase + React</h1>
        <p className="description">GitHub Login Sample Flow.</p>
        <form className="form-widget" onSubmit={handleLogin}>
          <div>
          </div>
          <div>
            <button className={'button block'} disabled={loading}>
              {loading ? <span>Loading</span> : <span>GitHub Login Button</span>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
