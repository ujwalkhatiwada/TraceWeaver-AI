import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { EvidenceFragment, DiskImageMetadata } from '../types/forensics.ts';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  text: string;
  timestamp: string;
  feasibility?: string;
  reason?: string;
  nextSteps?: string[];
}

interface RecoveryChatbotProps {
  fragments: EvidenceFragment[];
  metadata: DiskImageMetadata;
  isOpen: boolean;
  onClose: () => void;
  onInspectFragmentByName?: (name: string) => void;
}

export const RecoveryChatbot: React.FC<RecoveryChatbotProps> = ({
  fragments,
  metadata,
  isOpen,
  onClose,
  onInspectFragmentByName,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hello, I am TraceWeaver AI Advisor. I analyze raw disk images, assess Shannon entropy, piece together fragmented evidence, and generate plain-English forensic timelines for incident response teams.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleAskQuestion = async (question: string) => {
    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: question,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: question,
          contextFragments: fragments,
          diskMetadata: metadata,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const botResponse: ChatMessage = {
          id: `bot-${Date.now()}`,
          role: 'assistant',
          text: data.reply || 'Analysis complete.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          feasibility: data.retrievableLikelihood,
          reason: data.reply,
          nextSteps: data.suggestedActions || ['Inspect carved sectors in Workbench', 'Verify cryptographic hash'],
        };
        setMessages((prev) => [...prev, botResponse]);
        return;
      }
    } catch {
      // Graceful local heuristic fallback
    } finally {
      setIsLoading(false);
    }

    // Local fallback if server unreachable
    let botResponse: ChatMessage = {
      id: `bot-${Date.now()}`,
      role: 'assistant',
      text: 'Recovery feasibility analysis based on TraceWeaver-AI disk reconstruction:',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      feasibility: 'Very High (95%)',
      reason: 'The file contains recognizable structural information and enough recoverable data for further analysis.',
      nextSteps: [
        'Inspect recovered sectors',
        'Verify file structure',
        'Export the evidence report',
      ],
    };

    const qLower = question.toLowerCase();

    if (qLower.includes('timeline') || qLower.includes('what happened') || qLower.includes('incident')) {
      botResponse = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: 'TraceWeaver-AI Reconstructed Incident Timeline Summary:',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feasibility: 'High Priority (Chronologically Verified)',
        reason: 'Reconstructed 5 incident phases: baseline file creations, unauthorized insider exfiltration, intentional zero-wipe anti-forensic routine, Word document cluster gap splitting, and write-blocked recovery.',
        nextSteps: [
          'Switch to the Forensic Timeline tab in the Workbench',
          'Inspect anti-forensic zeroed sectors 75–89 and 173–255',
          'Export Incident Response Timeline as Markdown or CSV',
        ],
      };
    } else if (qLower.includes('photo')) {
      botResponse = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: 'photo1.jpg status assessment:',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feasibility: 'Partially Recoverable (70%)',
        reason: 'The JFIF/EXIF header and 72% of scanlines are intact. Trailing bytes were damaged by an anti-forensic overwrite.',
        nextSteps: [
          'Inspect sectors 35 to 42 in Sector Map',
          'Open image preview in Workbench to view recovered scanlines',
          'Flag missing EOI (FF D9) marker as tampering indicator',
        ],
      };
    } else if (qLower.includes('financial') || qLower.includes('pdf')) {
      botResponse = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: 'financial_report.pdf status assessment:',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feasibility: 'Very High (100%)',
        reason: 'The file contains valid %PDF-1.7 headers, intact catalog objects, and a verified %%EOF trailer.',
        nextSteps: [
          'Verify SHA-256 hash against evidence inventory',
          'Inspect $4,250,000 wire transaction ledger',
          'Export evidence sheet for legal briefing',
        ],
      };
    } else if (qLower.includes('word') || qLower.includes('docx') || qLower.includes('fragment')) {
      botResponse = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: 'case_notes.docx status assessment:',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feasibility: 'Stitched (88%)',
        reason: 'The document was split across an unallocated gap (Sectors 65–74 and 90–102) and successfully reconnected by TraceWeaver-AI.',
        nextSteps: [
          'Review 15-sector gap in the Sector Map',
          'Inspect word/document.xml extracted text',
          'Document cluster continuity in report',
        ],
      };
    } else if (qLower.includes('next') || qLower.includes('inspect')) {
      botResponse = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: 'Recommended next investigative priorities:',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        feasibility: 'High Priority',
        reason: 'Prioritization algorithm ranks financial_report.pdf and logs.db at P1 CRITICAL.',
        nextSteps: [
          'Check logs.db freelist for deleted transaction records',
          'Correlate timestamps with case_notes.docx',
          'Download complete Digital Forensics Incident Report (DFIR)',
        ],
      };
    }

    setMessages((prev) => [...prev, botResponse]);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const query = input.trim();
    handleAskQuestion(query);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-20 right-4 sm:right-6 z-50 w-[95vw] sm:w-[420px] max-w-[420px] bg-white border border-[#E5E7EB] rounded-lg shadow-xl overflow-hidden flex flex-col font-sans text-[#1F2937] animate-in fade-in zoom-in-95 duration-100">
      {/* Top Header */}
      <div className="p-3.5 border-b border-[#E5E7EB] bg-[#F8F9FA] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-[#2563EB] text-white">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#1F2937] leading-tight">
              TraceWeaver AI Advisor
            </h3>
            <p className="text-[10px] text-[#6B7280] leading-tight">
              Recovery Decision Support
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[#E5E7EB] text-[#6B7280] hover:text-[#1F2937] cursor-pointer"
          aria-label="Close TraceWeaver AI Advisor"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Demonstration Banner */}
      <div className="bg-[#EFF6FF] px-3 py-1.5 border-b border-[#BFDBFE] text-[10px] text-[#1E40AF] font-medium flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB] shrink-0" />
        <span>Demonstration interface for sample forensic disk analysis.</span>
      </div>

      {/* Messages Scroll Area */}
      <div className="p-3 overflow-y-auto max-h-[360px] min-h-[220px] space-y-3 bg-[#FFFFFF]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${
              m.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div
              className={`p-3 rounded-lg text-xs leading-relaxed max-w-[90%] ${
                m.role === 'user'
                  ? 'bg-[#2563EB] text-white font-medium'
                  : 'bg-[#F8F9FA] border border-[#E5E7EB] text-[#1F2937]'
              }`}
            >
              <p>{m.text}</p>

              {/* Structured Feasibility Card */}
              {m.feasibility && (
                <div className="mt-2.5 pt-2 border-t border-[#E5E7EB] space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold text-[#6B7280]">
                      Recovery Feasibility:
                    </span>
                    <span className="font-bold text-[#16A34A] text-xs">
                      {m.feasibility}
                    </span>
                  </div>

                  {m.reason && (
                    <div className="text-[11px] text-[#4B5563]">
                      <span className="font-semibold text-[#1F2937]">Reason: </span>
                      {m.reason}
                    </div>
                  )}

                  {m.nextSteps && m.nextSteps.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[11px] font-semibold text-[#1F2937] block mb-0.5">
                        Next Steps:
                      </span>
                      <ol className="list-decimal list-inside text-[11px] text-[#4B5563] space-y-0.5">
                        {m.nextSteps.map((step, idx) => (
                          <li key={idx}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}
            </div>
            <span className="text-[9px] text-[#9CA3AF] mt-0.5 px-1 font-mono">
              {m.timestamp}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Question Chips */}
      <div className="p-2.5 bg-[#F8F9FA] border-t border-[#E5E7EB] space-y-1.5">
        <div className="text-[10px] uppercase font-bold text-[#6B7280] font-mono">
          Quick Questions:
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => handleAskQuestion('What happened on this disk? (Timeline)')}
            className="px-2 py-1 bg-white hover:bg-[#EFF6FF] border border-[#E5E7EB] hover:border-[#BFDBFE] text-[#2563EB] rounded text-[11px] transition-none cursor-pointer text-left font-medium"
          >
            What happened on this disk? (Timeline)
          </button>
          <button
            onClick={() => handleAskQuestion('Can my deleted photo be recovered?')}
            className="px-2 py-1 bg-white hover:bg-[#EFF6FF] border border-[#E5E7EB] hover:border-[#BFDBFE] text-[#2563EB] rounded text-[11px] transition-none cursor-pointer text-left"
          >
            Can my deleted photo be recovered?
          </button>
          <button
            onClick={() => handleAskQuestion('Is the financial PDF intact?')}
            className="px-2 py-1 bg-white hover:bg-[#EFF6FF] border border-[#E5E7EB] hover:border-[#BFDBFE] text-[#2563EB] rounded text-[11px] transition-none cursor-pointer text-left"
          >
            Is the financial PDF intact?
          </button>
          <button
            onClick={() => handleAskQuestion('Can the fragmented Word document be recovered?')}
            className="px-2 py-1 bg-white hover:bg-[#EFF6FF] border border-[#E5E7EB] hover:border-[#BFDBFE] text-[#2563EB] rounded text-[11px] transition-none cursor-pointer text-left"
          >
            Can the fragmented Word document be recovered?
          </button>
          <button
            onClick={() => handleAskQuestion('What should I inspect next?')}
            className="px-2 py-1 bg-white hover:bg-[#EFF6FF] border border-[#E5E7EB] hover:border-[#BFDBFE] text-[#2563EB] rounded text-[11px] transition-none cursor-pointer text-left"
          >
            What should I inspect next?
          </button>
        </div>
      </div>

      {/* Input Box */}
      <div className="p-2.5 bg-white border-t border-[#E5E7EB] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask about disk sectors or recovery..."
          className="flex-1 px-3 py-1.5 bg-[#F8F9FA] border border-[#E5E7EB] rounded text-xs text-[#1F2937] placeholder-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#2563EB] focus:bg-white"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          className="px-3 py-1.5 bg-[#2563EB] hover:bg-blue-700 disabled:opacity-50 text-white rounded text-xs font-semibold cursor-pointer"
        >
          Send
        </button>
      </div>
    </div>
  );
};
