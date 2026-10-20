import React, { useState } from 'react';
import { ApiKeys } from '../types';
import { X, Key, ShieldCheck, Eye, EyeOff } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKeys: ApiKeys;
  onSave: (keys: ApiKeys) => void;
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, apiKeys, onSave }) => {
  const [gemini, setGemini] = useState(apiKeys.gemini || '');
  const [openai, setOpenai] = useState(apiKeys.openai || '');
  const [groq, setGroq] = useState(apiKeys.groq || '');

  const [showGemini, setShowGemini] = useState(false);
  const [showOpenai, setShowOpenai] = useState(false);
  const [showGroq, setShowGroq] = useState(false);

  const [saved, setSaved] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ gemini, openai, groq });
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 1200);
  };

  const inputCls =
    "w-full bg-bg border border-line rounded py-2 pl-3 pr-10 text-xs text-text focus:border-primary outline-none transition-colors";
  const linkCls = "text-[10px] text-primary hover:underline";
  const eyeCls = "absolute right-3 top-2.5 text-muted hover:text-text";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div
        className="w-full max-w-md bg-surface border border-line rounded-lg shadow-2xl overflow-hidden relative z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-line flex items-center justify-between bg-bg/40">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-accent" strokeWidth={1.5} />
            <h3 className="font-display font-bold text-text text-lg tracking-tight">API authentication</h3>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-text transition-colors p-1 rounded hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-5 space-y-4">
          <div className="bg-bg/60 rounded p-3 border border-line text-[11px] text-muted leading-relaxed flex gap-2">
            <ShieldCheck className="w-5 h-5 text-success shrink-0 mt-0.5" strokeWidth={1.5} />
            <div>
              <p className="font-semibold text-text">Security &amp; privacy</p>
              <p>Your API keys are stored locally in your browser's <code className="text-text font-mono">localStorage</code>. They are sent directly to each model provider's API and never to any third-party server.</p>
            </div>
          </div>

          {/* Gemini Key */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-text">Google Gemini API key</label>
              <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className={linkCls}>Get key</a>
            </div>
            <div className="relative">
              <input
                type={showGemini ? "text" : "password"}
                className={inputCls}
                placeholder="AIzaSy..."
                value={gemini}
                onChange={(e) => setGemini(e.target.value)}
              />
              <button type="button" onClick={() => setShowGemini(!showGemini)} className={eyeCls} aria-label="Toggle visibility">
                {showGemini ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* OpenAI Key */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-text">OpenAI API key</label>
              <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer" className={linkCls}>Get key</a>
            </div>
            <div className="relative">
              <input
                type={showOpenai ? "text" : "password"}
                className={inputCls}
                placeholder="sk-..."
                value={openai}
                onChange={(e) => setOpenai(e.target.value)}
              />
              <button type="button" onClick={() => setShowOpenai(!showOpenai)} className={eyeCls} aria-label="Toggle visibility">
                {showOpenai ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          {/* Groq Key */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-text">Groq API key</label>
              <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className={linkCls}>Get key</a>
            </div>
            <div className="relative">
              <input
                type={showGroq ? "text" : "password"}
                className={inputCls}
                placeholder="gsk_..."
                value={groq}
                onChange={(e) => setGroq(e.target.value)}
              />
              <button type="button" onClick={() => setShowGroq(!showGroq)} className={eyeCls} aria-label="Toggle visibility">
                {showGroq ? <EyeOff className="w-4 h-4" strokeWidth={1.5} /> : <Eye className="w-4 h-4" strokeWidth={1.5} />}
              </button>
            </div>
          </div>

          <div className="pt-2 border-t border-line flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 rounded bg-surface-2 hover:bg-line text-text text-xs font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`flex-1 py-2 rounded text-xs font-bold transition-colors duration-150 flex justify-center items-center gap-1.5 ${
                saved ? 'bg-success text-bg' : 'bg-accent hover:bg-accent/90 text-accent-ink'
              }`}
            >
              {saved ? (<><ShieldCheck className="w-4 h-4" strokeWidth={2} /> Saved</>) : 'Save credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ApiKeyModal;
