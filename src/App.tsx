/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  INITIAL_USER,
  INITIAL_TEAM,
  MOCK_SESSIONS,
  DRS_SCENARIOS,
  MOCK_FEED_POSTS,
} from './data/mockCricketData';
import {
  UserProfile,
  UserRole,
  CricketSession,
  Delivery,
  FeedPost,
  Team,
} from './types/cricket';
import { MobileHeader } from './components/layout/MobileHeader';
import { BottomNavigation, ActiveNavTab } from './components/layout/BottomNavigation';
import { CameraCaptureStudio } from './components/camera/CameraCaptureStudio';
import { DrsHawkEyeVisualizer } from './components/drs/DrsHawkEyeVisualizer';
import { PitchMapVisualizer } from './components/analytics/PitchMapVisualizer';
import { BeehiveVisualizer } from './components/analytics/BeehiveVisualizer';
import { WagonWheelVisualizer } from './components/analytics/WagonWheelVisualizer';
import { CloudSocialFeed } from './components/feed/CloudSocialFeed';
import { SessionDeliveriesList } from './components/session/SessionDeliveriesList';
import { TeamManagementModal } from './components/team/TeamManagementModal';
import { AuthModal } from './components/auth/AuthModal';
import { AiCoachModal } from './components/ai/AiCoachModal';
import {
  Camera,
  BarChart2,
  Eye,
  PlaySquare,
  Sparkles,
  Users,
  Activity,
  Zap,
  Flame,
  Award,
  Layers,
  LayoutGrid,
  Monitor,
  CheckCircle2,
} from 'lucide-react';

