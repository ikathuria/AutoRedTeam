import React from 'react';
import { SimulationConfig, SimulationStatus, ApiKeys } from '../types';
import { DEFAULT_CONFIG, AVAILABLE_MODELS, PLAYBOOKS } from '../constants';
import { Settings, ShieldAlert, Target, Database, Download, Key, HelpCircle, Sparkles } from 'lucide-react';

interface ConfigPanelProps {
  config: SimulationConfig;
  setConfig: (c: SimulationConfig) => void;
  status: SimulationStatus;
  onStart: () => void;
  onStop: () => void;
  onReset: () => void;
  onExport: () => void;
  onExportMarkdown: () => void;
  hasData: boolean;
  onOpenKeyModal: () => void;
  apiKeys: ApiKeys;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  config, setConfig, status, onStart, onStop, onReset, onExport, onExportMarkdown, hasData, onOpenKeyModal, apiKeys
}) => {
  const isLocked = status === SimulationStatus.RUNNING || status === SimulationStatus.PAUSED;

  const handleChange = (field: keyof SimulationConfig, value: any) => {
    setConfig({ ...config, [field]: value });
  };

  const handlePlaybookChange = (playbookId: string) => {
    const selected = PLAYBOOKS.find(p => p.id === playbookId);
    if (selected) {
      setConfig({
        ...config,
        playbookId,
        targetSecret: selected.targetSecret,
        targetSystemPrompt: selected.targetSystemPrompt,
        attackerGoal: selected.attackerGoal
      });
    }
  };

  // Check which keys are set
  const keysCount = [apiKeys.gemini, apiKeys.openai, apiKeys.groq].filter(Boolean).length;

  const fieldCls =
    "w-full bg-bg border border-line rounded p-2 text-xs text-text outline-none focus:border-primary transition-colors";

  return (
    <div className="bg-surface border-r border-line w-full md:w-80 flex flex-col h-full overflow-y-auto shrink-0 select-none">
      {/* Sidebar Header */}
      <div className="p-4 border-b border-line flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-accent" strokeWidth={1.5} />
          <h2 className="font-display font-bold text-text text-sm tracking-tight">Mission control</h2>
        </div>
        <button
          onClick={onOpenKeyModal}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] font-mono font-semibold uppercase tracking-[0.1em] border transition-colors ${
            keysCount > 0
              ? 'border-success/40 bg-success/10 text-success hover:bg-success/20'
              : 'border-line bg-surface-2 text-muted hover:bg-line hover:text-text'
          }`}
          title="Configure API Keys"
        >
          <Key className="w-3 h-3" strokeWidth={1.5} />
          {keysCount > 0 ? `${keysCount} keys` : 'Set keys'}
        </button>
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Playbook Selector */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-accent">
            <Sparkles className="w-3 h-3" strokeWidth={1.5} /> Vulnerability scenario
          </label>
          <select
            disabled={isLocked}
            className={fieldCls}
            value={config.playbookId}
            onChange={(e) => handlePlaybookChange(e.target.value)}
          >
            {PLAYBOOKS.map(playbook => (
              <option key={playbook.id} value={playbook.id}>
                {playbook.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-muted mt-1 bg-bg/60 p-2 rounded-sm border border-line">
            {PLAYBOOKS.find(p => p.id === config.playbookId)?.description}
          </p>
        </div>

        {/* Secret Configuration */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-judge">
            <Database className="w-3 h-3" strokeWidth={1.5} /> Target secret (flag)
          </label>
          <textarea
            disabled={isLocked}
            className={`${fieldCls} font-mono text-muted`}
            rows={1}
            value={config.targetSecret}
            onChange={(e) => handleChange('targetSecret', e.target.value)}
          />
        </div>

        {/* Target System Prompt */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-defense">
            <ShieldAlert className="w-3 h-3" strokeWidth={1.5} /> Blue team system prompt
          </label>
          <textarea
            disabled={isLocked}
            className={`${fieldCls} font-mono`}
            rows={4}
            value={config.targetSystemPrompt}
            onChange={(e) => handleChange('targetSystemPrompt', e.target.value)}
          />
          <p className="text-[9px] text-muted">Inject the secret with <code className="text-text font-mono">{'{SECRET}'}</code>.</p>
        </div>

        {/* Attacker Goal */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-attacker">
            <Target className="w-3 h-3" strokeWidth={1.5} /> Red team goal
          </label>
          <textarea
            disabled={isLocked}
            className={fieldCls}
            rows={2}
            value={config.attackerGoal}
            onChange={(e) => handleChange('attackerGoal', e.target.value)}
          />
        </div>

        {/* Models Config Panel */}
        <div className="border-t border-line pt-4 space-y-3">
          <h3 className="text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-muted">Agent configuration</h3>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-semibold text-attacker uppercase tracking-[0.1em]">Red team (attacker)</label>
            <select
              disabled={isLocked || config.useMockMode}
              className="w-full bg-bg border border-line rounded-sm p-1.5 text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
              value={config.attackerModel}
              onChange={(e) => handleChange('attackerModel', e.target.value)}
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={`a-${model.id}`} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-semibold text-defense uppercase tracking-[0.1em]">Blue team (target)</label>
            <select
              disabled={isLocked || config.useMockMode}
              className="w-full bg-bg border border-line rounded-sm p-1.5 text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
              value={config.targetModel}
              onChange={(e) => handleChange('targetModel', e.target.value)}
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={`t-${model.id}`} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-mono font-semibold text-judge uppercase tracking-[0.1em]">Arbiter (safety judge)</label>
            <select
              disabled={isLocked || config.useMockMode}
              className="w-full bg-bg border border-line rounded-sm p-1.5 text-[11px] text-text outline-none focus:border-primary disabled:opacity-50"
              value={config.judgeModel}
              onChange={(e) => handleChange('judgeModel', e.target.value)}
            >
              {AVAILABLE_MODELS.map(model => (
                <option key={`j-${model.id}`} value={model.id}>{model.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mock Mode Toggle */}
        <div className="border-t border-line pt-4 flex items-center justify-between">
          <div className="flex items-center gap-1 text-[10px] font-mono font-semibold uppercase tracking-[0.12em] text-muted">
            <span>Mock mode</span>
            <HelpCircle className="w-3.5 h-3.5 text-muted cursor-help" strokeWidth={1.5} title="If enabled, uses pre-scripted high-fidelity simulation transcripts. Ideal for portfolio demos without setting up API keys." />
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              disabled={isLocked}
              checked={config.useMockMode}
              onChange={(e) => handleChange('useMockMode', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-surface-2 border border-line peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-primary rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-muted after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-accent peer-checked:after:bg-accent-ink"></div>
          </label>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="p-4 border-t border-line space-y-2 bg-bg/40">
        {status === SimulationStatus.IDLE || status === SimulationStatus.FINISHED ? (
          <button
            onClick={onStart}
            className="w-full py-2 bg-accent hover:bg-accent/90 text-accent-ink rounded font-display font-bold text-xs tracking-wide transition-colors flex justify-center items-center gap-2"
          >
            Start simulation
          </button>
        ) : (
          <button
            onClick={onStop}
            className="w-full py-2 bg-danger hover:bg-danger/90 text-bg rounded font-display font-bold text-xs tracking-wide transition-colors"
          >
            {status === SimulationStatus.PAUSED ? "Resume simulation" : "Pause simulation"}
          </button>
        )}

        <div className="flex gap-2">
          <button
            onClick={onReset}
            disabled={status === SimulationStatus.RUNNING}
            className="flex-1 py-1.5 bg-surface-2 hover:bg-line text-text rounded-sm font-mono font-semibold text-[10px] uppercase tracking-[0.1em] transition-colors disabled:opacity-40"
          >
            Reset
          </button>

          <div className="flex-1 flex gap-1">
            <button
              onClick={onExport}
              disabled={!hasData}
              className="flex-1 py-1.5 bg-surface-2 hover:bg-line text-judge rounded-sm font-mono font-semibold text-[10px] uppercase tracking-[0.1em] transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
              title="Export to CSV"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} /> CSV
            </button>
            <button
              onClick={onExportMarkdown}
              disabled={!hasData}
              className="flex-1 py-1.5 bg-surface-2 hover:bg-line text-primary rounded-sm font-mono font-semibold text-[10px] uppercase tracking-[0.1em] transition-colors disabled:opacity-40 flex items-center justify-center gap-1"
              title="Export Report (Markdown)"
            >
              <Download className="w-3.5 h-3.5" strokeWidth={1.5} /> MD
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;
