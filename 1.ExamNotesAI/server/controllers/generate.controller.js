import Notes from "../models/notes.model.js"
import UserModel from "../models/user.model.js"
import { generateGeminiResponse } from "../services/gemini.services.js"
import { buildPrompt } from "../utils/promptBuilder.js"

// must match the dropdown in TopicForm.jsx
const ALLOWED_LANGUAGES = [
    "English", "Hindi", "Bengali", "Marathi", "Gujarati", "Tamil", "Telugu",
    "Kannada", "Malayalam", "Punjabi", "Urdu", "Spanish", "French"
]

// Gemini sometimes returns answerIndex as a string ("2") or adds bad entries.
// Clean flashcards + quiz so the frontend never receives broken data.
const normalizeAiResponse = (ai) => {
    if (!ai || typeof ai !== "object") return ai

    ai.flashcards = (Array.isArray(ai.flashcards) ? ai.flashcards : []).filter(
        (c) => c && typeof c.front === "string" && typeof c.back === "string"
    )

    ai.quiz = (Array.isArray(ai.quiz) ? ai.quiz : [])
        .map((q) => ({ ...q, answerIndex: Number(q?.answerIndex) }))
        .filter(
            (q) =>
                typeof q.question === "string" &&
                Array.isArray(q.options) &&
                q.options.length >= 2 &&
                Number.isInteger(q.answerIndex) &&
                q.answerIndex >= 0 &&
                q.answerIndex < q.options.length
        )

    return ai
}

export const generateNotes = async (req, res) => {
    try {
        const {
            topic,
            classLevel,
            examType,
            revisionMode = false,
            includeDiagram = false,
            includeChart = false,
            language = "English"
        } = req.body;

        if (!topic || typeof topic !== "string" || !topic.trim()) {
            return res.status(400).json({ message: "Topic is required" })
        }

        // only accept known languages, otherwise fall back to English
        const safeLanguage = ALLOWED_LANGUAGES.includes(language) ? language : "English"

        const user = await UserModel.findById(req.userId)
        if (!user) {
            return res.status(400).json({ message: "user is not found" })
        }

        if (user.credits < 10) {
            user.isCreditAvailable = false
            await user.save()
            return res.status(403).json({
                message: "Insufficient credits"
            });
        }

        const prompt = buildPrompt({
            topic,
            classLevel,
            examType,
            revisionMode,
            includeDiagram,
            includeChart,
            language: safeLanguage
        })


        const aiResponse = normalizeAiResponse(await generateGeminiResponse(prompt))


        const notes = await Notes.create({
            user: user._id,
            topic,
            classLevel,
            examType,
            revisionMode,
            includeDiagram,
            includeChart,
            language: safeLanguage,
            content: aiResponse
        })


        user.credits -= 10;
        if (user.credits <= 0) user.isCreditAvailable = false;

        if (!Array.isArray(user.notes)) {
            user.notes = [];
        }

        user.notes.push(notes._id);

        await user.save();

        return res.status(200).json({
            data: aiResponse,
            noteId: notes._id,
            creditsLeft: user.credits
        })

    } catch (error) {
        console.error(error);
    res.status(500).json({
      error: "AI generation failed",
      message: error.message
    });

    }
}