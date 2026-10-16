import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import FinalResult from '../components/FinalResult'
import ThemeToggle from '../components/ThemeToggle'
import { fetchSharedNote } from '../services/api'

// Public, read-only page: /shared/:shareId  (no login required)
function SharedNote() {
  const { shareId } = useParams()
  const navigate = useNavigate()
  const [note, setNote] = useState(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const data = await fetchSharedNote(shareId)
        if (!cancelled) setNote(data)
      } catch (err) {
        if (!cancelled) {
          setError(err?.response?.data?.error || "Could not load this note")
        }
      }
      if (!cancelled) setLoading(false)
    }
    load()
    return () => { cancelled = true }
  }, [shareId])

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 px-6 py-8'>
      <header className='mb-8 rounded-2xl bg-black/80 border border-white/10 px-8 py-6 flex items-center justify-between gap-4 flex-wrap shadow-[0_20px_45px_rgba(0,0,0,0.6)]'>
        <div>
          <h1 className='text-2xl font-bold bg-linear-to-r from-white via-gray-300 to-white bg-clip-text text-transparent'>ExamNotes AI</h1>
          <p className='text-sm text-gray-300 mt-1'>Shared notes (read only)</p>
        </div>
        <div className='flex items-center gap-3'>
          <ThemeToggle />
          <button
            onClick={() => navigate('/')}
            className='px-4 py-2 rounded-full text-sm bg-white text-black font-medium hover:bg-gray-200'
          >
            ✨ Create your own notes
          </button>
        </div>
      </header>

      <div className='rounded-2xl bg-white dark:bg-gray-900 shadow-[0_15px_40px_rgba(0,0,0,0.15)] p-6 min-h-[60vh]'>
        {loading && <p className='text-center text-gray-500'>Loading notes…</p>}

        {!loading && error && (
          <div className='h-full flex flex-col items-center justify-center text-gray-500 py-20'>
            <span className='text-4xl mb-3'>🔒</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && note && (
          <>
            <h2 className='text-xl font-semibold text-gray-800 dark:text-gray-100'>{note.topic}</h2>
            <FinalResult result={note.content} readOnly />
          </>
        )}
      </div>
    </div>
  )
}

export default SharedNote