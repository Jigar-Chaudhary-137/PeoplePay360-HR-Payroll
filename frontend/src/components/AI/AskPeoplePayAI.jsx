import React, { useState } from 'react';
import { Sparkles, Send, X, Bot, User, CornerDownLeft } from 'lucide-react';
import { aiAPI } from '../../services/api';

export function AskPeoplePayAI({ isOpen, onClose }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: 'bot',
      text: "Hello! I am **PeoplePay AI**. I analyze your real-time PeoplePay360 database to explain salary changes, department costs, leave balances, and payroll anomalies. How can I help you today?",
      time: 'Just now'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleQuestions = [
    "Why did Rahul's salary decrease this month?",
    "Which department has the highest salary cost?",
    "Show employees with unusual salary changes",
    "How many approved leaves exist in the organization?"
  ];

  const handleSend = async (questionText) => {
    const q = questionText || input;
    if (!q.trim() || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await aiAPI.ask(q);
      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: res.answer || "I processed your request using PeoplePay360 verified data.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: `⚠️ **AI Query Error:** ${err.message}. Please verify your connection or database status.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-slate-950 border-l border-white/10 h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-sky-500/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 flex items-center gap-2">
                Ask PeoplePay AI
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-sky-500/20 text-sky-400 rounded-full border border-sky-500/30">
                  LIVE DB CONTEXT
                </span>
              </h3>
              <p className="text-xs text-slate-400">Intelligent HR & Payroll Operations Assistant</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Quick Suggestion Pills */}
        <div className="p-3 bg-slate-900/40 border-b border-white/5 flex gap-2 overflow-x-auto text-xs">
          {sampleQuestions.map((sq, i) => (
            <button
              key={i}
              onClick={() => handleSend(sq)}
              className="px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-sky-500/10 hover:border-sky-500/30 border border-white/10 text-slate-300 hover:text-sky-300 whitespace-nowrap transition-all"
            >
              {sq}
            </button>
          ))}
        </div>

        {/* Message Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {m.sender === 'bot' && (
                <div className="w-8 h-8 rounded-lg bg-sky-950 border border-sky-500/30 text-sky-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={16} />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.sender === 'user'
                    ? 'bg-sky-600 text-white rounded-tr-none shadow-md shadow-sky-600/20'
                    : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none whitespace-pre-line'
                }`}
              >
                <div>{m.text}</div>
                <div
                  className={`text-[10px] mt-1.5 ${
                    m.sender === 'user' ? 'text-sky-200 text-right' : 'text-slate-500'
                  }`}
                >
                  {m.time}
                </div>
              </div>
              {m.sender === 'user' && (
                <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={16} />
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3 items-center text-slate-400 text-xs p-2">
              <div className="w-6 h-6 rounded-md bg-sky-950 border border-sky-500/30 text-sky-400 flex items-center justify-center animate-pulse">
                <Bot size={14} />
              </div>
              <span>Analyzing payroll ledger, attendance, and salary rules...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-white/10 bg-slate-900/80">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about payroll, leaves, or salary costs..."
              className="form-input text-sm py-2.5 flex-1"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn-primary px-3 py-2.5"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