export default function App() {
  // Mode state: Default to 'desktop' as requested by the user
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');

  // State management
  const [currentUser, setCurrentUser] = useState<UserProfile>(INITIAL_USER);
  const [team, setTeam] = useState<Team>(INITIAL_TEAM);
  const [activeTab, setActiveTab] = useState<ActiveNavTab>('capture');
  const [activeSession, setActiveSession] = useState<CricketSession>(MOCK_SESSIONS[0]);
  const [feedPosts, setFeedPosts] = useState<FeedPost[]>(MOCK_FEED_POSTS);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery>(
    MOCK_SESSIONS[0].deliveries[0]
  );
  const [activeDrsBallId, setActiveDrsBallId] = useState<string>('del_04');

  // Modals state
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isAiCoachModalOpen, setIsAiCoachModalOpen] = useState(false);

  // Analytics sub-view (Pitch Map, Beehive, Wagon Wheel, or Desktop All-in-One Multi-View)
  const [analyticsSubView, setAnalyticsSubView] = useState<'pitch' | 'beehive' | 'wagon' | 'all'>('pitch');

  // Handlers for captured deliveries
  const handleNewDeliveryCaptured = (newDelivery: Delivery) => {
    setActiveSession((prev) => {
      const updatedDeliveries = [newDelivery, ...prev.deliveries];
      const speeds = updatedDeliveries.map((d) => d.speedKmh);
      const avg = Number((speeds.reduce((a, b) => a + b, 0) / speeds.length).toFixed(1));
      const max = Math.max(...speeds);

      return {
        ...prev,
        totalDeliveries: updatedDeliveries.length,
        avgSpeedKmh: avg,
        maxSpeedKmh: max,
        deliveries: updatedDeliveries,
      };
    });

    // Auto-create a feed post for highlights
    if (newDelivery.isHighlighted) {
      const newPost: FeedPost = {
        id: `post_${Date.now()}`,
        authorName: currentUser.name,
        authorRole: currentUser.role,
        authorAvatar: currentUser.avatarUrl,
        teamName: team.name,
        timeAgo: 'Just now',
        title: `${newDelivery.speedKmh} km/h ${newDelivery.length.replace('_', ' ')} delivery`,
        description: `Auto-clipped highlight: Ball ${newDelivery.overNumber} recorded at ${newDelivery.speedKmh} km/h with ${newDelivery.swingMm > 0 ? `+${newDelivery.swingMm}mm outswing` : `${newDelivery.swingMm}mm inswing`}.`,
        delivery: newDelivery,
        likesCount: 1,
        hasLiked: false,
        comments: [],
      };
      setFeedPosts((prev) => [newPost, ...prev]);
    }

    setSelectedDelivery(newDelivery);
  };

  // Feed interactions
  const handleLikePost = (postId: string) => {
    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            hasLiked: !p.hasLiked,
            likesCount: p.hasLiked ? p.likesCount - 1 : p.likesCount + 1,
          };
        }
        return p;
      })
    );
  };

  const handlePostComment = (postId: string, text: string) => {
    const newComment = {
      id: `c_${Date.now()}`,
      author: currentUser.name,
      role: currentUser.role,
      avatar: currentUser.avatarUrl,
      text,
      timestamp: 'Just now',
    };
    setFeedPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return { ...p, comments: [...p.comments, newComment] };
        }
        return p;
      })
    );
  };

  // Review in DRS
  const handleReviewInDRS = (ballId: string) => {
    setActiveDrsBallId(ballId);
    setActiveTab('drs');
  };

  // Team join approvals
  const handleApproveRequest = (requestId: string) => {
    setTeam((prev) => ({
      ...prev,
      membersCount: prev.membersCount + 1,
      joinRequests: prev.joinRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'approved' as const } : r
      ),
    }));
  };

  const handleRejectRequest = (requestId: string) => {
    setTeam((prev) => ({
      ...prev,
      joinRequests: prev.joinRequests.map((r) =>
        r.id === requestId ? { ...r, status: 'rejected' as const } : r
      ),
    }));
  };

  const handleSwitchRole = (newRole: UserRole) => {
    setCurrentUser((prev) => ({ ...prev, role: newRole }));
  };

  const isPhoneFrame = viewMode === 'mobile';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center">
      {/* Wrapper: Full Widescreen Desktop Workstation or Smartphone Frame */}
      <div
        className={`w-full flex-1 flex flex-col transition-all duration-300 ${
          isPhoneFrame
            ? 'max-w-[430px] my-4 rounded-[40px] border-[6px] border-slate-800 shadow-2xl overflow-hidden bg-slate-950 min-h-[850px] relative'
            : 'max-w-7xl'
        }`}
      >
        {/* Header with Desktop Navigation Bar */}
        <MobileHeader
          currentUser={currentUser}
          team={team}
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          onOpenTeamModal={() => setIsTeamModalOpen(true)}
          onOpenAuthModal={() => setIsAuthModalOpen(true)}
          onOpenAiCoachModal={() => setIsAiCoachModalOpen(true)}
          viewMode={viewMode}
          onToggleViewMode={() => setViewMode(viewMode === 'desktop' ? 'mobile' : 'desktop')}
        />

        {/* Main Content Viewport */}
        <main className={`flex-1 px-4 py-4 space-y-6 ${viewMode === 'mobile' ? 'pb-24' : 'pb-12'}`}>
          {/* Desktop Mode Status & Session Strip */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-slate-900/80 rounded-2xl border border-slate-800 shadow-lg">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                <Flame className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold text-white leading-tight">
                    {activeSession.title}
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                    {activeSession.type}
                  </span>
                  {viewMode === 'desktop' && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 font-mono border border-emerald-500/20">
                      <Monitor className="w-3 h-3" /> Desktop Pro View
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-400 mt-0.5">
                  Bowler: <strong className="text-slate-200">{activeSession.bowler}</strong> ·{' '}
                  {activeSession.location} · {activeSession.date}
                </div>
              </div>
            </div>

            {/* Quick Session Stats */}
            <div className="flex items-center gap-6 text-xs font-mono">
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Top Speed</span>
                <strong className="text-emerald-400 text-base tabular-nums">
                  {activeSession.maxSpeedKmh} <span className="text-xs text-slate-400">km/h</span>
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Avg Speed</span>
                <strong className="text-sky-400 text-base tabular-nums">
                  {activeSession.avgSpeedKmh} <span className="text-xs text-slate-400">km/h</span>
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Deliveries</span>
                <strong className="text-slate-200 text-base tabular-nums">
                  {activeSession.deliveries.length}
                </strong>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 uppercase block">Dot Ball %</span>
                <strong className="text-amber-400 text-base tabular-nums">
                  {activeSession.dotBallPct}%
                </strong>
              </div>
            </div>
          </div>

          {/* TAB 1: CAPTURE & AUTO-CLIPPING STUDIO */}
          {activeTab === 'capture' && (
            <div className={viewMode === 'desktop' ? 'lg:grid lg:grid-cols-12 gap-6 space-y-0' : 'space-y-6'}>
              {/* Left Column on Desktop: Camera Studio */}
              <div className={viewMode === 'desktop' ? 'lg:col-span-7 space-y-4' : 'space-y-4'}>
                <CameraCaptureStudio
                  onNewDeliveryCaptured={handleNewDeliveryCaptured}
                  activeBowlerName={currentUser.name}
                  activeBatsmanName="Callum Smith"
                />
              </div>

              {/* Right Column on Desktop: Live Ball-by-ball Telemetry Feed */}
              <div className={viewMode === 'desktop' ? 'lg:col-span-5' : ''}>
                <SessionDeliveriesList
                  session={activeSession}
                  selectedDeliveryId={selectedDelivery?.id}
                  onSelectDelivery={(del) => setSelectedDelivery(del)}
                  onReviewInDRS={handleReviewInDRS}
                />
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL ANALYTICS DASHBOARDS */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              {/* Analytics Segmented Switcher */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
                  <button
                    onClick={() => setAnalyticsSubView('pitch')}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      analyticsSubView === 'pitch'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2D Pitch Map
                  </button>
                  <button
                    onClick={() => setAnalyticsSubView('beehive')}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      analyticsSubView === 'beehive'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Beehive Stumps
                  </button>
                  <button
                    onClick={() => setAnalyticsSubView('wagon')}
                    className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                      analyticsSubView === 'wagon'
                        ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Wagon Wheel 360°
                  </button>
                  {viewMode === 'desktop' && (
                    <button
                      onClick={() => setAnalyticsSubView('all')}
                      className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                        analyticsSubView === 'all'
                          ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                      All-In-One Pro Multi-View
                    </button>
                  )}
                </div>

                <button
                  onClick={() => setIsAiCoachModalOpen(true)}
                  className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Coach Insight
                </button>
              </div>

              {/* Multi-view layout on desktop if selected */}
              {analyticsSubView === 'all' && viewMode === 'desktop' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <PitchMapVisualizer
                      deliveries={activeSession.deliveries}
                      onSelectDelivery={(del) => setSelectedDelivery(del)}
                      selectedDeliveryId={selectedDelivery?.id}
                    />
                    <BeehiveVisualizer
                      deliveries={activeSession.deliveries}
                      onSelectDelivery={(del) => setSelectedDelivery(del)}
                      selectedDeliveryId={selectedDelivery?.id}
                    />
                  </div>
                  <WagonWheelVisualizer
                    deliveries={activeSession.deliveries}
                    onSelectDelivery={(del) => setSelectedDelivery(del)}
                    selectedDeliveryId={selectedDelivery?.id}
                  />
                </div>
              ) : (
                <>
                  {analyticsSubView === 'pitch' && (
                    <PitchMapVisualizer
                      deliveries={activeSession.deliveries}
                      onSelectDelivery={(del) => setSelectedDelivery(del)}
                      selectedDeliveryId={selectedDelivery?.id}
                    />
                  )}

                  {analyticsSubView === 'beehive' && (
                    <BeehiveVisualizer
                      deliveries={activeSession.deliveries}
                      onSelectDelivery={(del) => setSelectedDelivery(del)}
                      selectedDeliveryId={selectedDelivery?.id}
                    />
                  )}

                  {analyticsSubView === 'wagon' && (
                    <WagonWheelVisualizer
                      deliveries={activeSession.deliveries}
                      onSelectDelivery={(del) => setSelectedDelivery(del)}
                      selectedDeliveryId={selectedDelivery?.id}
                    />
                  )}
                </>
              )}

              {/* Session list below analytics for immediate cross-referencing */}
              <SessionDeliveriesList
                session={activeSession}
                selectedDeliveryId={selectedDelivery?.id}
                onSelectDelivery={(del) => setSelectedDelivery(del)}
                onReviewInDRS={handleReviewInDRS}
              />
            </div>
          )}

          {/* TAB 3: 3D DRS HAWK-EYE REVIEW SYSTEM */}
          {activeTab === 'drs' && (
            <div className="space-y-6">
              <DrsHawkEyeVisualizer
                scenarios={DRS_SCENARIOS}
                activeScenarioId={
                  DRS_SCENARIOS.find((s) => s.ballId === activeDrsBallId)?.id ||
                  DRS_SCENARIOS[0].id
                }
              />

              {/* Explanation of DRS Computer Vision Tracking Specs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-emerald-400" />
                    Sub-Millimeter Optical Spline
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Catmull-Rom 3D polynomial regression resolves trajectory arc, aerodynamic drag coefficient, and pitch friction matrix.
                  </p>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-sky-400" />
                    UltraEdge Synchronizer
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Stump microphone acoustic telemetry correlates 48 kHz acoustic pressure spikes with optical impact frames to confirm wood contact.
                  </p>
                </div>
                <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1.5">
                  <div className="font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-400" />
                    ICC Protocol Standard
                  </div>
                  <p className="text-slate-400 leading-relaxed">
                    Compliant with 3-meter impact distance rules, clipping margins of error, and umpire's call parameters.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CLOUD SYNC & SOCIAL HIGHLIGHTS FEED */}
          {activeTab === 'feed' && (
            <div className={viewMode === 'desktop' ? 'lg:grid lg:grid-cols-12 gap-6 space-y-0' : 'space-y-6'}>
              <div className={viewMode === 'desktop' ? 'lg:col-span-8' : ''}>
                <CloudSocialFeed
                  posts={feedPosts}
                  currentUser={currentUser}
                  onPostComment={handlePostComment}
                  onLikePost={handleLikePost}
                  onReviewDRS={handleReviewInDRS}
                />
              </div>

              {/* Desktop Side Activity Panel */}
              {viewMode === 'desktop' && (
                <div className="lg:col-span-4 space-y-4">
                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      High-Performance Quick Actions
                    </h4>
                    <button
                      onClick={() => setIsAiCoachModalOpen(true)}
                      className="w-full py-2.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Run AI Spell Diagnosis
                    </button>
                    <button
                      onClick={() => setActiveTab('capture')}
                      className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      Open Camera Recorder
                    </button>
                  </div>

                  <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Top Speed Leaderboard
                    </h4>
                    <div className="space-y-2 text-xs font-mono">
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <strong className="text-white">Arjun Patel</strong>
                          <span className="text-[10px] text-slate-400 block">Opening Spell (Over 1.4)</span>
                        </div>
                        <span className="text-emerald-400 font-bold">144.6 km/h</span>
                      </div>
                      <div className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                        <div>
                          <strong className="text-white">Mitchell Starc (Net)</strong>
                          <span className="text-[10px] text-slate-400 block">Drill 3</span>
                        </div>
                        <span className="text-sky-400 font-bold">146.2 km/h</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 5: TEAM & ROSTER MANAGEMENT */}
          {activeTab === 'team' && (
            <div className="space-y-6">
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 shadow-xl space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-lg font-bold text-white">{team.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{team.club} · {team.city}</p>
                  </div>
                  <button
                    onClick={() => setIsTeamModalOpen(true)}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-colors shadow-md"
                  >
                    Manage Roster & Requests
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Active Membership</span>
                    <div className="text-base font-bold text-white">{team.membersCount} Certified Members</div>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Team Join Code</span>
                    <div className="text-base font-mono font-bold text-emerald-400">{team.joinCode}</div>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Cloud Storage Tier</span>
                    <div className="text-base font-bold text-sky-400">AWS S3 High-Speed</div>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-mono text-slate-500">Active Spell Bowler</span>
                    <div className="text-base font-bold text-amber-400">{activeSession.bowler}</div>
                  </div>
                </div>

                {/* AI Coach Card */}
                <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-950 to-sky-950/40 rounded-2xl border border-emerald-500/30 flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-emerald-400" />
                      Biomechanical Bowling AI Assistant
                    </h4>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
                      Session biomechanical scan complete: 92% seam presentation efficiency with consistent 2.14m release height. Ready to generate training drills.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAiCoachModalOpen(true)}
                    className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold rounded-xl shrink-0 transition-colors shadow-lg uppercase tracking-wider"
                  >
                    View Full Biomechanical Report
                  </button>
                </div>
              </div>

              {/* Roster list */}
              <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4 shadow-xl">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Registered Club Members & Squad
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white text-sm">Marcus Vance</strong>
                      <span className="text-[11px] text-slate-400 block">Lead High-Performance Bowling Coach</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">COACH</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white text-sm">Arjun Patel (#99)</strong>
                      <span className="text-[11px] text-slate-400 block">Right-arm Fast Bowler · 144.6 km/h max</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">PLAYER</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white text-sm">Liam Henderson</strong>
                      <span className="text-[11px] text-slate-400 block">Club Director & Administrator</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono text-[10px]">ADMIN</span>
                  </div>
                  <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                    <div>
                      <strong className="text-white text-sm">Callum Smith (#12)</strong>
                      <span className="text-[11px] text-slate-400 block">Opening Batsman · Right-hand Bat</span>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono text-[10px]">PLAYER</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Bottom Thumb Navigation Bar (Hidden on desktop workstations) */}
        <BottomNavigation
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          hideOnDesktop={viewMode === 'desktop'}
        />

        {/* Modals */}
        <TeamManagementModal
          isOpen={isTeamModalOpen}
          onClose={() => setIsTeamModalOpen(false)}
          team={team}
          currentUser={currentUser}
          onApproveRequest={handleApproveRequest}
          onRejectRequest={handleRejectRequest}
          onSwitchRole={handleSwitchRole}
        />

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          currentUser={currentUser}
          onLoginSuccess={(user) => setCurrentUser(user)}
        />

        <AiCoachModal
          isOpen={isAiCoachModalOpen}
          onClose={() => setIsAiCoachModalOpen(false)}
          session={activeSession}
        />
      </div>
    </div>
  );
}
