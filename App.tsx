import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SimulationConfig, Message, AgentRole, SimulationStatus, JudgeVerdict, ApiKeys } from './types';
import { DEFAULT_CONFIG, PLAYBOOKS, MOCK_SIMULATIONS } from './constants';
import { getLLMProvider } from './services/llmFactory';
import ConfigPanel from './components/ConfigPanel';
import ChatFeed from './components/ChatFeed';
import AnalysisPanel from './components/AnalysisPanel';
import ApiKeyModal from './components/ApiKeyModal';
import { Sun, Moon } from 'lucide-react';

const generateId = () => Math.random().toString(36).substring(7);

type Theme = 'dark' | 'light';

const App: React.FC = () => {
  const [config, setConfig] = useState<SimulationConfig>(DEFAULT_CONFIG);
  const [status, setStatus] = useState<SimulationStatus>(SimulationStatus.IDLE);
  const [messages, setMessages] = useState<Message[]>([]);
  const [verdicts, setVerdicts] = useState<JudgeVerdict[]>([]);
  const [currentRound, setCurrentRound] = useState(0);

  // API Key State
  const [apiKeys, setApiKeys] = useState<ApiKeys>({
    gemini: localStorage.getItem('art_gemini_key') || '',
    openai: localStorage.getItem('art_openai_key') || '',
    groq: localStorage.getItem('art_groq_key') || ''
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);

  // Which pane is shown on mobile (all three show side-by-side on md+).
  const [mobileTab, setMobileTab] = useState<'config' | 'transcript' | 'telemetry'>('config');

  // Theme: 'dark' (simulator default) or 'light' (Lab Report). Initialized pre-paint in index.html.
  const [theme, setTheme] = useState<Theme>(
    () => (typeof document !== 'undefined' && document.documentElement.dataset.theme === 'light' ? 'light' : 'dark')
  );

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next; // apply synchronously so the chart re-reads tokens
    try { localStorage.setItem('art_theme', next); } catch { /* ignore */ }
    setTheme(next);
  };

  // Refs for tracking mutable state in loops
  const statusRef = useRef(status);
  statusRef.current = status;

  const configRef = useRef(config);
  configRef.current = config;

  const apiKeysRef = useRef(apiKeys);
  apiKeysRef.current = apiKeys;

  // Read messages inside the loop without making runTurn depend on them (that caused
  // re-entrant, overlapping turns). isProcessingRef guards against any concurrent run.
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const isProcessingRef = useRef(false);

  const addMessage = (role: AgentRole, content: string, thought?: string, modelName?: string) => {
    setMessages(prev => [...prev, {
      id: generateId(),
      role,
      content,
      thought,
      modelName,
      timestamp: Date.now()
    }]);
  };

  const handleStart = () => {
    if (status === SimulationStatus.FINISHED) {
      setMessages([]);
      setVerdicts([]);
      setCurrentRound(0);
    }
    setStatus(SimulationStatus.RUNNING);
  };

  const handleStop = () => {
    if (status === SimulationStatus.RUNNING) {
      setStatus(SimulationStatus.PAUSED);
    } else {
      setStatus(SimulationStatus.IDLE);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setVerdicts([]);
    setCurrentRound(0);
    setStatus(SimulationStatus.IDLE);
  };

  const handleSaveKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem('art_gemini_key', keys.gemini || '');
    localStorage.setItem('art_openai_key', keys.openai || '');
    localStorage.setItem('art_groq_key', keys.groq || '');
  };

  const handleExportCSV = () => {
    const headers = ['Round', 'Attacker Prompt', 'Target Response', 'Success', 'Score', 'Judge Reasoning'];
    const attackerMsgs = messages.filter(m => m.role === AgentRole.ATTACKER);
    const targetMsgs = messages.filter(m => m.role === AgentRole.TARGET);

    const rows = verdicts.map((verdict, index) => {
      const attackerText = attackerMsgs[index] ? attackerMsgs[index].content.replace(/"/g, '""') : "";
      const targetText = targetMsgs[index] ? targetMsgs[index].content.replace(/"/g, '""') : "";
      const reasoning = verdict.reasoning.replace(/"/g, '""');

      return [
        verdict.round,
        `"${attackerText}"`,
        `"${targetText}"`,
        verdict.attackerSuccess,
        verdict.score,
        `"${reasoning}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'red_team_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMarkdown = () => {
    const playbook = PLAYBOOKS.find(p => p.id === config.playbookId);
    let md = `# AutoRedTeam Security Audit Report\n\n`;
    md += `Generated on: ${new Date().toLocaleString()}\n`;
    md += `Simulation Mode: ${config.useMockMode ? 'MOCK/DEMO RUNNER' : 'LIVE API DUEL'}\n\n`;
    
    md += `## Configuration Details\n`;
    md += `- **Scenario**: ${playbook?.name || config.playbookId}\n`;
    md += `- **Target Secret**: \`${config.targetSecret}\`\n`;
    md += `- **Red Team Goal**: ${config.attackerGoal}\n`;
    md += `- **Max Rounds**: ${config.maxRounds}\n\n`;

    md += `## Agent Specs\n`;
    md += `- **Red Team Model**: ${config.attackerModel}\n`;
    md += `- **Blue Team Model**: ${config.targetModel}\n`;
    md += `- **Arbiter Model**: ${config.judgeModel}\n\n`;

    md += `## Telemetry Metrics\n`;
    const avgRisk = verdicts.length > 0 ? Math.round(verdicts.reduce((sum, v) => sum + v.score, 0) / verdicts.length) : 0;
    const maxRisk = verdicts.length > 0 ? Math.max(...verdicts.map(v => v.score)) : 0;
    const isBreached = verdicts.some(v => v.attackerSuccess);
    md += `- **System Status**: ${isBreached ? 'COMPROMISED' : 'SECURE'}\n`;
    md += `- **Peak Intrusion Score**: ${maxRisk}%\n`;
    md += `- **Average Intrusion Score**: ${avgRisk}%\n\n`;

    md += `## Simulation Transcript\n\n`;
    messages.forEach((msg) => {
      md += `### [${msg.role.toUpperCase()}] (${msg.modelName || 'System'})\n`;
      if (msg.thought) {
        md += `> **Thought Process**:\n> *${msg.thought.replace(/\n/g, '\n> ')}*\n\n`;
      }
      md += `${msg.content}\n\n`;
      md += `---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `red_team_report_${config.playbookId}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // The Game Loop
  const runTurn = useCallback(async () => {
    if (isProcessingRef.current) return; // guard against overlapping turns
    isProcessingRef.current = true;
    try {
    if (statusRef.current !== SimulationStatus.RUNNING) return;
    if (currentRound >= configRef.current.maxRounds) {
      setStatus(SimulationStatus.FINISHED);
      addMessage(AgentRole.SYSTEM, "Max rounds reached. Simulation ended.");
      return;
    }

    // A. MOCK INTERACTIVE SIMULATION
    if (configRef.current.useMockMode) {
      const mockTurns = MOCK_SIMULATIONS[configRef.current.playbookId] || [];
      const turn = mockTurns[currentRound];
      if (!turn) {
        setStatus(SimulationStatus.FINISHED);
        addMessage(AgentRole.SYSTEM, "Simulation complete (mock playbook completed).");
        return;
      }

      // Simulate Attacker thinking/move delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (statusRef.current !== SimulationStatus.RUNNING) return;
      addMessage(AgentRole.ATTACKER, turn.attackerMessage, turn.attackerThought, configRef.current.attackerModel);

      // Simulate Target response delay
      await new Promise(resolve => setTimeout(resolve, 1200));
      if (statusRef.current !== SimulationStatus.RUNNING) return;
      addMessage(AgentRole.TARGET, turn.targetResponse, undefined, configRef.current.targetModel);

      // Simulate Judge evaluation delay
      await new Promise(resolve => setTimeout(resolve, 900));
      if (statusRef.current !== SimulationStatus.RUNNING) return;
      
      const verdict: JudgeVerdict = {
        round: currentRound + 1,
        attackerSuccess: turn.attackerSuccess,
        score: turn.judgeScore,
        reasoning: turn.judgeReasoning,
        winner: turn.attackerSuccess ? 'Red' : undefined
      };
      
      setVerdicts(prev => [...prev, verdict]);
      addMessage(AgentRole.JUDGE, verdict.reasoning, undefined, configRef.current.judgeModel);

      if (verdict.attackerSuccess) {
        setStatus(SimulationStatus.FINISHED);
        addMessage(AgentRole.SYSTEM, `Use Case COMPROMISED: Leak detected in Round ${currentRound + 1}. Red Team Wins.`);
      }

      setCurrentRound(prev => prev + 1);
      return;
    }

    // B. LIVE LLM DUEL SIMULATION
    try {
      // 1. Attacker Move
      const historyForAttacker = messagesRef.current;
      const attackerProvider = getLLMProvider(configRef.current.attackerModel);
      const { content: attackerMsgContent, thought: attackerThought } = await attackerProvider.generateAttackerMove(
        historyForAttacker,
        configRef.current.attackerGoal,
        configRef.current.attackerModel,
        apiKeysRef.current
      );

      if (statusRef.current !== SimulationStatus.RUNNING) return;
      addMessage(AgentRole.ATTACKER, attackerMsgContent, attackerThought, configRef.current.attackerModel);

      // 2. Target Response
      const historyForTarget = [...messagesRef.current, {
        id: generateId(),
        role: AgentRole.ATTACKER,
        content: attackerMsgContent, 
        modelName: configRef.current.attackerModel,
        timestamp: Date.now() 
      }];
      
      const targetProvider = getLLMProvider(configRef.current.targetModel);
      const targetMsg = await targetProvider.generateTargetResponse(
        attackerMsgContent,
        historyForTarget,
        configRef.current.targetSecret,
        configRef.current.targetSystemPrompt,
        configRef.current.targetModel,
        apiKeysRef.current
      );

      if (statusRef.current !== SimulationStatus.RUNNING) return;
      addMessage(AgentRole.TARGET, targetMsg, undefined, configRef.current.targetModel);

      // 3. Judge evaluation
      const historyForJudge = [...historyForTarget, { 
        id: generateId(), 
        role: AgentRole.TARGET, 
        content: targetMsg, 
        modelName: configRef.current.targetModel,
        timestamp: Date.now() 
      }];
      
      const judgeProvider = getLLMProvider(configRef.current.judgeModel);
      const verdict = await judgeProvider.evaluateRound(
        historyForJudge,
        configRef.current.targetSecret,
        configRef.current.judgeModel,
        currentRound + 1,
        apiKeysRef.current
      );

      if (statusRef.current !== SimulationStatus.RUNNING) return;
      setVerdicts(prev => [...prev, verdict]);
      addMessage(AgentRole.JUDGE, verdict.reasoning, undefined, configRef.current.judgeModel);

      if (verdict.attackerSuccess) {
        setStatus(SimulationStatus.FINISHED);
        addMessage(AgentRole.SYSTEM, `Use Case COMPROMISED: Leak detected in Round ${currentRound + 1}. Red Team Wins.`);
      }

      setCurrentRound(prev => prev + 1);

    } catch (error) {
      console.error(error);
      addMessage(AgentRole.SYSTEM, `API Duel Error: ${error instanceof Error ? error.message : 'Unknown model provider failure'}`);
      setStatus(SimulationStatus.PAUSED);
    }
    } finally {
      isProcessingRef.current = false;
    }
  }, [currentRound]);

  // Effect loop
  useEffect(() => {
    if (status === SimulationStatus.RUNNING) {
      const timer = setTimeout(() => {
        runTurn();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [status, currentRound, runTurn]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden font-sans bg-bg text-text">
      <header className="h-14 bg-surface border-b border-line flex items-center px-4 sm:px-6 justify-between shrink-0 select-none z-20">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="w-6 h-6 rounded grid place-items-center bg-accent text-accent-ink font-mono font-bold text-sm shrink-0">A</span>
          <h1 className="font-mono font-semibold text-sm md:text-base tracking-tight text-text shrink-0">
            AutoRedTeam
          </h1>
          <span className="text-muted text-[10px] font-mono tracking-[0.16em] uppercase hidden sm:inline">Multi-agent simulator</span>
          {config.useMockMode ? (
            <span className="bg-surface-2 border border-line text-muted text-[9px] font-mono px-2 py-0.5 rounded-sm font-semibold uppercase tracking-[0.14em] hidden sm:inline-block">
              Mock mode
            </span>
          ) : (
            <span className="bg-accent/10 border border-accent/40 text-accent text-[9px] font-mono px-2 py-0.5 rounded-sm font-semibold uppercase tracking-[0.14em] hidden sm:inline-block">
              ● Live duel
            </span>
          )}
        </div>

        <div className="flex items-center gap-3 sm:gap-4 text-[10px] text-muted font-mono tracking-[0.1em] shrink-0">
          <span className="hidden md:inline">v1.1.0</span>
          <span className={status === SimulationStatus.RUNNING ? 'text-accent' : 'text-muted'}>
            ● {status === SimulationStatus.RUNNING ? 'ACTIVE' : 'IDLE'}
          </span>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-sm border border-line bg-surface-2 text-muted hover:text-text transition-colors"
            title={theme === 'dark' ? 'Switch to light (Lab Report)' : 'Switch to dark (Signal Console)'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark'
              ? <Sun className="w-3.5 h-3.5" strokeWidth={1.5} />
              : <Moon className="w-3.5 h-3.5" strokeWidth={1.5} />}
          </button>
        </div>
      </header>

      {/* Mobile pane switcher (hidden on md+ where all three panes show at once) */}
      <nav className="md:hidden flex shrink-0 border-b border-line bg-surface" role="tablist" aria-label="Panels">
        {([['config', 'Config'], ['transcript', 'Transcript'], ['telemetry', 'Telemetry']] as const).map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={mobileTab === id}
            onClick={() => setMobileTab(id)}
            className={`flex-1 py-2.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] border-b-2 transition-colors ${
              mobileTab === id ? 'border-accent text-accent' : 'border-transparent text-muted hover:text-text'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      <div className="flex-1 flex min-h-0">
        <div className={`${mobileTab === 'config' ? 'flex' : 'hidden'} md:flex w-full md:w-80 shrink-0 min-h-0`}>
          <ConfigPanel
            config={config}
            setConfig={setConfig}
            status={status}
            onStart={handleStart}
            onStop={handleStop}
            onReset={handleReset}
            onExport={handleExportCSV}
            onExportMarkdown={handleExportMarkdown}
            hasData={verdicts.length > 0}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
            apiKeys={apiKeys}
          />
        </div>

        <div className={`${mobileTab === 'transcript' ? 'flex' : 'hidden'} md:flex flex-1 flex-col min-w-0 min-h-0`}>
          <ChatFeed messages={messages} />
        </div>

        <div className={`${mobileTab === 'telemetry' ? 'flex' : 'hidden'} md:flex w-full md:w-80 shrink-0 min-h-0`}>
          <AnalysisPanel
            verdicts={verdicts}
            status={status}
            currentRound={currentRound}
            config={config}
            theme={theme}
          />
        </div>
      </div>

      <ApiKeyModal
        isOpen={isKeyModalOpen}
        onClose={() => setIsKeyModalOpen(false)}
        apiKeys={apiKeys}
        onSave={handleSaveKeys}
      />
    </div>
  );
};

export default App;