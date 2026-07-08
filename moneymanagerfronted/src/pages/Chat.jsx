import { useState } from "react";
import { MessageSquare } from "lucide-react";
import { API_ENDPOINTS } from "../util/apiEndpoints.js";

const Chat = () => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: "assistant",
            text: "Ask me for ideas, tips, or suggestions for managing income, expenses, categories, or savings.",
        },
    ]);
    const [loading, setLoading] = useState(false);
    const apiUrl = API_ENDPOINTS.AI_CHAT_PROXY;

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            sender: "user",
            text: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    prompt: {
                        text: input.trim(),
                    },
                    temperature: 0.4,
                    maxOutputTokens: 256,
                }),
            });

            const data = await response.json();
            if (!response.ok) {
                const errorText = data?.error?.message || data?.message || response.statusText;
                throw new Error(errorText || "AI service returned an error.");
            }

            const aiText =
                data?.candidates?.[0]?.content?.find((item) => item?.text)?.text ||
                data?.candidates?.[0]?.output ||
                data?.output?.[0]?.content?.find((item) => item?.text)?.text ||
                "Sorry, I couldn't generate a response. Please try again.";

            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: "assistant",
                    text: aiText,
                },
            ]);
        } catch (error) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: "assistant",
                    text: "Unable to reach the AI service. Please try again later.",
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-700">
                    <MessageSquare size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-semibold">AI Idea Chat</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        Get quick ideas for budgeting, categories, savings, income sources, expense planning, and more.
                    </p>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`rounded-2xl p-4 shadow-sm ${
                            message.sender === "assistant"
                                ? "bg-gray-50 text-gray-900"
                                : "bg-purple-600 text-white self-end"
                        } ${message.sender === "assistant" ? "max-w-3xl" : "max-w-2xl ml-auto"}`}
                    >
                        <p className="whitespace-pre-line">{message.text}</p>
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={4}
                    placeholder="Ask the AI for ideas, tips, or suggestions..."
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-purple-500 focus:outline-none"
                />
                <div className="flex items-center justify-between gap-4">
                    <p className="text-xs text-gray-500">
                        Sending through local AI proxy service.
                    </p>
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="inline-flex items-center justify-center rounded-full bg-purple-700 px-5 py-3 text-white transition hover:bg-purple-800 disabled:opacity-60"
                    >
                        {loading ? "Thinking..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Chat;
