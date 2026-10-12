import { useState } from "react";
import { MessageCircle, X } from "lucide-react";
import ChatPanel from "./ChatPanel.jsx";

const FloatingChat = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="fixed right-5 bottom-5 z-50 flex flex-col items-end gap-3">
            {isOpen && (
                <div className="w-96 max-w-[90vw] rounded-[28px] border border-purple-200 bg-white/95 shadow-2xl backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-3 border-b border-purple-100 bg-purple-700 px-4 py-3 text-white">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-800">
                                <MessageCircle size={20} />
                            </div>
                            <div>
                                <h2 className="text-sm font-semibold">AI Idea Chat</h2>
                                <p className="text-xs text-purple-100">
                                    Budget ideas, expense tips, and savings suggestions.
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            aria-label="Close AI chat"
                            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 transition hover:bg-white/20"
                        >
                            <X size={18} />
                        </button>
                    </div>
                    <ChatPanel />
                </div>
            )}

            <button
                onClick={() => setIsOpen((prev) => !prev)}
                aria-label="Toggle AI chat"
                className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-purple-700 text-white shadow-lg transition hover:bg-purple-800 focus:outline-none focus:ring-2 focus:ring-purple-300"
            >
                <MessageCircle size={28} />
            </button>
        </div>
    );
};

export default FloatingChat;
