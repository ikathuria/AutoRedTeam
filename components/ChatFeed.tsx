import React, { useEffect, useRef } from 'react';
import { Message, AgentRole } from '../types';
import { Bot, User, ShieldCheck, Terminal } from 'lucide-react';
import { AVAILABLE_MODELS } from '../constants';

interface ChatFeedProps {
  messages: Message[];
}

const ChatFeed: React.FC<ChatFeedProps> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getIcon = (role: AgentRole) => {
    switch (role) {
      case AgentRole.ATTACKER: return <User className="w-4 h-4 text-attacker" strokeWidth={1.5} />;
      case AgentRole.TARGET: return <Bot className="w-4 h-4 text-defense" strokeWidth={1.5} />;
      case AgentRole.JUDGE: return <ShieldCheck className="w-4 h-4 text-judge" strokeWidth={1.5} />;
      default: return <Terminal className="w-4 h-4 text-muted" strokeWidth={1.5} />;
    }
  };

  // Short mono chip shown on every turn (role is never signalled by color alone).
  const getChip = (role: AgentRole) => {
    switch (role) {
      case AgentRole.ATTACKER: return { label: 'ATK', cls: 'bg-attacker text-bg' };
      case AgentRole.TARGET: return { label: 'TGT', cls: 'bg-defense text-bg' };
      case AgentRole.JUDGE: return { label: 'JDG', cls: 'bg-judge text-accent-ink' };
      default: return { label: 'SYS', cls: 'bg-surface-2 text-muted' };
    }
  };

  const getBubbleStyle = (role: AgentRole) => {
    switch (role) {
      case AgentRole.ATTACKER:
        return "border-attacker/30 bg-attacker/5 text-text";
      case AgentRole.TARGET:
        return "border-defense/30 bg-defense/5 text-text ml-auto";
      case AgentRole.JUDGE:
        return "border-judge/40 bg-judge/5 text-text w-full border-dashed";
      default:
        return "border-line bg-surface/40 text-muted";
    }
  };

  const getModelLabel = (modelId?: string) => {
    if (!modelId) return "";
    const found = AVAILABLE_MODELS.find(m => m.id === modelId);
    return found ? found.name.split(" (")[0] : modelId;
  };

  return (
    <div className="flex-1 overflow-y-auto bg-bg p-6 relative flex flex-col min-h-0 select-text">
      {/* Scanline texture — instrument signature, dark-mode, no motion */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] [background:repeating-linear-gradient(0deg,rgb(var(--accent))_0_1px,transparent_1px_3px)] [mask-image:radial-gradient(ellipse_70%_55%_at_50%_0%,#000_60%,transparent_100%)]"></div>

      <div className="space-y-5 relative z-10 flex-1">
        {messages.length === 0 && (
          <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-muted space-y-4">
            <div className="w-16 h-16 rounded-lg bg-surface border border-line flex items-center justify-center">
              <Terminal className="w-8 h-8 text-accent/50" strokeWidth={1.5} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm font-mono font-semibold text-text tracking-tight">System idle</p>
              <p className="text-[11px] text-muted">Configure parameters and start the simulation in the panel.</p>
            </div>
          </div>
        )}

        {messages.map((msg) => {
          const isSystem = msg.role === AgentRole.SYSTEM;
          const isJudge = msg.role === AgentRole.JUDGE;
          const isTarget = msg.role === AgentRole.TARGET;
          const chip = getChip(msg.role);

          if (isSystem) {
            return (
              <div key={msg.id} className="mx-auto max-w-xl text-center py-2 px-4 rounded-sm bg-surface/60 border border-line text-[11px] font-mono text-muted flex items-center justify-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
                <span>{msg.content}</span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              className={`flex gap-3 max-w-[85%] ${
                isTarget ? 'self-end ml-auto flex-row-reverse' : ''
              } ${
                isJudge ? 'mx-auto max-w-2xl w-full flex-col' : ''
              }`}
            >
              {/* Profile Icon */}
              {!isJudge && (
                <div className="w-8 h-8 rounded flex items-center justify-center bg-surface border border-line shrink-0">
                  {getIcon(msg.role)}
                </div>
              )}

              {/* Message Bubble */}
              <div className={`p-4 rounded-lg border text-xs leading-relaxed whitespace-pre-wrap ${getBubbleStyle(msg.role)}`}>
                {/* Header info */}
                <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-line/60 font-mono text-[9px] text-muted justify-between">
                  <span className="flex items-center gap-2">
                    <span className={`font-bold px-1.5 py-0.5 rounded-sm tracking-[0.08em] ${chip.cls}`}>{chip.label}</span>
                    <span className="uppercase tracking-[0.1em]">{msg.role}</span>
                  </span>
                  {msg.modelName && (
                    <span className="bg-bg/60 border border-line px-1.5 py-0.5 rounded-sm text-[8px] text-muted font-semibold uppercase tracking-[0.08em]">
                      {getModelLabel(msg.modelName)}
                    </span>
                  )}
                </div>

                {/* Attacker Thoughts */}
                {msg.thought && (
                  <details className="mb-3 p-2 bg-bg/50 rounded border border-attacker/20 text-[11px] text-muted cursor-pointer">
                    <summary className="font-mono font-semibold hover:text-attacker outline-none select-none flex items-center gap-1.5 text-[9px] text-attacker uppercase tracking-[0.1em]">
                      <span>▶</span> Internal reasoning
                    </summary>
                    <p className="mt-1.5 italic leading-relaxed font-sans">{msg.thought}</p>
                  </details>
                )}

                {/* Message Body */}
                <div className="text-text text-xs font-sans leading-relaxed selection:bg-primary/30 selection:text-text">
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ChatFeed;
