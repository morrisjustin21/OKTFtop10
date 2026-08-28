import { useState } from 'react'
import { supabase } from '../lib/supabaseClient.js'

export default function AdminLogin({ onSignedIn }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    setLoading(false)
    if (signInError) {
      setError(signInError.message)
      return
    }
    onSignedIn(data.session)
  }

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <p className="font-display uppercase tracking-wide text-xl mb-1">Staff login</p>
      <p className="text-sm text-graphite mb-6">
        Sign in with the staff account created in Supabase to manage teams and results.
      </p>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="text-xs uppercase tracking-wide text-graphite">Email</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
          />
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-graphite">Password</label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-charcoal/20 rounded px-3 py-2 mt-1"
          />
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-accent text-white rounded px-3 py-2 font-body disabled:opacity-60"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  )
}
