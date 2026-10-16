import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import MermaidSetup from './MermaidSetup';
import RechartSetUp from './RechartSetUp';
import Flashcards from './Flashcards';
import Quiz from './Quiz';
import { downloadPdf, saveQuizScore, setNoteShare } from '../services/api';

const markDownComponent = {
    h1: ({ children }) => (
        <h1 className="text-2xl font-bold text-indigo-700 dark:text-indigo-300 mt-6 mb-4 border-b dark:border-gray-700 pb-2">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400 mt-5 mb-3">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mt-4 mb-2">
            {children}
        </h3>
    ),
    p: ({ children }) => (
        <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-3">
            {children}
        </p>
    ),
    ul: ({ children }) => (
        <ul className="list-disc ml-6 space-y-1 text-gray-700 dark:text-gray-300">
            {children}
        </ul>
    ),
    li: ({ children }) => (
        <li className="marker:text-indigo-500">{children}</li>
    ),
}

// Plain-text version of the notes, used by the "Copy" button
const buildPlainText = (result) => {
    const lines = []

    lines.push("SUB TOPICS")
    Object.entries(result.subTopics).forEach(([star, topics]) => {
        lines.push(`${star} Priority`)
        topics.forEach((t) => lines.push(`  - ${t}`))
    })

    lines.push("", "NOTES", result.notes || "")

    lines.push("", "REVISION POINTS")
    result.revisionPoints.forEach((p) => lines.push(`- ${p}`))

    lines.push("", "SHORT QUESTIONS")
    result.questions.short.forEach((q, i) => lines.push(`${i + 1}. ${q}`))

    lines.push("", "LONG QUESTIONS")
    result.questions.long.forEach((q, i) => lines.push(`${i + 1}. ${q}`))

    if (Array.isArray(result.flashcards) && result.flashcards.length) {
        lines.push("", "FLASHCARDS")
        result.flashcards.forEach((c) => lines.push(`Q: ${c.front}`, `A: ${c.back}`, ""))
    }

    return lines.join("\n")
}

const copyToClipboard = async (text) => {
    try {
        await navigator.clipboard.writeText(text)
        return true
    } catch {
        // fallback for older browsers / non-https
        try {
            const area = document.createElement("textarea")
            area.value = text
            area.style.position = "fixed"
            area.style.opacity = "0"
            document.body.appendChild(area)
            area.select()
            const ok = document.execCommand("copy")
            document.body.removeChild(area)
            return ok
        } catch {
            return false
        }
    }
}

function ShareControl({ noteId, initialIsPublic, initialShareId }) {
    const [isPublic, setIsPublic] = useState(!!initialIsPublic)
    const [shareId, setShareId] = useState(initialShareId || null)
    const [busy, setBusy] = useState(false)
    const [message, setMessage] = useState("")

    const flash = (text) => {
        setMessage(text)
        setTimeout(() => setMessage(""), 2500)
    }

    const link = shareId ? `${window.location.origin}/shared/${shareId}` : ""

    const handleShare = async () => {
        if (busy) return
        setBusy(true)
        try {
            let id = shareId
            if (!isPublic) {
                const data = await setNoteShare(noteId, true)
                id = data.shareId
                setIsPublic(true)
                setShareId(id)
            }
            const ok = await copyToClipboard(`${window.location.origin}/shared/${id}`)
            flash(ok ? "🔗 Link copied!" : "Link ready - copy it from below")
        } catch (error) {
            console.log(error)
            flash("Could not share this note")
        }
        setBusy(false)
    }

    const handleUnshare = async () => {
        if (busy) return
        setBusy(true)
        try {
            await setNoteShare(noteId, false)
            setIsPublic(false)
            flash("Sharing turned off")
        } catch (error) {
            console.log(error)
            flash("Could not stop sharing")
        }
        setBusy(false)
    }

    return (
        <div className='flex flex-col items-start gap-1'>
            <div className='flex items-center gap-2'>
                <button onClick={handleShare} disabled={busy}
                    className='px-4 py-2 rounded-lg text-sm font-medium bg-sky-100 text-sky-700 hover:bg-sky-200 dark:bg-sky-900 dark:text-sky-200 dark:hover:bg-sky-800 disabled:opacity-60'>
                    {isPublic ? "🔗 Copy share link" : "🔗 Share"}
                </button>
                {isPublic && (
                    <button onClick={handleUnshare} disabled={busy}
                        className='text-xs text-gray-500 hover:text-red-600 underline'>
                        Stop sharing
                    </button>
                )}
            </div>
            {message && <span className='text-xs text-gray-500 dark:text-gray-400'>{message}</span>}
            {isPublic && !message && (
                <span className='text-xs text-gray-400 break-all max-w-xs'>{link}</span>
            )}
        </div>
    )
}

