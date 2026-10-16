import crypto from "crypto"
import Notes from "../models/notes.model.js"
import UserModel from "../models/user.model.js"

const LIST_FIELDS = "topic classLevel examType language revisionMode includeDiagram includeChart isFavorite tags createdAt"

const cleanTags = (tags) =>
    [...new Set(
        tags
            .map((t) => String(t).trim().toLowerCase().slice(0, 30))
            .filter(Boolean)
    )].slice(0, 10)


export const getMyNotes = async (req, res) => {
    try {
        const notes = await Notes.find({ user: req.userId }).select(LIST_FIELDS).sort({ createdAt: -1 })
        if (!notes) {
            return res.status(404).json({
                error: "Notes not found"
            });
        }

        return res.status(200).json(notes)
    } catch (error) {
        return res.status(500).json({ message: `getCurrentUser notes error  ${error}` })
    }
}

export const getSingleNotes = async (req, res) => {
    try {
        const notes = await Notes.findOne({
            _id: req.params.id,
            user: req.userId
        })
        if (!notes) {
            return res.status(404).json({
                error: "Notes not found"
            });
        }
        return res.json({
            content: notes.content,
            topic: notes.topic,
            createdAt: notes.createdAt,
            language: notes.language,
            isFavorite: notes.isFavorite,
            tags: notes.tags,
            isPublic: notes.isPublic,
            shareId: notes.isPublic ? notes.shareId : null,
            quizScores: notes.quizScores
        });
    } catch (error) {
        return res.status(500).json({ message: `getSingle notes error  ${error}` })
    }
}

// PUT /api/notes/:id   body: { topic?, isFavorite?, tags? }
export const updateNote = async (req, res) => {
    try {
        const { topic, isFavorite, tags } = req.body
        const updates = {}

        if (topic !== undefined) {
            const title = String(topic).trim().slice(0, 150)
            if (!title) {
                return res.status(400).json({ message: "Title cannot be empty" })
            }
            updates.topic = title
        }
        if (typeof isFavorite === "boolean") updates.isFavorite = isFavorite
        if (Array.isArray(tags)) updates.tags = cleanTags(tags)

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ message: "Nothing to update" })
        }

        const note = await Notes.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { $set: updates },
            { new: true }
        ).select(LIST_FIELDS)

        if (!note) {
            return res.status(404).json({ error: "Notes not found" })
        }
        return res.json(note)
    } catch (error) {
        return res.status(500).json({ message: `update notes error  ${error}` })
    }
}

// DELETE /api/notes/:id
export const deleteNote = async (req, res) => {
    try {
        const note = await Notes.findOneAndDelete({ _id: req.params.id, user: req.userId })
        if (!note) {
            return res.status(404).json({ error: "Notes not found" })
        }
        await UserModel.findByIdAndUpdate(req.userId, { $pull: { notes: note._id } })
        return res.json({ message: "Notes deleted", id: note._id })
    } catch (error) {
        return res.status(500).json({ message: `delete notes error  ${error}` })
    }
}

// PUT /api/notes/:id/share   body: { isPublic: boolean }
export const toggleShare = async (req, res) => {
    try {
        const { isPublic } = req.body
        if (typeof isPublic !== "boolean") {
            return res.status(400).json({ message: "isPublic must be true or false" })
        }

        const note = await Notes.findOne({ _id: req.params.id, user: req.userId })
        if (!note) {
            return res.status(404).json({ error: "Notes not found" })
        }

        if (isPublic && !note.shareId) {
            note.shareId = crypto.randomBytes(8).toString("hex")
        }
        note.isPublic = isPublic
        await note.save()

        return res.json({
            isPublic: note.isPublic,
            shareId: note.isPublic ? note.shareId : null
        })
    } catch (error) {
        return res.status(500).json({ message: `share notes error  ${error}` })
    }
}

// GET /api/notes/shared/:shareId   (public, no login needed)
export const getSharedNote = async (req, res) => {
    try {
        const note = await Notes.findOne({ shareId: req.params.shareId, isPublic: true })
        if (!note) {
            return res.status(404).json({ error: "This shared note does not exist or is no longer public" })
        }
        // never expose the owner
        return res.json({
            content: note.content,
            topic: note.topic,
            language: note.language,
            createdAt: note.createdAt
        })
    } catch (error) {
        return res.status(500).json({ message: `shared notes error  ${error}` })
    }
}

// POST /api/notes/:id/quiz-score   body: { score, total }
export const saveQuizScore = async (req, res) => {
    try {
        const score = Number(req.body.score)
        const total = Number(req.body.total)

        if (!Number.isInteger(score) || !Number.isInteger(total) || total <= 0 || score < 0 || score > total) {
            return res.status(400).json({ message: "Invalid score" })
        }

        const note = await Notes.findOneAndUpdate(
            { _id: req.params.id, user: req.userId },
            { $push: { quizScores: { $each: [{ score, total }], $slice: -20 } } },
            { new: true }
        ).select("quizScores")

        if (!note) {
            return res.status(404).json({ error: "Notes not found" })
        }
        return res.json({ quizScores: note.quizScores })
    } catch (error) {
        return res.status(500).json({ message: `quiz score error  ${error}` })
    }
}