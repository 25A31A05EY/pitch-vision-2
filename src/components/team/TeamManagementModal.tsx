import React, { useState } from 'react';
import { Team, TeamJoinRequest, UserProfile, UserRole } from '../../types/cricket';
import { X, Users, Copy, Check, Shield, UserCheck, UserX, Plus, Sparkles } from 'lucide-react';

interface TeamManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  currentUser: UserProfile;
  onApproveRequest: (requestId: string) => void;
  onRejectRequest: (requestId: string) => void;
  onSwitchRole: (newRole: UserRole) => void;
}

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  isOpen,
  onClose,
  team,
  currentUser,
  onApproveRequest,
  onRejectRequest,
  onSwitchRole,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'requests' | 'roster' | 'roles'>('requests');

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard?.writeText(team.joinCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const pendingRequests = team.joinRequests.filter((r) => r.status === 'pending');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{team.name}</h3>
              <p className="text-[11px] text-slate-400">{team.club} · {team.city}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Join Code Banner */}
        <div className="p-3 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="text-[10px] uppercase font-mono text-slate-500">Team Join Code:</span>
            <code className="px-2 py-0.5 rounded bg-slate-900 font-mono text-emerald-400 border border-slate-800 font-bold">
              {team.joinCode}
            </code>
          </div>
          <button
            onClick={handleCopyCode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedCode ? 'Copied' : 'Copy'}</span>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'requests'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Join Requests ({pendingRequests.length})
          </button>
          <button
            onClick={() => setActiveTab('roster')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'roster'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Roster ({team.membersCount})
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'roles'
                ? 'border-emerald-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            My Role & Permissions
          </button>
        </div>

        {/* Content Area */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1">
          {/* Tab 1: Pending Join Requests */}
          {activeTab === 'requests' && (
            <div className="space-y-2.5">
              {pendingRequests.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No pending team join requests at this time.
                </div>
              ) : (
                pendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{req.userName}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 capitalize">
                          {req.role}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {req.phone} · Requested {req.requestedAt}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onApproveRequest(req.id)}
                        className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-slate-950 transition-colors"
                        title="Approve Member"
                      >
                        <UserCheck className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onRejectRequest(req.id)}
                        className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500 hover:text-white transition-colors"
                        title="Reject Request"
                      >
                        <UserX className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Roster */}
          {activeTab === 'roster' && (
            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-white">Marcus Vance</strong>
                  <span className="text-[11px] text-slate-400 block">Head High-Performance Coach</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">COACH</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-white">Arjun Patel (#99)</strong>
                  <span className="text-[11px] text-slate-400 block">Right-arm Fast Bowler · 144.6 km/h max</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">PLAYER</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-white">Liam Henderson</strong>
                  <span className="text-[11px] text-slate-400 block">Club Director & Administrator</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">ADMIN</span>
              </div>
              <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <strong className="text-white">Callum Smith (#12)</strong>
                  <span className="text-[11px] text-slate-400 block">Top-Order Opening Batsman</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">PLAYER</span>
              </div>
            </div>
          )}

          {/* Tab 3: Switch Current Profile Role */}
          {activeTab === 'roles' && (
            <div className="space-y-3 text-xs">
              <p className="text-slate-400 leading-relaxed">
                PitchVision AI provides tailored interfaces according to your active role:
              </p>

              {(['coach', 'player', 'admin', 'spectator'] as const).map((r) => (
                <div
                  key={r}
                  onClick={() => onSwitchRole(r)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                    currentUser.role === r
                      ? 'bg-emerald-500/10 border-emerald-500 text-white'
                      : 'bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-bold capitalize flex items-center gap-2">
                      <span>{r}</span>
                      {currentUser.role === r && (
                        <span className="text-[10px] text-emerald-400 font-mono">(Active Role)</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {r === 'coach' && 'Full drill analytics, session recordings, bowler comparisons & feedback.'}
                      {r === 'player' && 'Personal speed radar, wagon wheels, delivery highlights & DRS reviews.'}
                      {r === 'admin' && 'Team roster management, join approvals, club billing & cloud storage.'}
                      {r === 'spectator' && 'Live session streaming highlights, DRS reviews and match feed.'}
                    </p>
                  </div>
                  <div
                    className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      currentUser.role === r ? 'border-emerald-500 bg-emerald-500' : 'border-slate-700'
                    }`}
                  >
                    {currentUser.role === r && <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
