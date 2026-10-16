import React, { useEffect, useState } from 'react'

// Adds / removes the "dark" class on <html> and remembers the choice.
function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
    try {
      localStorage.setItem('theme', dark ? 'dark' : 'light')
    } catch { /* ignore */ }
  }, [dark])

  return (
    <button
      type="button"
      onClick={() => setDark((d) => !d)}
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label="Toggle dark mode"
      className='h-10 w-10 flex items-center justify-center rounded-full
        bg-white/10 border border-white/20 text-white text-lg
        hover:bg-white/20 transition'
    >
      {dark ? '☀️' : '🌙'}
    </button>
  )
}

export default ThemeToggle