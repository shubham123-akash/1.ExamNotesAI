import React, { useMemo, useState } from 'react'

function Quiz({ questions, previousScores = [], onFinish }) {
  // ignore malformed questions coming from the AI
  const valid = useMemo(
    () =>
      (Array.isArray(questions) ? questions : []).filter(
        (q) =>
          q &&
          typeof q.question === 'string' &&
          Array.isArray(q.options) &&
          q.options.length >= 2 &&
          Number.isInteger(q.answerIndex) &&
          q.answerIndex >= 0 &&
          q.answerIndex < q.options.length
      ),
    [questions]
  )

  const [current, setCurrent] = useState(0)
  const [selected, setSelected] = useState(null)
  const [answers, setAnswers] = useState([]) // chosen option index per question
  const [finished, setFinished] = useState(false)
  const [started, setStarted] = useState(false)

  if (valid.length === 0) return null

  const best = previousScores.length
    ? Math.max(...previousScores.map((s) => Math.round((s.score / s.total) * 100)))
    : null

  const q = valid[current]
  const answered = selected !== null

  const choose = (i) => {
    if (answered) return
    setSelected(i)
  }

  const next = () => {
    const updated = [...answers, selected]
    setAnswers(updated)

    if (current + 1 < valid.length) {
      setCurrent(current + 1)
      setSelected(null)
    } else {
      const score = updated.filter((a, idx) => a === valid[idx].answerIndex).length
      setFinished(true)
      if (onFinish) onFinish(score, valid.length)
    }
  }

  const restart = () => {
    setCurrent(0)
    setSelected(null)
    setAnswers([])
    setFinished(false)
  }

  // ---------- intro ----------
  if (!started) {
    return (
      <div className='text-center py-6'>
        <p className='text-gray-700 dark:text-gray-300'>
          {valid.length} multiple choice questions on this topic.
        </p>
        {best !== null && (
          <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
            Your best score: {best}% ({previousScores.length} attempt{previousScores.length > 1 ? 's' : ''})
          </p>
        )}
        <button
          onClick={() => setStarted(true)}
          className='mt-4 px-6 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700'
        >
          Start Quiz
        </button>
      </div>
    )
  }

  // ---------- result ----------
  if (finished) {
    const score = answers.filter((a, i) => a === valid[i].answerIndex).length
    const percent = Math.round((score / valid.length) * 100)
    return (
      <div>
        <div className='text-center py-4'>
          <p className='text-4xl font-bold text-indigo-600 dark:text-indigo-400'>{score}/{valid.length}</p>
          <p className='text-gray-600 dark:text-gray-400 mt-1'>
            {percent >= 80 ? '🎉 Excellent!' : percent >= 50 ? '👍 Good, keep revising' : '📚 Needs more revision'} ({percent}%)
          </p>
        </div>

        <div className='space-y-3 mt-4'>
          {valid.map((item, i) => {
            const correct = answers[i] === item.answerIndex
            return (
              <div key={i} className={`rounded-lg border p-3 text-sm
                ${correct
                  ? 'border-emerald-200 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950'
                  : 'border-rose-200 bg-rose-50 dark:border-rose-800 dark:bg-rose-950'}`}>
                <p className='font-medium text-gray-800 dark:text-gray-100'>{i + 1}. {item.question}</p>
                {!correct && (
                  <p className='text-rose-600 dark:text-rose-300 mt-1'>Your answer: {item.options[answers[i]]}</p>
                )}
                <p className='text-emerald-700 dark:text-emerald-300 mt-1'>Correct: {item.options[item.answerIndex]}</p>
                {item.explanation && <p className='text-gray-600 dark:text-gray-400 mt-1'>{item.explanation}</p>}
              </div>
            )
          })}
        </div>

        <div className='text-center mt-4'>
          <button onClick={restart} className='px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700'>
            ↺ Try again
          </button>
        </div>
      </div>
    )
  }

  // ---------- question ----------
  return (
    <div>
      <div className='flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2'>
        <span>Question {current + 1} of {valid.length}</span>
      </div>
      <div className='w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 mb-4 overflow-hidden'>
        <div
          className='h-full bg-indigo-500 transition-all'
          style={{ width: `${((current + (answered ? 1 : 0)) / valid.length) * 100}%` }}
        />
      </div>

      <p className='text-lg font-medium text-gray-800 dark:text-gray-100 mb-4'>{q.question}</p>

      <div className='space-y-2'>
        {q.options.map((opt, i) => {
          let style = 'border-gray-200 bg-white hover:bg-gray-50 text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-100'
          if (answered) {
            if (i === q.answerIndex) style = 'border-emerald-400 bg-emerald-50 text-emerald-800 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-200'
            else if (i === selected) style = 'border-rose-400 bg-rose-50 text-rose-800 dark:border-rose-600 dark:bg-rose-950 dark:text-rose-200'
            else style = 'border-gray-200 bg-white text-gray-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-500'
          }
          return (
            <button
              key={i}
              onClick={() => choose(i)}
              disabled={answered}
              className={`w-full text-left px-4 py-3 rounded-lg border transition ${style}`}
            >
              <span className='font-semibold mr-2'>{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          )
        })}
      </div>

      {answered && (
        <div className='mt-4'>
          <p className={`text-sm font-medium ${selected === q.answerIndex ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {selected === q.answerIndex ? '✅ Correct!' : '❌ Not quite.'}
          </p>
          {q.explanation && <p className='text-sm text-gray-600 dark:text-gray-400 mt-1'>{q.explanation}</p>}
          <button onClick={next} className='mt-3 px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700'>
            {current + 1 < valid.length ? 'Next →' : 'See result'}
          </button>
        </div>
      )}
    </div>
  )
}

export default Quiz