function FinalResult({
    result,
    noteId = null,          // id of the saved note (needed for share + quiz scores)
    readOnly = false,       // true on the public shared page
    initialIsPublic = false,
    initialShareId = null,
    initialQuizScores = [],
}) {
    const [quickRevision, setQuickRevision] = useState(false);
    const [copied, setCopied] = useState(false);
    const [quizScores, setQuizScores] = useState(initialQuizScores || []);

    if (
        !result ||
        !result.subTopics ||
        !result.questions ||
        !result.questions.short ||
        !result.questions.long ||
        !result.revisionPoints
    ) {
        return null;
    }

    const handleCopy = async () => {
        const ok = await copyToClipboard(buildPlainText(result))
        if (ok) {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handleQuizFinish = async (score, total) => {
        if (!noteId || readOnly) return
        try {
            const data = await saveQuizScore(noteId, score, total)
            if (Array.isArray(data.quizScores)) setQuizScores(data.quizScores)
        } catch (error) {
            console.log(error)
        }
    }

    const hasFlashcards = Array.isArray(result.flashcards) && result.flashcards.length > 0
    const hasQuiz = Array.isArray(result.quiz) && result.quiz.length > 0

    return (
        <div className='mt-6 p-3 space-y-10 bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100'>

            <div className='flex flex-col md:flex-row md:items-start md:justify-between gap-4'>

                <h2 className='text-3xl font-bold
          bg-gradient-to-r from-indigo-600 to-purple-600
          bg-clip-text text-transparent'>
                    📘 Generated Notes
                </h2>

                <div className='flex flex-wrap gap-3 items-start'>
                    <button onClick={() => setQuickRevision(!quickRevision)} className={`
              px-4 py-2 rounded-lg text-sm font-medium transition
              ${quickRevision
                            ? "bg-green-600 text-white"
                            : "bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900 dark:text-green-200 dark:hover:bg-green-800"}
            `}>  {quickRevision ? "Exit Revision Mode" : "Quick Revision (5 min)"}</button>

                    <button onClick={handleCopy}
                        className='px-4 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'>
                        {copied ? "✅ Copied!" : "📋 Copy"}
                    </button>

                    {!readOnly && noteId && (
                        <ShareControl
                            noteId={noteId}
                            initialIsPublic={initialIsPublic}
                            initialShareId={initialShareId}
                        />
                    )}

                    {!readOnly && (
                        <button onClick={() => downloadPdf(result)}
                            className='px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 text-white hover:bg-indigo-700'>
                            ⬇️ Download PDF
                        </button>
                    )}
                </div>
            </div>


            {!quickRevision && <section>

                <SectionHeader icon="⭐" title="Sub Topics" color="indigo" />
                {
                    Object.entries(result.subTopics).map(([star, topics]) => (
                        <div key={star} className='mb-3'>

                            <p className='font-medium text-indigo-600 dark:text-indigo-400 mb-1'>
                                {star} Priority
                            </p>
                            <ul className='list-disc ml-6 text-gray-700 dark:text-gray-300'>
                                {topics.map((t, i) => (
                                    <li key={i}>{t}</li>
                                ))}
                            </ul>
                        </div>
                    ))
                }
            </section>}


            {!quickRevision && <section>
                <SectionHeader icon="📝" title="Detailed Notes" color="purple" />
                <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6'>
                    <ReactMarkdown components={markDownComponent}>
                        {result.notes}
                    </ReactMarkdown>
                </div>
            </section>}


            {quickRevision &&
                <section className='rounded-xl bg-gradient-to-r from-green-100 to-green-50 border border-green-200 dark:from-green-950 dark:to-gray-900 dark:border-green-800 p-6'>
                    <h3 className='font-bold text-green-700 dark:text-green-300 mb-3 text-lg'>
                        ⚡ Exam Quick Revision Points
                    </h3>
                    <ul className='list-disc ml-6 space-y-1 text-gray-800 dark:text-gray-200'>
                        {result.revisionPoints.map((p, i) => (
                            <li key={i}>{p}</li>
                        ))}
                    </ul>
                </section>}


            {result.diagram?.data && <section>
                <SectionHeader icon="📊" title="Diagram" color="cyan" />

                <MermaidSetup diagram={result.diagram?.data} />
                <p className="mt-3 text-xs text-gray-500 italic">
                    ℹ️ If you need this diagram for future reference or revision,
                    you can save it by taking a screenshot.
                </p>

            </section>}


            {result.charts?.length > 0 &&
                <section>
                    <SectionHeader icon="📈" title="Visual Charts" color="indigo" />
                    <RechartSetUp charts={result.charts} />
                    <p className="mt-3 text-xs text-gray-500 italic">
                        ℹ️ If you need this Chart for future reference or revision,
                        you can save it by taking a screenshot.
                    </p>

                </section>}

            {result.charts && result.charts.length === 0 && (
                <p className="text-sm text-gray-400 italic">
                    📉 Charts are not relevant for this topic.
                </p>
            )}


            <section>
                <SectionHeader icon="❓" title="Important Questions" color="rose" />

                <p className='font-medium'>Short Questions:</p>
                <ul className='list-disc ml-6 text-gray-700 dark:text-gray-300'>
                    {result.questions.short.map((q, i) => (
                        <li key={i}>{q}</li>
                    ))}
                </ul>


                <p className='font-medium mt-4'>Long Questions:</p>
                <ul className='list-disc ml-6 text-gray-700 dark:text-gray-300'>
                    {result.questions.long.map((q, i) => (
                        <li key={i}>{q}</li>
                    ))}
                </ul>
                <p className='font-medium mt-4'>Diagram Question:</p>
                <ul className='list-disc ml-6 text-gray-700 dark:text-gray-300'>
                    <li>{result.questions.diagram}</li>
                </ul>

            </section>


            {hasFlashcards && <section>
                <SectionHeader icon="🃏" title="Flashcards" color="amber" />
                <Flashcards cards={result.flashcards} />
            </section>}


            {hasQuiz && <section>
                <SectionHeader icon="🧠" title="Practice Quiz" color="green" />
                <Quiz
                    questions={result.quiz}
                    previousScores={quizScores}
                    onFinish={handleQuizFinish}
                />
            </section>}

        </div>
    )
}


function SectionHeader({ icon, title, color }) {
    const colors = {
        indigo: "from-indigo-100 to-indigo-50 text-indigo-700 dark:from-indigo-950 dark:to-gray-900 dark:text-indigo-300",
        purple: "from-purple-100 to-purple-50 text-purple-700 dark:from-purple-950 dark:to-gray-900 dark:text-purple-300",
        blue: "from-blue-100 to-blue-50 text-blue-700 dark:from-blue-950 dark:to-gray-900 dark:text-blue-300",
        green: "from-green-100 to-green-50 text-green-700 dark:from-green-950 dark:to-gray-900 dark:text-green-300",
        cyan: "from-cyan-100 to-cyan-50 text-cyan-700 dark:from-cyan-950 dark:to-gray-900 dark:text-cyan-300",
        rose: "from-rose-100 to-rose-50 text-rose-700 dark:from-rose-950 dark:to-gray-900 dark:text-rose-300",
        amber: "from-amber-100 to-amber-50 text-amber-700 dark:from-amber-950 dark:to-gray-900 dark:text-amber-300",
    };
    return (
        <div className={`
        mb-4 px-4 py-2 rounded-lg
        bg-gradient-to-r ${colors[color]}
        font-semibold flex items-center gap-2
      `}>
            <span>{icon}</span>
            <span>{title}</span>
        </div>

    )
}

export default FinalResult