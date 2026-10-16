import React, { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'

function Flashcards({ cards }) {
  // ignore malformed cards coming from the AI
  const validCards = useMemo(
    () =>
      (Array.isArray(cards) ? cards : []).filter(
        (c) => c && typeof c.front === 'string' && typeof c.back === 'string'
      ),
    [cards]
  )

  const [deck, setDeck] = useState(validCards)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [known, setKnown] = useState({}) // { [front]: true }

  if (deck.length === 0) return null

  const card = deck[index]
  const knownCount = deck.filter((c) => known[c.front]).length

  const go = (step) => {
    setFlipped(false)
    setIndex((i) => (i + step + deck.length) % deck.length)
  }

  const shuffle = () => {
    const copy = [...deck]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]]
    }
    setDeck(copy)
    setIndex(0)
    setFlipped(false)
  }

  const reset = () => {
    setDeck(validCards)
    setKnown({})
    setIndex(0)
    setFlipped(false)
  }

  const markKnown = () => {
    setKnown((k) => ({ ...k, [card.front]: !k[card.front] }))
  }

  return (
    <div>
      <div className='flex items-center justify-between mb-3 text-sm text-gray-600 dark:text-gray-400'>
        <span>Card {index + 1} of {deck.length}</span>
        <span>✅ Known: {knownCount}/{deck.length}</span>
      </div>

      <AnimatePresence mode='wait'>
        <motion.div
          key={`${index}-${flipped}-${card.front}`}
          initial={{ opacity: 0, rotateX: -25 }}
          animate={{ opacity: 1, rotateX: 0 }}
          exit={{ opacity: 0, rotateX: 25 }}
          transition={{ duration: 0.18 }}
          onClick={() => setFlipped((f) => !f)}
          className={`cursor-pointer select-none min-h-48 rounded-2xl p-8
            flex flex-col items-center justify-center text-center border shadow-sm
            ${flipped
              ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950 dark:border-emerald-800'
              : 'bg-indigo-50 border-indigo-200 dark:bg-indigo-950 dark:border-indigo-800'}`}
        >
          <span className={`text-xs font-semibold uppercase tracking-wider mb-3
            ${flipped ? 'text-emerald-600 dark:text-emerald-400' : 'text-indigo-600 dark:text-indigo-400'}`}>
            {flipped ? 'Answer' : 'Question'}
          </span>
          <p className='text-lg font-medium text-gray-800 dark:text-gray-100'>
            {flipped ? card.back : card.front}
          </p>
          <span className='mt-4 text-xs text-gray-400'>Tap the card to {flipped ? 'see the question' : 'reveal the answer'}</span>
        </motion.div>
      </AnimatePresence>

      <div className='flex flex-wrap items-center justify-center gap-2 mt-4'>
        <button onClick={() => go(-1)} className='px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'>← Prev</button>
        <button onClick={markKnown} className={`px-4 py-2 rounded-lg text-sm font-medium ${known[card.front]
          ? 'bg-emerald-600 text-white'
          : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-900 dark:text-emerald-200'}`}>
          {known[card.front] ? '✅ Known' : 'Mark as known'}
        </button>
        <button onClick={() => go(1)} className='px-4 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'>Next →</button>
      </div>

      <div className='flex justify-center gap-4 mt-3 text-xs'>
        <button onClick={shuffle} className='text-indigo-600 hover:underline dark:text-indigo-400'>🔀 Shuffle</button>
        <button onClick={reset} className='text-gray-500 hover:underline'>↺ Reset</button>
      </div>
    </div>
  )
}

export default Flashcards