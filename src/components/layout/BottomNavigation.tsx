import React from 'react';
import { Camera, BarChart2, Eye, PlaySquare, Users } from 'lucide-react';

export type ActiveNavTab = 'capture' | 'analytics' | 'drs' | 'feed' | 'team';

interface BottomNavigationProps {
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  hideOnDesktop?: boolean;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  hideOnDesktop = true,
}) => {
  const tabs = [
    { id: 'capture' as const, label: 'Capture', icon: Camera },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart2 },
    { id: 'drs' as const, label: '3D DRS', icon: Eye },
    { id: 'feed' as const, label: 'Feed & Cloud', icon: PlaySquare },
    { id: 'team' as const, label: 'Team', icon: Users },
  ];

  return (
    <nav
      className={`fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 pb-safe ${
        hideOnDesktop ? 'md:hidden' : ''
      }`}
    >
      <div className="max-w-md md:max-w-xl mx-auto grid grid-cols-5 h-16 items-center px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className="min-h-[48px] min-w-[48px] flex flex-col items-center justify-center relative group transition-colors"
              aria-label={tab.label}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? 'text-emerald-400 bg-emerald-500/15 scale-110'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2]" />
              </div>
              <span
                className={`text-[10px] tracking-tight mt-0.5 font-medium ${
                  isActive ? 'text-emerald-400 font-bold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
