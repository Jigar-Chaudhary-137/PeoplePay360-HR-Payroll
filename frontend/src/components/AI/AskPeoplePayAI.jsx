import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles, Send, X, Bot, User, RotateCcw, Copy, Check,
  AlertCircle, Building, DollarSign, Calendar, ShieldAlert,
  ArrowRight, CornerDownLeft, RefreshCw, Zap, Database
} from 'lucide-react';
import { aiAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

/**
 * Parses inline markdown: **bold**, `code`, *italic*
 */
function renderInline(text) {
  if (!text) return null;
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*]+\*)/g;
  let lastIdx = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push({ type: 'text', val: text.substring(lastIdx, match.index) });
    }
    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      parts.push({ type: 'bold', val: token.slice(2, -2) });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      parts.push({ type: 'code', val: token.slice(1, -1) });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      parts.push({ type: 'italic', val: token.slice(1, -1) });
    }
    lastIdx = match.index + token.length;
  }
  if (lastIdx < text.length) {
    parts.push({ type: 'text', val: text.substring(lastIdx) });
  }

  return parts.map((p, idx) => {
    if (p.type === 'bold') {
      return <strong key={idx} className="font-bold text-[#171717]">{p.val}</strong>;
    }
    if (p.type === 'code') {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded-md bg-[#F3E8FF] text-[#6D28D9] font-mono text-[12px] font-semibold">
          {p.val}
        </code>
      );
    }
    if (p.type === 'italic') {
      return <em key={idx} className="italic text-[#6B7280]">{p.val}</em>;
    }
    return <span key={idx}>{p.val}</span>;
  });
}

/**
 * Rich Markdown message formatter (supports tables, lists, code, headers)
 */
