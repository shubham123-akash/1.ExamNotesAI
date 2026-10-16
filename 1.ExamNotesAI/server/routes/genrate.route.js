import express from "express"
import isAuth from "../middleware/isAuth.js"
import { generateNotes } from "../controllers/generate.controller.js"
import {
    getMyNotes,
    getSingleNotes,
    updateNote,
    deleteNote,
    toggleShare,
    getSharedNote,
    saveQuizScore
} from "../controllers/notes.controller.js"



const notesRouter = express.Router()


notesRouter.post("/generate-notes",isAuth,generateNotes)
notesRouter.get("/getnotes", isAuth,getMyNotes)

// public route - must stay above "/:id"
notesRouter.get("/shared/:shareId", getSharedNote)

notesRouter.get("/:id" , isAuth , getSingleNotes)
notesRouter.put("/:id" , isAuth , updateNote)
notesRouter.delete("/:id" , isAuth , deleteNote)
notesRouter.put("/:id/share" , isAuth , toggleShare)
notesRouter.post("/:id/quiz-score" , isAuth , saveQuizScore)

export default notesRouter