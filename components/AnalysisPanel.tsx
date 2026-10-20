import React from 'react';
import { JudgeVerdict, SimulationStatus, SimulationConfig } from '../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, Activity, ShieldAlert, Cpu } from 'lucide-react';
import { AVAILABLE_MODELS } from '../constants';

interface AnalysisPanelProps {
  verdicts: JudgeVerdict[];
  status: SimulationStatus;
  currentRound: number;
  config: SimulationConfig;
}

// Brand token hexes (dark theme) for the recharts SVG, which can't take Tailwind classes.
const C = {
  attacker: '#FF6B6B',
  line: '#2A2E37',
  muted: '#8A8F98',
  surface: '#16181D',
};

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ verdicts, status, currentRound, config }) => {
  const lastVerdict = verdicts[verdicts.length - 1];
  const chartData = verdicts.map(v => ({ round: `R${v.round}`, score: v.score }));

  // Calculated Stats
  const avgRisk = verdicts.length > 0
    ? Math.round(verdicts.reduce((sum, v) => sum + v.score, 0) / verdicts.length)
    : 0;

  const maxRisk = verdicts.length > 0
    ? Math.max(...verdicts.map(v => v.score))
    : 0;

  const isBreached = verdicts.some(v => v.attackerSuccess);

  const getSystemStatusLabel = () => {
    if (isBreached) return { text: "COMPROMISED", color: "text-danger", bg: "border-danger/40 bg-danger/10" };
    if (maxRisk > 70) return { text: "HIGH RISK", color: "text-warning", bg: "border-warning/40 bg-warning/10" };
    if (maxRisk > 35) return { text: "ELEVATED THREAT", color: "text-defense", bg: "border-defense/40 bg-defense/10" };
    if (status === SimulationStatus.RUNNING) return { text: "ACTIVE MONITORING", color: "text-accent", bg: "border-accent/40 bg-accent/10" };
    return { text: "SECURE", color: "text-success", bg: "border-success/40 bg-success/10" };
  };

  const getModelLabel = (modelId: string) => {
    const found = AVAILABLE_MODELS.find(m => m.id === modelId);
    return found ? found.name.split(" (")[0] : modelId;
  };

  const riskColor = (v: number) => (v > 70 ? 'text-danger' : v > 35 ? 'text-warning' : 'text-success');
  const systemStatus = getSystemStatusLabel();

  return (
    <div className="w-full md:w-80 border-l border-line bg-surface/50 flex flex-col h-full overflow-y-auto shrink-0 select-none">
      {/* Telemetry Header */}
      <div className="p-4 border-b border-line flex items-center gap-2">
        <Activity className="w-5 h-5 text-accent" strokeWidth={1.5} />
        <h2 className="font-display font-bold text-text text-sm tracking-tight">Telemetry</h2>
      </div>

      <div className="p-4 space-y-4 flex-1">
        {/* Environment Specs */}
        <div className="bg-bg border border-line rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold text-muted uppercase tracking-[0.12em]">
            <Cpu className="w-3.5 h-3.5 text-accent" strokeWidth={1.5} />
            <span>Target environment</span>
          </div>
          <div className="space-y-1 text-[10px] font-mono">
            <div className="flex justify-between">
              <span className="text-muted">ATTACKER</span>
              <span className="text-attacker font-semibold truncate max-w-[130px]" title={getModelLabel(config.attackerModel)}>
                {config.useMockMode ? "MOCK RUNNER" : getModelLabel(config.attackerModel)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">TARGET</span>
              <span className="text-defense font-semibold truncate max-w-[130px]" title={getModelLabel(config.targetModel)}>
                {config.useMockMode ? "MOCK DEVIATOR" : getModelLabel(config.targetModel)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted">ARBITER</span>
              <span className="text-judge font-semibold truncate max-w-[130px]" title={getModelLabel(config.judgeModel)}>
                {config.useMockMode ? "MOCK EVALUATOR" : getModelLabel(config.judgeModel)}
              </span>
            </div>
          </div>
        </div>

        {/* System Health / Status Card */}
        <div className={`border rounded-lg p-4 transition-all duration-150 ${systemStatus.bg}`}>
          <div className="text-[10px] font-mono font-semibold text-muted uppercase tracking-[0.12em] mb-1">Defense shield status</div>
          <div className={`text-base font-mono font-bold flex items-center gap-2 ${systemStatus.color}`}>
            {systemStatus.text}
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 bg-current" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-current" />
            </span>
          </div>
          <div className="mt-2 text-[10px] text-muted font-mono flex justify-between tabular">
            <span>Status: {status}</span>
            <span>Round: {currentRound} / {config.maxRounds}</span>
          </div>
        </div>

        {/* Secondary Stats Row */}
        <div className="grid grid-cols-2 gap-2 font-mono">
          <div className="bg-bg border border-line rounded-lg p-2.5 text-center">
            <div className="text-[8px] font-semibold text-muted uppercase tracking-[0.12em] mb-0.5">Peak risk</div>
            <div className={`text-xl font-display font-bold tabular ${riskColor(maxRisk)}`}>
              {maxRisk}%
            </div>
          </div>
          <div className="bg-bg border border-line rounded-lg p-2.5 text-center">
            <div className="text-[8px] font-semibold text-muted uppercase tracking-[0.12em] mb-0.5">Avg risk</div>
            <div className="text-xl font-display font-bold text-text tabular">
              {avgRisk}%
            </div>
          </div>
        </div>

        {/* Verdict Details */}
        {lastVerdict ? (
          <div className={`bg-bg/60 border rounded-lg p-4 space-y-3 ${
            lastVerdict.attackerSuccess ? 'border-danger/30' : 'border-line'
          }`}>
            <div className="flex justify-between items-center">
              <div className="text-[10px] font-mono font-semibold text-muted uppercase tracking-[0.12em]">Latest verdict</div>
              {lastVerdict.attackerSuccess ? (
                <div className="flex items-center gap-1 text-xs text-danger font-mono font-bold">
                  <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>LEAK</span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-xs text-success font-mono font-bold">
                  <CheckCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                  <span>SECURE</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-muted italic leading-relaxed border-l-2 border-line pl-2">
              "{lastVerdict.reasoning}"
            </p>

            <div>
              <div className="flex justify-between text-[9px] uppercase font-semibold text-muted mb-1 font-mono tracking-[0.1em]">
                <span>Intrusion score</span>
                <span className={`tabular ${riskColor(lastVerdict.score)}`}>
                  {lastVerdict.score}%
                </span>
              </div>
              <div className="h-1.5 w-full bg-surface-2 border border-line rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    lastVerdict.score > 70 ? 'bg-danger' :
                    lastVerdict.score > 35 ? 'bg-warning' :
                    'bg-success'
                  }`}
                  style={{ width: `${lastVerdict.score}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center p-6 border border-dashed border-line rounded-lg bg-bg/20">
            <ShieldAlert className="w-6 h-6 text-muted mx-auto mb-1.5" strokeWidth={1.5} />
            <p className="text-[10px] text-muted font-mono">Waiting for the Arbiter verdict…</p>
          </div>
        )}

        {/* Risk Chart */}
        <div className="bg-bg border border-line rounded-lg p-3.5">
          <div className="text-[10px] font-mono font-semibold text-muted uppercase tracking-[0.12em] mb-3 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-attacker" strokeWidth={1.5} />
            <span>Risk trajectory</span>
          </div>
          <div className="h-32 w-full font-mono text-[9px]">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={C.attacker} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={C.attacker} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.line} vertical={false} />
                  <XAxis dataKey="round" stroke={C.muted} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 100]} stroke={C.muted} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: C.surface, borderColor: C.line, borderRadius: '8px', fontSize: '10px' }}
                    itemStyle={{ color: C.attacker }}
                    labelStyle={{ color: C.muted }}
                  />
                  <Area
                    type="monotone"
                    dataKey="score"
                    stroke={C.attacker}
                    fillOpacity={1}
                    fill="url(#colorRisk)"
                    strokeWidth={1.5}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted italic text-[10px]">
                No trajectory data yet.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPanel;
