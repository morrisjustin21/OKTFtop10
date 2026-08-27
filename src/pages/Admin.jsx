import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabaseClient.js'
import AdminLogin from '../components/AdminLogin.jsx'
import TeamsEntryForm from '../components/TeamsEntryForm.jsx'
import ResultsEntryForm from '../components/ResultsEntryForm.jsx'

export default function Admin() {
  const [session, setSession] = useState(null)
  const [checkedSession, setCheckedSession] = useState(false)
  const [section, setSection] = useState('results') // 'results' | 'teams'

  useEffect(() => {
    if (!supabase) {
      setCheckedSession(true)
      return
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCheckedSession(true)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  if (!supabase) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-sm text-graphite">
        Supabase isn&apos;t connected yet — add <code>VITE_SUPABASE_URL</code> and{' '}
        <code>VITE_SUPABASE_ANON_KEY</code> to your environment before using the admin page.
      </div>
    )
  }

  if (!checkedSession) {
    return <div className="max-w-lg mx-auto px-4 py-16 text-sm text-graphite">Loading…</div>
  }

  if (!session) {
    return <AdminLogin onSignedIn={setSession} />
  }

  return (
    <div className="min-h-screen">
      <div className="bg-cinder text-lane">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <p className="font-display uppercase tracking-wide text-xl leading-none">Admin</p>
            <p className="text-xs text-lane/80 mt-1">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <Link to="/" className="underline">
              View leaderboard
            </Link>
            <button onClick={() => supabase.auth.signOut()} className="underline">
              Sign out
            </button>
          </div>
        </div>
      </div>
      <div className="lane-line" />

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 border-b border-charcoal/10">
          <button
            onClick={() => setSection('results')}
            className={`px-3 py-2 text-sm font-body border-b-2 ${
              section === 'results'
                ? 'border-cinder text-charcoal font-medium'
                : 'border-transparent text-graphite hover:text-charcoal'
            }`}
          >
            Results entry
          </button>
          <button
            onClick={() => setSection('teams')}
            className={`px-3 py-2 text-sm font-body border-b-2 ${
              section === 'teams'
                ? 'border-cinder text-charcoal font-medium'
                : 'border-transparent text-graphite hover:text-charcoal'
            }`}
          >
            Teams
          </button>
        </div>

        {section === 'results' ? <ResultsEntryForm /> : <TeamsEntryForm />}
      </main>
    </div>
  )
}
