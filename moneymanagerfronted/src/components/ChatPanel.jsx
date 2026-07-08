import { useState } from "react";

const ChatPanel = () => {
    const [input, setInput] = useState("");
    const [messages, setMessages] = useState([
        {
            id: 1,
            sender: "assistant",
            text: "Ask me for ideas, tips, or suggestions for managing income, expenses, categories, or savings.",
        },
    ]);
    const [loading, setLoading] = useState(false);

    const generateLocalResponse = (prompt) => {
        const text = prompt.toLowerCase();

        if (/\b(hi|hello|hey|greetings)\b/.test(text)) {
            return "Hi there! I can help with budgeting, tracking income, managing expenses, or planning savings. What would you like to discuss?";
        }

        if (text.includes("budget")) {
            return "A good starting point is the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings or debt repayment.";
        }

        if (text.includes("expense")) {
            return "Try categorizing your expenses into essentials and non-essentials, then set a weekly or monthly limit for each category.";
        }

        if (text.includes("income")) {
            return "To improve income, consider tracking your current sources, looking for ways to increase earnings, and reducing unnecessary costs.";
        }

        if (text.includes("save") || text.includes("savings")) {
            return "Saving regularly helps build financial security. Start small, automate transfers, and keep a separate savings goal for emergencies.";
        }

        if (text.includes("category")) {
            return "Organizing transactions into categories like food, transport, rent, and entertainment makes it easier to see where your money goes.";
        }

        if (text.includes("invest")) {
            return "Investing can help money grow over time. Research options carefully and start with what you understand, like index funds or recurring deposits.";
        }

        return "That sounds interesting. Tell me more about your financial goal or ask me for budgeting, expense, savings, or income tips.";
    };

    const sendMessage = () => {
        if (!input.trim()) return;

        const userMessage = {
            id: Date.now(),
            sender: "user",
            text: input.trim(),
        };

        setMessages((prev) => [...prev, userMessage]);
        setInput("");
        setLoading(true);

        const aiText = generateLocalResponse(userMessage.text);

        setTimeout(() => {
            setMessages((prev) => [
                ...prev,
                {
                    id: Date.now() + 1,
                    sender: "assistant",
                    text: aiText,
                },
            ]);
            setLoading(false);
        }, 500);
    };

    return (
        <div className="flex h-[68vh] flex-col">
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`rounded-2xl p-4 shadow-sm ${
                            message.sender === "assistant"
                                ? "bg-gray-50 text-gray-900"
                                : "bg-purple-600 text-white self-end"
                        } ${message.sender === "assistant" ? "max-w-full" : "max-w-full ml-auto"}`}
                    >
                        <p className="whitespace-pre-line">{message.text}</p>
                    </div>
                ))}
            </div>

            <div className="border-t border-purple-100 p-4 bg-white">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    rows={3}
                    placeholder="Ask the AI for ideas, tips, or suggestions..."
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-gray-900 focus:border-purple-500 focus:outline-none"
                />
                <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="text-xs text-gray-500">This is a local AI chat response simulator.</p>
                    <button
                        onClick={sendMessage}
                        disabled={loading || !input.trim()}
                        className="inline-flex items-center justify-center rounded-full bg-purple-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {loading ? "Thinking..." : "Send"}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatPanel;
