import React from 'react';
import { UserProfile, Team } from '../../types/cricket';
import { ActiveNavTab } from './BottomNavigation';
import {
  Camera,
  BarChart2,
  Eye,
  PlaySquare,
  Users,
  Smartphone,
  Monitor,
  Sparkles,
  Activity,
} from 'lucide-react';

interface MobileHeaderProps {
  currentUser: UserProfile;
  team: Team;
  activeTab: ActiveNavTab;
  onSelectTab: (tab: ActiveNavTab) => void;
  onOpenTeamModal: () => void;
  onOpenAuthModal: () => void;
  onOpenAiCoachModal: () => void;
  viewMode: 'desktop' | 'mobile';
  onToggleViewMode: () => void;
}

export const MobileHeader: React.FC<MobileHeaderProps> = ({
  currentUser,
  team,
  activeTab,
  onSelectTab,
  onOpenTeamModal,
  onOpenAuthModal,
  onOpenAiCoachModal,
  viewMode,
  onToggleViewMode,
}) => {
  const navItems = [
    { id: 'capture' as const, label: 'Capture Studio', icon: Camera },
    { id: 'analytics' as const, label: 'Analytics', icon: BarChart2 },
    { id: 'drs' as const, label: '3D DRS Hawk-Eye', icon: Eye },
    { id: 'feed' as const, label: 'Cloud Feed', icon: PlaySquare },
    { id: 'team' as const, label: 'Team', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-sky-500 flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
            <Activity className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
              PitchVision <span className="text-emerald-400">AI</span>
            </span>
            <span className="hidden lg:inline text-[10px] text-slate-500 font-mono ml-2 uppercase">
              Pro Sports Analytics
            </span>
          </div>
        </div>

        {/* Zone 2: Desktop Navigation Links (Visible on desktop viewMode) */}
        {viewMode === 'desktop' && (
          <nav className="hidden md:flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        )}

        {/* Zone 3: Actions & Mode Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Mode Switcher: Desktop vs Mobile View */}
          <button
            onClick={onToggleViewMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all border ${
              viewMode === 'desktop'
                ? 'bg-slate-900 text-emerald-400 border-emerald-500/40 shadow-sm'
                : 'bg-slate-900 text-sky-400 border-sky-500/40'
            }`}
            title={
              viewMode === 'desktop'
                ? 'Currently in Desktop Workstation Mode — Click for Mobile Phone Frame'
                : 'Currently in Mobile Phone Frame — Click for Full Desktop Workstation Mode'
            }
          >
            {viewMode === 'desktop' ? (
              <>
                <Monitor className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Desktop Mode</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Mobile Frame</span>
              </>
            )}
          </button>

          {/* AI Coach Trigger */}
          <button
            onClick={onOpenAiCoachModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-xs font-medium transition-colors"
            title="Open AI Biomechanical Coach"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">AI Coach</span>
          </button>

          {/* Team Switcher Button */}
          <button
            onClick={onOpenTeamModal}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 text-xs font-medium transition-colors"
            title="Manage Team & Roster"
          >
            <Users className="w-3.5 h-3.5 text-sky-400" />
            <span className="truncate max-w-[110px]">{team.name}</span>
          </button>

          {/* User Profile Avatar / Sign In */}
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 p-1 pl-2 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-white leading-none">{currentUser.name}</div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase leading-tight mt-0.5">
                {currentUser.role}
              </div>
            </div>
            <div className="w-7 h-7 rounded-lg overflow-hidden bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-xs">
              {currentUser.avatarUrl ? (
                <img
                  src={currentUser.avatarUrl}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                currentUser.name.slice(0, 1)
              )}
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};
