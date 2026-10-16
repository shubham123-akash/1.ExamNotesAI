import axios from "axios"
import { serverUrl } from "../App"
import { setUserData } from "../redux/userSlice"

export const getCurrentUser = async (dispatch) => {
    try {
        const result = await axios.get(serverUrl + "/api/user/currentuser" , {withCredentials:true})
        
        dispatch(setUserData(result.data))
    } catch (error) {
        console.log(error)
    }
}

export const generateNotes = async (payload) => {
    try {
        const result = await axios.post(serverUrl+ "/api/notes/generate-notes" , payload , {withCredentials:true})
        console.log(result.data)
        return result.data

    } catch (error) {
        console.log(error)
    }
}

export const downloadPdf = async (result) => {
    try {
        const response = await axios.post(serverUrl+ "/api/pdf/generate-pdf" , {result} , {
            responseType:"blob" , withCredentials:true
        })

        const blob = new Blob([response.data], {
      type: "application/pdf"
    });

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "ExamNotesAI.pdf";
    link.click();

    window.URL.revokeObjectURL(url);
    } catch (error) {
         throw new Error("PDF download failed");

    }
}

// ---------- notes management ----------

export const updateNote = async (id, updates) => {
    const res = await axios.put(serverUrl + `/api/notes/${id}`, updates, { withCredentials: true })
    return res.data
}

export const deleteNote = async (id) => {
    const res = await axios.delete(serverUrl + `/api/notes/${id}`, { withCredentials: true })
    return res.data
}

export const setNoteShare = async (id, isPublic) => {
    const res = await axios.put(serverUrl + `/api/notes/${id}/share`, { isPublic }, { withCredentials: true })
    return res.data
}

export const fetchSharedNote = async (shareId) => {
    const res = await axios.get(serverUrl + `/api/notes/shared/${shareId}`)
    return res.data
}

export const saveQuizScore = async (id, score, total) => {
    const res = await axios.post(serverUrl + `/api/notes/${id}/quiz-score`, { score, total }, { withCredentials: true })
    return res.data
}