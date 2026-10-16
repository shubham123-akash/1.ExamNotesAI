import axios from 'axios'
import React, { useEffect, useMemo, useState } from 'react'
import { serverUrl } from '../App'
import { AnimatePresence, motion } from "motion/react"
import { useNavigate } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { GiHamburgerMenu } from "react-icons/gi";
import FinalResult from '../components/FinalResult'
import ThemeToggle from '../components/ThemeToggle'
import { deleteNote, updateNote } from '../services/api'

function History() {
  const [topics, setTopics] = useState([])
  const navigate = useNavigate()
  const { userData } = useSelector((state) => state.user)
  const credits = userData.credits
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeNoteId, setActiveNoteId] = useState(null);

  const [selectedNote, setSelectedNote] = useState(null);
  const [selectedMeta, setSelectedMeta] = useState(null); // share info + quiz scores
  const [loading, setLoading] = useState(false);

  // search + filters
  const [query, setQuery] = useState("")
  const [examFilter, setExamFilter] = useState("all")
  const [tagFilter, setTagFilter] = useState("all")
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  useEffect(() => {
    const myNotes = async () => {
      try {
        const res = await axios.get(serverUrl + "/api/notes/getnotes", { withCredentials: true })
        setTopics(Array.isArray(res.data) ? res.data : [])

      } catch (error) {
        console.log(error)
      }
    }
    myNotes()
  }, [])

  const openNotes = async (noteId) => {
    setLoading(true)
    setActiveNoteId(noteId)
    try {
      const res = await axios.get(serverUrl + `/api/notes/${noteId}`, { withCredentials: true })

      setSelectedNote(res.data.content)
      setSelectedMeta({
        isPublic: res.data.isPublic,
        shareId: res.data.shareId,
        quizScores: res.data.quizScores || [],
      })
      setLoading(false)
      if (window.innerWidth < 1024) setIsSidebarOpen(false)
    } catch (error) {
      console.log(error)
      setLoading(false)
    }
  }

  useEffect(() => {
    if (window.innerWidth >= 1024) {
      setIsSidebarOpen(true)
    }
  }, [])

  // ---------- filter options + filtered list ----------
  const examTypes = useMemo(
    () => [...new Set(topics.map((t) => t.examType).filter(Boolean))],
    [topics]
  )
  const allTags = useMemo(
    () => [...new Set(topics.flatMap((t) => t.tags || []))],
    [topics]
  )

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase()
    return topics.filter((t) => {
      if (onlyFavorites && !t.isFavorite) return false
      if (examFilter !== "all" && t.examType !== examFilter) return false
      if (tagFilter !== "all" && !(t.tags || []).includes(tagFilter)) return false
      if (!q) return true
      const haystack = [t.topic, t.examType, t.classLevel, ...(t.tags || [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [topics, query, examFilter, tagFilter, onlyFavorites])

  const hasActiveFilter = query || examFilter !== "all" || tagFilter !== "all" || onlyFavorites
  const clearFilters = () => {
    setQuery("")
    setExamFilter("all")
    setTagFilter("all")
    setOnlyFavorites(false)
  }

  // ---------- note actions ----------
  const patchLocal = (id, patch) =>
    setTopics((list) => list.map((t) => (t._id === id ? { ...t, ...patch } : t)))

  const saveUpdate = async (id, updates) => {
    const before = topics.find((t) => t._id === id)
    patchLocal(id, updates) // optimistic
    try {
      const saved = await updateNote(id, updates)
      patchLocal(id, saved)
    } catch (error) {
      console.log(error)
      if (before) patchLocal(id, before) // roll back
      alert("Could not save your change. Please try again.")
    }
  }

  const toggleFavorite = (note, e) => {
    e.stopPropagation()
    saveUpdate(note._id, { isFavorite: !note.isFavorite })
  }

  const removeNote = async (note, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm(`Delete "${note.topic}"? This cannot be undone.`)) return
    try {
      await deleteNote(note._id)
      setTopics((list) => list.filter((t) => t._id !== note._id))
      if (activeNoteId === note._id) {
        setActiveNoteId(null)
        setSelectedNote(null)
        setSelectedMeta(null)
      }
    } catch (error) {
      console.log(error)
      alert("Could not delete this note. Please try again.")
    }
  }

  const activeTopic = topics.find((t) => t._id === activeNoteId)

  return (
    <div className='min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-950 dark:to-gray-900 px-6 py-8'>

      <motion.header
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="
      mb-10
      rounded-2xl
      bg-black/80 backdrop-blur-xl
      border border-white/10
      px-8 py-6 items-start
      flex justify-between md:items-center gap-4 flex-wrap 
      shadow-[0_20px_45px_rgba(0,0,0,0.6)]
    ">
        <div onClick={() => navigate("/")} className='cursor-pointer'>
          <h1 className='text-2xl font-bold
                  bg-linear-to-r from-white via-gray-300 to-white
                  bg-clip-text text-transparent'>ExamNotes AI</h1>
          <p className='text-sm text-gray-300 mt-1'>AI-powered exam-oriented notes & revision</p>
        </div>

        <div className='flex items-center gap-4 '>

          {!isSidebarOpen && <button onClick={() => setIsSidebarOpen(true)} className='lg:hidden text-white text-2xl'><GiHamburgerMenu /></button>}
          <ThemeToggle />
          <button className='flex items-center gap-2 
          px-4 py-2 rounded-full
          bg-white/10
          border border-white/20
          text-white text-sm' onClick={() => navigate("/pricing")}>
            <span className='text-xl'>💠</span>
            <span>{credits}</span>
            <motion.span whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.97 }}
              className='ml-2 h-5 w-5 flex items-center justify-center
                              rounded-full bg-white  text-xs font-bold'
            >
              ➕
            </motion.span>
          </button>

        </div>

      </motion.header>


      <div className='grid grid-cols-1 lg:grid-cols-4 gap-6'>
        <AnimatePresence>

          {isSidebarOpen &&
            <motion.div
              initial={{ x: -320 }}
              animate={{ x: 0 }}
              exit={{ x: -320 }}
              transition={{ type: "spring", stiffness: 260, damping: 30 }}
              className='fixed lg:static
            top-0 left-0 z-50 lg:z-auto
            w-72 lg:w-auto
            h-full lg:h-[75vh]
            lg:rounded-3xl
            lg:col-span-1
            bg-black/90 lg:bg-black/80
            backdrop-blur-xl 
            border border-white/10
            shadow-[0_20px_45px_rgba(0,0,0,0.6)]
            p-5
            overflow-y-auto'>
              <button onClick={() => setIsSidebarOpen(false)} className='lg:hidden text-white mb-4'>
                ⬅️ back
              </button>

              <div className='mb-4 space-y-1'>
                <button onClick={() => navigate("/notes")} className='w-full px-3 py-2 rounded-lg text-sm text-gray-200 bg-white/10  text-start hover:bg-white/20'>
                  ➕ New Notes
                </button>

                <hr className="border-white/10 mb-4" />


                <h2 className='mb-3 text-lg font-bold bg-gradient-to-r from-white via-gray-300 to-white bg-clip-text text-transparent'>
                  📚 Your Notes
                </h2>

                {/* ---------- search + filters ---------- */}
                {topics.length > 0 && (
                  <div className='mb-4 space-y-2'>
                    <input
                      type="text"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="🔍 Search topic, exam, tag…"
                      className='w-full px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/30'
                    />

                    <div className='flex flex-wrap gap-2'>
                      <button
                        onClick={() => setOnlyFavorites((v) => !v)}
                        className={`px-3 py-1 rounded-full text-xs border transition ${onlyFavorites
                          ? 'bg-yellow-400/30 border-yellow-300 text-yellow-200'
                          : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10'}`}
                      >
                        ⭐ Favorites
                      </button>

                      {examTypes.length > 0 && (
                        <select
                          value={examFilter}
                          onChange={(e) => setExamFilter(e.target.value)}
                          className='px-2 py-1 rounded-full text-xs bg-white/10 border border-white/20 text-gray-200 focus:outline-none'
                        >
                          <option value="all" className='text-black'>All exams</option>
                          {examTypes.map((x) => (
                            <option key={x} value={x} className='text-black'>{x}</option>
                          ))}
                        </select>
                      )}

                      {allTags.length > 0 && (
                        <select
                          value={tagFilter}
                          onChange={(e) => setTagFilter(e.target.value)}
                          className='px-2 py-1 rounded-full text-xs bg-white/10 border border-white/20 text-gray-200 focus:outline-none'
                        >
                          <option value="all" className='text-black'>All tags</option>
                          {allTags.map((x) => (
                            <option key={x} value={x} className='text-black'>#{x}</option>
                          ))}
                        </select>
                      )}
                    </div>

                    {hasActiveFilter && (
                      <button onClick={clearFilters} className='text-xs text-gray-400 hover:text-white underline'>
                        Clear filters ({filteredTopics.length} of {topics.length} shown)
                      </button>
                    )}
                  </div>
                )}

                {topics.length === 0 && (
                  <p className="text-sm text-gray-400">No notes created yet</p>
                )}

                {topics.length > 0 && filteredTopics.length === 0 && (
                  <p className="text-sm text-gray-400">No notes match your search</p>
                )}

                <ul className='space-y-3'>

                  {filteredTopics.map((t) => (
                    <li key={t._id} onClick={() => openNotes(t._id)} className={`
    cursor-pointer rounded-xl p-3 border transition-all
    ${activeNoteId === t._id
                        ? "bg-indigo-500/30 border-indigo-400 shadow-[0_0_0_1px_rgba(99,102,241,0.6)]"
                        : "bg-white/5 border-white/10 hover:bg-white/10"
                      }
  `}>

                      <div className='flex items-start justify-between gap-2'>
                        <p className='text-sm font-semibold text-white break-words min-w-0'>{t.topic}</p>
                        <div className='flex items-center gap-1 shrink-0'>
                          <button
                            onClick={(e) => toggleFavorite(t, e)}
                            title={t.isFavorite ? "Remove from favorites" : "Add to favorites"}
                            className={`text-base leading-none ${t.isFavorite ? "" : "grayscale opacity-50 hover:opacity-100"}`}
                          >⭐</button>
                          <button
                            onClick={(e) => removeNote(t, e)}
                            title="Delete note"
                            className='text-base leading-none opacity-50 hover:opacity-100'
                          >🗑️</button>
                        </div>
                      </div>

                      <div className='flex flex-wrap gap-2 mt-2 text-xs'>

                        {t.classLevel && <span className='px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300'>ClassLevel : {t.classLevel}</span>}

                        {t.examType && <span className='px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300'> {t.examType}</span>}

                        {t.language && t.language !== "English" && <span className='px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300'>🌐 {t.language}</span>}

                        {(t.tags || []).map((tag) => (
                          <span key={tag} className='px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300'>#{tag}</span>
                        ))}

                      </div>

                      <div className='flex gap-3 mt-2 text-xs text-gray-300'>

                        {t.revisionMode && <span>⚡ Revision</span>}
                        {t.includeDiagram && <span>📊 Diagram</span>}
                        {t.includeChart && <span>📈 Chart</span>}
                      </div>

                    </li>
                  ))}

                </ul>
              </div>

            </motion.div>}
        </AnimatePresence>


        <motion.div

          initial={{ opacity: 0, y: -15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className='lg:col-span-3
        rounded-2xl
        bg-white dark:bg-gray-900
        shadow-[0_15px_40px_rgba(0,0,0,0.15)]
        p-6
        min-h-[75vh]'

        >
          {loading && <p className="text-center text-gray-500">Loading notes…</p>}
          {!loading && !selectedNote && (
            <div className="h-full flex items-center justify-center text-gray-400">
              Select a topic from the Sidebar
            </div>
          )}

          {!loading && selectedNote && activeTopic && (
            <NoteHeader
              key={activeTopic._id}
              note={activeTopic}
              onRename={(title) => saveUpdate(activeTopic._id, { topic: title })}
              onTagsChange={(tags) => saveUpdate(activeTopic._id, { tags })}
              onDelete={() => removeNote(activeTopic)}
            />
          )}

          {!loading && selectedNote && (
            <FinalResult
              key={activeNoteId}
              result={selectedNote}
              noteId={activeNoteId}
              initialIsPublic={selectedMeta?.isPublic}
              initialShareId={selectedMeta?.shareId}
              initialQuizScores={selectedMeta?.quizScores}
            />
          )}

        </motion.div>
      </div>

    </div>
  )
}


// Title (rename) + tags editor shown above the opened note
function NoteHeader({ note, onRename, onTagsChange, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.topic)
  const [tagInput, setTagInput] = useState("")

  const tags = note.tags || []

  const submitRename = () => {
    const clean = title.trim()
    setEditing(false)
    if (!clean) {
      setTitle(note.topic)
      return
    }
    if (clean !== note.topic) onRename(clean)
  }

  const addTag = () => {
    const clean = tagInput.trim().toLowerCase().replace(/^#/, "")
    setTagInput("")
    if (!clean || tags.includes(clean) || tags.length >= 10) return
    onTagsChange([...tags, clean])
  }

  const removeTag = (tag) => onTagsChange(tags.filter((t) => t !== tag))

  return (
    <div className='pb-4 mb-2 border-b border-gray-200 dark:border-gray-700 space-y-3'>
      <div className='flex items-center justify-between gap-3 flex-wrap'>
        {editing ? (
          <input
            autoFocus
            value={title}
            maxLength={150}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename()
              if (e.key === "Escape") { setTitle(note.topic); setEditing(false) }
            }}
            className='flex-1 min-w-0 px-3 py-1.5 rounded-lg border border-indigo-300 bg-white text-gray-900 dark:bg-gray-800 dark:text-gray-100 dark:border-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-300'
          />
        ) : (
          <h3 className='text-xl font-semibold text-gray-800 dark:text-gray-100 break-words min-w-0'>
            {note.topic}
          </h3>
        )}

        <div className='flex items-center gap-2'>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className='px-3 py-1.5 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700'
            >
              ✏️ Rename
            </button>
          )}
          <button
            onClick={onDelete}
            className='px-3 py-1.5 rounded-lg text-sm bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950 dark:text-red-300 dark:hover:bg-red-900'
          >
            🗑️ Delete
          </button>
        </div>
      </div>

      <div className='flex flex-wrap items-center gap-2'>
        {tags.map((tag) => (
          <span key={tag} className='inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-200'>
            #{tag}
            <button onClick={() => removeTag(tag)} className='hover:text-red-600' title="Remove tag">✕</button>
          </span>
        ))}

        {tags.length < 10 && (
          <input
            value={tagInput}
            maxLength={30}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") addTag() }}
            onBlur={addTag}
            placeholder="+ add tag"
            className='w-28 px-2 py-0.5 rounded-full text-xs border border-gray-300 bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-600 focus:outline-none focus:ring-1 focus:ring-indigo-300'
          />
        )}
      </div>
    </div>
  )
}

export default History