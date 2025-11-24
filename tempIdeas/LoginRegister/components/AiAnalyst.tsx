import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Cpu, Sparkles } from 'lucide-react';
import { generateFantasyAnalysis } from '../services/geminiService';
import { ChatMessage } from '../types';

interface AiAnalystProps {
  onClose: () => void;
}

const AiAnalyst: React.FC<AiAnalystProps> = ({ onClose }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'model', text: 'Identity confirmed. Neural link established. I am the Fantasy Oracle (Powered by Gemini 2.5 Thinking). Ask me about trade scenarios, draft strategies, or complex start/sit decisions. I will think deeply before answering.' }
  ]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userText }]);
    setLoading(true);

    // Add a temporary "thinking" message
    setMessages(prev => [...prev, { role: 'model', text: 'analyzing data streams...', isThinking: true }]);

    const responseText = await generateFantasyAnalysis(userText);

    setMessages(prev => {
      const filtered = prev.filter(msg => !msg.isThinking);
      return [...filtered, { role: 'model', text: responseText }];
    });
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl h-[600px] bg-cyber-dark border border-neon-500 rounded-lg shadow-[0_0_50px_rgba(34,197,94,0.2)] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="h-14 border-b border-neon-500/30 bg-neon-900/20 flex items-center justify-between px-6">
            <div className="flex items-center space-x-3">
                <Cpu className="text-neon-400 animate-pulse" size={20} />
                <h2 className="text-neon-400 font-sans font-bold text-lg tracking-wider">ORACLE <span className="text-xs text-neon-500/60 font-mono ml-2 border border-neon-500/30 px-1 rounded">Gemini 3 Pro Thinking</span></h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
                <X size={24} />
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-neon-500/20 scrollbar-track-transparent">
            {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] rounded-lg p-4 ${
                        msg.role === 'user' 
                        ? 'bg-neon-500/10 border border-neon-500/30 text-white rounded-tr-none' 
                        : 'bg-gray-900 border border-gray-700 text-emerald-100 rounded-tl-none shadow-lg'
                    }`}>
                        {msg.isThinking ? (
                            <div className="flex items-center space-x-2 text-neon-400/70 font-mono text-sm">
                                <Sparkles size={14} className="animate-spin" />
                                <span>Thinking (Budget: 32k tokens)...</span>
                            </div>
                        ) : (
                            <div className="whitespace-pre-wrap leading-relaxed text-sm font-mono">
                                {msg.text}
                            </div>
                        )}
                    </div>
                </div>
            ))}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-neon-500/30 bg-black/40">
            <div className="flex items-center space-x-2 bg-gray-900/50 border border-neon-500/30 rounded px-4 py-2 focus-within:border-neon-400 focus-within:shadow-[0_0_15px_rgba(74,222,128,0.1)] transition-all">
                <input 
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Ask the Oracle about complex trade analysis..."
                    className="flex-1 bg-transparent border-none outline-none text-white placeholder-gray-500 font-mono text-sm h-10"
                />
                <button 
                    onClick={handleSend}
                    disabled={loading}
                    className={`text-neon-400 hover:text-neon-300 transition-colors ${loading ? 'opacity-50' : ''}`}
                >
                    <Send size={20} />
                </button>
            </div>
            <div className="text-[10px] text-gray-500 mt-2 text-center font-mono">
                AI Thinking Mode Active • Precision Analysis
            </div>
        </div>

      </div>
    </div>
  );
};

export default AiAnalyst;