import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 5000;
const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY || "AIzaSyDSjsB-UygGW13JJJoRopDUwDZON3wCTjw";

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json());

const createGoogleGenerativeUrl = (key) =>
    `https://generativelanguage.googleapis.com/v1beta2/models/text-bison-001:generate?key=${key}`;

app.post("/ai-chat", async (req, res) => {
    const prompt = req.body?.prompt?.text;
    if (!prompt) {
        return res.status(400).json({ error: "Prompt text is required." });
    }

    try {
        const response = await fetch(createGoogleGenerativeUrl(GOOGLE_API_KEY), {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(req.body),
        });

        const data = await response.json();
        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.json(data);
    } catch (error) {
        console.error("AI proxy error:", error);
        return res.status(500).json({ error: "Unable to reach the AI service." });
    }
});

app.listen(PORT, () => {
    console.log(`AI proxy server listening on http://localhost:${PORT}`);
});