function MarkdownMessage({ text }) {
  if (!text) return null;

  const lines = text.split('\n');
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // 1. Markdown Table detection (| Col 1 | Col 2 |)
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].trim().startsWith('|') && lines[i].trim().endsWith('|')) {
        tableLines.push(lines[i].trim());
        i++;
      }
      if (tableLines.length >= 2) {
        const headers = tableLines[0].slice(1, -1).split('|').map((c) => c.trim());
        const hasDivider = tableLines[1].includes('---');
        const rows = (hasDivider ? tableLines.slice(2) : tableLines.slice(1))
          .map((row) => row.slice(1, -1).split('|').map((c) => c.trim()));

        elements.push(
          <div key={`table-${i}`} className="my-3 overflow-x-auto rounded-xl border border-[#E5E7EB] bg-white shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF7FF] border-b border-[#E5E7EB]">
                  {headers.map((h, hIdx) => (
                    <th key={hIdx} className="px-3.5 py-2.5 font-bold text-[#171717] tracking-tight">
                      {renderInline(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#FAF7FF]/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-[#4B5563]">
                        {renderInline(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        continue;
      }
    }

    // 2. Fenced Code Block (``` ... ```)
    if (line.trim().startsWith('```')) {
      const codeLines = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        codeLines.push(lines[i]);
        i++;
      }
      i++; // skip closing ```
      elements.push(
        <div key={`code-${i}`} className="my-2.5 rounded-xl bg-[#1E1B2E] text-slate-100 p-3.5 font-mono text-xs overflow-x-auto shadow-sm">
          <pre className="whitespace-pre-wrap">{codeLines.join('\n')}</pre>
        </div>
      );
      continue;
    }

    // 3. Bullet list items (•, -, *)
    if (line.trim().startsWith('•') || line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
      const bulletText = line.trim().replace(/^[•\-\*]\s*/, '');
      elements.push(
        <div key={`bullet-${i}`} className="flex items-start gap-2.5 my-1 text-sm leading-relaxed text-[#374151]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6D28D9] shrink-0 mt-2" />
          <div className="flex-1">{renderInline(bulletText)}</div>
        </div>
      );
      i++;
      continue;
    }

    // 4. Numbered list items (1. , 2. )
    const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
    if (numMatch) {
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1 text-sm leading-relaxed text-[#374151]">
          <span className="w-5 h-5 rounded-full bg-[#F3E8FF] text-[#6D28D9] font-bold text-[11px] flex items-center justify-center shrink-0 mt-0.5 border border-[#DDD9E8]">
            {numMatch[1]}
          </span>
          <div className="flex-1">{renderInline(numMatch[2])}</div>
        </div>
      );
      i++;
      continue;
    }

    // 5. Headers (#, ##, ###)
    if (line.trim().startsWith('### ')) {
      elements.push(
        <h4 key={`h3-${i}`} className="font-bold text-[#171717] text-sm mt-3 mb-1 font-heading">
          {renderInline(line.trim().slice(4))}
        </h4>
      );
      i++;
      continue;
    }
    if (line.trim().startsWith('## ')) {
      elements.push(
        <h3 key={`h2-${i}`} className="font-extrabold text-[#171717] text-base mt-3.5 mb-1 font-heading">
          {renderInline(line.trim().slice(3))}
        </h3>
      );
      i++;
      continue;
    }
    if (line.trim().startsWith('# ')) {
      elements.push(
        <h2 key={`h1-${i}`} className="font-extrabold text-[#171717] text-lg mt-4 mb-1.5 font-heading">
          {renderInline(line.trim().slice(2))}
        </h2>
      );
      i++;
      continue;
    }

    // 6. Blank spacer lines
    if (!line.trim()) {
      elements.push(<div key={`space-${i}`} className="h-2" />);
      i++;
      continue;
    }

    // 7. Regular paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm leading-relaxed text-[#374151] my-1">
        {renderInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{elements}</div>;
}

export function AskPeoplePayAI({ isOpen, onClose }) {
  const { user } = useAuth();

  const initialGreeting = {
    id: 'welcome',
    sender: 'bot',
    text: `Hello ${user?.first_name || 'there'}! I am **PeoplePay AI**, connected live to your **PeoplePay360 database**.\n\nI can analyze your employee contracts, salary disbursements, department expenditures, leave records, and detect payroll anomalies in real time.\n\nWhat would you like to explore?`,
    time: 'Just now',
    source: 'live-database'
  };

  const [messages, setMessages] = useState([initialGreeting]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const promptCategories = [
    {
      category: 'Compensation & Salaries',
      icon: DollarSign,
      prompts: [
        "Why did Rahul Sharma's salary change this month?",
        "Show employees with unusual salary changes",
        "What is the average employee salary across all active contracts?"
      ]
    },
    {
      category: 'Departments & Headcount',
      icon: Building,
      prompts: [
        "Which department has the highest salary cost?",
        "Compare departmental payroll expenses and employee counts"
      ]
    },
    {
      category: 'Time Off & Attendance',
      icon: Calendar,
      prompts: [
        "How many approved leaves exist in the organization?",
        "Summarize recent attendance health and attendance punch records"
      ]
    },
    {
      category: 'Anomalies & Compliance',
      icon: ShieldAlert,
      prompts: [
        "Show active payroll alerts, anomalies or warnings",
        "Are there any employees with missing bank account numbers?"
      ]
    }
  ];

  // Auto-scroll on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading, isOpen]);

  // Focus textarea when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 150);
    }
  }, [isOpen]);

  const handleSend = async (questionText) => {
    const q = (questionText || input).trim();
    if (!q || loading) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      const res = await aiAPI.ask(q);
      const payload = res?.data || res;
      const answerText = payload?.answer || "I processed your request using PeoplePay360 verified data.";
      const source = payload?.source || 'peoplepay360-database';

      const botMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        text: answerText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        source
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg = {
        id: Date.now() + 1,
        sender: 'bot',
        isError: true,
        text: `Unable to process query: ${err.message || 'Database connection error'}. Please verify backend status.`,
        originalQuestion: q,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e) => {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`;
  };

  const handleCopy = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleClearChat = () => {
    setMessages([initialGreeting]);
    setInput('');
  };

  if (!isOpen) return null;

  const isGreetingOnly = messages.length === 1 && messages[0].id === 'welcome';

  return (
    <div className="fixed inset-0 z-[1000] overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Modern Full-Height Drawer */}
      <div className="relative w-full max-w-2xl bg-[#F8F7FC] border-l border-[#E5E7EB] h-full flex flex-col shadow-2xl z-10 animate-in slide-in-from-right duration-250">
        {/* Header */}
        <header className="h-18 px-5 bg-white border-b border-[#E5E7EB] flex items-center justify-between shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] flex items-center justify-center text-white shadow-md shadow-[#6D28D9]/25 shrink-0">
              <Sparkles size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-[#171717] text-base font-heading tracking-tight leading-tight">
                  PeoplePay AI
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live DB Connected
                </span>
              </div>
              <p className="text-[12px] text-[#6B7280] font-medium mt-0.5">
                Real-time HR & Payroll Intelligence
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={handleClearChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#6B7280] hover:text-[#171717] hover:bg-[#FAF7FF] border border-transparent hover:border-[#E5E7EB] transition-all"
              title="Reset to new conversation"
            >
              <RotateCcw size={14} />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <button
              onClick={onClose}
              className="text-[#9CA3AF] hover:text-[#171717] p-2 rounded-xl hover:bg-[#FAF7FF] transition-colors"
              title="Close drawer"
            >
              <X size={20} />
            </button>
          </div>
        </header>

        {/* Message Viewport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Friendly Empty State / Prompt Library */}
          {isGreetingOnly && (
            <div className="py-4 space-y-6">
              {/* Hero Banner */}
              <div className="glass-card p-6 text-center space-y-3 bg-gradient-to-b from-white to-[#FAF7FF] border-[#DDD9E8] shadow-xs">
                <div className="w-12 h-12 rounded-2xl bg-[#F3E8FF] text-[#6D28D9] flex items-center justify-center mx-auto border border-[#DDD9E8] shadow-sm">
                  <Zap size={24} />
                </div>
                <div>
                  <h4 className="font-extrabold text-base text-[#171717] font-heading">
                    How can I assist your payroll operations today?
                  </h4>
                  <p className="text-xs text-[#6B7280] max-w-md mx-auto mt-1 leading-relaxed">
                    Ask any question about contracts, salary disbursements, time-off approvals, or anomalies. Every answer is computed directly from your active MySQL database.
                  </p>
                </div>
              </div>

              {/* Categorized Prompt Suggestions */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-[#6B7280] uppercase tracking-wider font-heading">
                      Suggested Questions
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-[#F3E8FF] text-[#6D28D9] border border-[#DDD9E8]">
                      9 Prompts
                    </span>
                  </div>
                  <span className="text-[11px] text-[#6D28D9] font-medium flex items-center gap-1.5 bg-[#FAF7FF] px-2 py-0.5 rounded-full border border-[#DDD9E8]">
                    <Database size={11} className="text-[#6D28D9]" />
                    Verified SQL Context
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 [grid-auto-rows:1fr]">
                  {promptCategories.flatMap((cat) =>
                    cat.prompts.map((p, idx) => (
                      <button
                        key={`${cat.category}-${idx}`}
                        type="button"
                        onClick={() => handleSend(p)}
                        className="group w-full h-full min-h-[72px] p-3.5 text-left rounded-xl bg-white hover:bg-[#FAF7FF] border border-[#E5E7EB] hover:border-[#6D28D9]/40 shadow-xs hover:shadow-sm active:scale-[0.99] transition-all duration-200 flex items-center gap-3 cursor-pointer select-none"
                        title={p}
                      >
                        <div className="w-8 h-8 rounded-lg bg-[#F3E8FF] border border-[#DDD9E8] flex items-center justify-center shrink-0 group-hover:bg-[#6D28D9] group-hover:border-[#6D28D9] transition-all duration-200 shadow-2xs">
                          <cat.icon size={15} className="text-[#6D28D9] group-hover:text-white transition-colors duration-200" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-[#374151] group-hover:text-[#6D28D9] font-medium leading-snug break-words block transition-colors duration-200">
                            {p}
                          </span>
                        </div>
                        <ArrowRight
                          size={14}
                          className="text-[#9CA3AF] group-hover:text-[#6D28D9] group-hover:translate-x-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 hidden sm:block"
                        />
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Conversation History */}
          {!isGreetingOnly &&
            messages.map((m) => {
              const isBot = m.sender === 'bot';
              const isErr = m.isError;

              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${isBot ? 'justify-start' : 'justify-end'}`}
                >
                  {/* Bot Avatar */}
                  {isBot && (
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                      <Bot size={17} />
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 transition-all ${
                      isBot
                        ? isErr
                          ? 'bg-rose-50 border border-rose-200 text-rose-900 rounded-tl-xs shadow-xs'
                          : 'bg-white border border-[#E5E7EB] text-[#171717] rounded-tl-xs shadow-xs hover:border-[#DDD9E8]'
                        : 'bg-[#6D28D9] text-white rounded-tr-xs shadow-md shadow-[#6D28D9]/20'
                    }`}
                  >
                    {/* Content */}
                    {isBot ? (
                      <div className="prose prose-sm max-w-none">
                        <MarkdownMessage text={m.text} />
                        {isErr && m.originalQuestion && (
                          <div className="mt-3 pt-2.5 border-t border-rose-200 flex items-center justify-between">
                            <span className="text-[11px] text-rose-600 font-medium">Failed to reach AI service</span>
                            <button
                              onClick={() => handleSend(m.originalQuestion)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 hover:text-rose-800 bg-white px-2 py-1 rounded-md border border-rose-300 transition-colors"
                            >
                              <RefreshCw size={11} />
                              <span>Retry Question</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                        {m.text}
                      </p>
                    )}

                    {/* Metadata Footer */}
                    <div className="mt-2.5 pt-2 border-t border-black/5 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className={isBot ? 'text-[#9CA3AF]' : 'text-purple-200'}>
                          {m.time}
                        </span>
                        {isBot && !isErr && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#6D28D9] bg-[#F3E8FF] px-2 py-0.5 rounded-full border border-[#DDD9E8]">
                            <Database size={10} />
                            <span>Live Ledger</span>
                          </span>
                        )}
                      </div>

                      {/* Copy Action */}
                      {isBot && !isErr && (
                        <button
                          onClick={() => handleCopy(m.id, m.text)}
                          className="text-[#9CA3AF] hover:text-[#6D28D9] p-1 rounded-md hover:bg-[#FAF7FF] transition-colors"
                          title="Copy answer to clipboard"
                        >
                          {copiedId === m.id ? (
                            <span className="text-emerald-600 flex items-center gap-1 font-bold text-[10px]">
                              <Check size={12} />
                              <span>Copied</span>
                            </span>
                          ) : (
                            <Copy size={13} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* User Avatar */}
                  {!isBot && (
                    <div className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#6D28D9] border border-[#DDD9E8] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {user?.first_name?.[0] || 'U'}
                    </div>
                  )}
                </div>
              );
            })}

          {/* Typing Animation while AI computes */}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#6D28D9] to-[#8B5CF6] text-white flex items-center justify-center shrink-0 shadow-sm animate-pulse">
                <Bot size={17} />
              </div>
              <div className="bg-white border border-[#E5E7EB] rounded-2xl rounded-tl-xs px-4 py-3.5 shadow-xs max-w-[80%] space-y-2">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#6D28D9] animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#6D28D9] animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 rounded-full bg-[#6D28D9] animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <p className="text-xs text-[#6B7280] font-medium">
                  Querying PeoplePay360 database and analyzing payroll rules...
                </p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Composer */}
        <div className="p-4 bg-white border-t border-[#E5E7EB] shrink-0 shadow-lg space-y-2.5 z-20">
          <div className="relative flex items-end gap-2 bg-[#F8F7FC] border border-[#E5E7EB] focus-within:border-[#6D28D9] focus-within:ring-2 focus-within:ring-[#6D28D9]/15 rounded-2xl p-2 transition-all">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              rows={1}
              placeholder="Ask anything about salaries, payruns, attendance..."
              className="w-full bg-transparent resize-none border-none outline-none text-sm text-[#171717] placeholder:text-[#9CA3AF] px-2 py-1 max-h-32 min-h-[36px] font-sans leading-relaxed"
              disabled={loading}
            />

            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
                input.trim() && !loading
                  ? 'bg-[#6D28D9] text-white hover:bg-[#5B21B6] shadow-sm shadow-[#6D28D9]/30 hover:scale-105'
                  : 'bg-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed'
              }`}
              title="Send message (Enter)"
            >
              <Send size={16} />
            </button>
          </div>

          <div className="flex items-center justify-between text-[11px] text-[#9CA3AF] px-1 font-medium">
            <span className="flex items-center gap-1">
              <CornerDownLeft size={11} />
              <span>Enter to send, Shift + Enter for new line</span>
            </span>
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#6D28D9]">
              MySQL Grounded
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AskPeoplePayAI;
