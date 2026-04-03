import React, { useState } from "react";
import { askCopilot } from "../api";

const CopilotDrawer = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {
      role: "user",
      text: input,
    };

    setMessages((prev) => [
      ...prev,
      userMessage,
    ]);

    setInput("");
    setLoading(true);

    try {
      const response =
        await askCopilot(
          userMessage.text,
          1
        );

      const botMessage = {
        role: "assistant",
        text:
          response.answer ||
          "Response received.",
      };

      setMessages((prev) => [
        ...prev,
        botMessage,
      ]);

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "Error connecting to AI.",
        },
      ]);
    }

    setLoading(false);
  };

  return (
    <div
      className={`
        fixed
        top-0
        left-0
        w-full
        bg-[#020817]
        border-b
        border-gray-700
        transition-all
        duration-300
        z-50
        ${
          isOpen
            ? "translate-y-0"
            : "-translate-y-full"
        }
      `}
    >
      <div className="max-w-5xl mx-auto p-6">

        {/* Header */}

        <div className="flex justify-between mb-4">

          <h2 className="text-xl font-semibold text-white">
            Clinical AI Copilot
          </h2>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            Close
          </button>

        </div>

        {/* Chat Area */}

        <div className="h-64 overflow-y-auto bg-[#0f172a] p-4 rounded-lg mb-4">

          {messages.length === 0 && (
            <p className="text-gray-400">
              Ask clinical questions about the patient.
            </p>
          )}

          {messages.map(
            (msg, index) => (
              <div
                key={index}
                className={`mb-2 ${
                  msg.role === "user"
                    ? "text-right"
                    : "text-left"
                }`}
              >
                <span
                  className={`
                    inline-block
                    px-3
                    py-2
                    rounded-lg
                    ${
                      msg.role ===
                      "user"
                        ? "bg-[#2dd4bf] text-black"
                        : "bg-gray-700 text-white"
                    }
                  `}
                >
                  {msg.text}
                </span>
              </div>
            )
          )}

          {loading && (
            <p className="text-gray-400">
              Thinking...
            </p>
          )}

        </div>

        {/* Input */}

        <div className="flex gap-2">

          <input
            type="text"
            value={input}
            onChange={(e) =>
              setInput(e.target.value)
            }
            placeholder="Ask about patient condition..."
            className="
              flex-1
              p-3
              rounded-lg
              bg-[#020817]
              border
              border-gray-600
              text-white
            "
          />

          <button
            onClick={sendMessage}
            className="
              bg-[#2dd4bf]
              text-black
              px-6
              py-2
              rounded-lg
              font-semibold
            "
          >
            Send
          </button>

        </div>

      </div>
    </div>
  );
};

export default CopilotDrawer;