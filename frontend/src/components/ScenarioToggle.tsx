import React from 'react';
import { useWebSocketStore } from '../store/useWebSocketStore';

type ScenarioMode = 'general' | 'studio' | 'live';

interface ScenarioOption {
  id: ScenarioMode;
  label: string;
  icon: string;
  description: string;
}

const SCENARIOS: ScenarioOption[] = [
  {
    id: 'general',
    label: 'General',
    icon: '📖',
    description: 'Standard technical support'
  },
  {
    id: 'studio',
    label: 'Studio',
    icon: '🎙️',
    description: 'Recording & production focused'
  },
  {
    id: 'live',
    label: 'Live Stage',
    icon: '🎤',
    description: 'Live performance warnings'
  }
];

export const ScenarioToggle: React.FC = () => {
  const { scenarioMode, actions } = useWebSocketStore();

  const handleScenarioChange = (mode: ScenarioMode) => {
    actions.setScenarioMode(mode);
  };

  return (
    <div className="flex items-center space-x-2 p-3 bg-white/5 rounded-xl border border-white/10">
      <span className="text-xs font-semibold uppercase text-slate-400 tracking-widest">Context</span>
      <div className="flex space-x-1">
        {SCENARIOS.map((scenario) => (
          <button
            key={scenario.id}
            onClick={() => handleScenarioChange(scenario.id)}
            className={`
              flex items-center space-x-1.5 px-3 py-1.5 rounded-lg transition-all duration-200
              ${scenarioMode === scenario.id
                ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50'
                : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
              }
            `}
            title={scenario.description}
          >
            <span className="text-base">{scenario.icon}</span>
            <span className="text-xs font-medium">{scenario.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
