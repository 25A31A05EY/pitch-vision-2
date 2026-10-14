import React, { useState } from 'react';
import { CricketSession, Delivery } from '../../types/cricket';
import { X, Sparkles, TrendingUp, Target, AlertCircle, Award, CheckCircle } from 'lucide-react';

interface AiCoachModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: CricketSession;
}

export const AiCoachModal: React.FC<AiCoachModalProps> = ({ isOpen, onClose, session }) => {
  const [activeTab, setActiveTab] = useState<'biomechanics' | 'funnel' | 'drills'>('biomechanics');

  if (!isOpen) return null;

  const deliveries = session.deliveries;
  const avgSpeed = (
    deliveries.reduce((acc, d) => acc + d.speedKmh, 0) / (deliveries.length || 1)
  ).toFixed(1);
  const maxSpeed = Math.max(...deliveries.map((d) => d.speedKmh), 0);
  const goodLengthCount = deliveries.filter((d) => d.length === 'good_length').length;
  const goodLengthPct = Math.round((goodLengthCount / (deliveries.length || 1)) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                PitchVision AI Biomechanical Coach
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Session: {session.title} · {session.bowler}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Metric Strip */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-950/60 border-b border-slate-800 text-center font-mono">
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Average Velocity</span>
            <strong className="text-emerald-400 text-base">{avgSpeed} km/h</strong>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Max Peak Pace</span>
            <strong className="text-sky-400 text-base">{maxSpeed} km/h</strong>
          </div>
          <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase block">Good Length Funnel</span>
            <strong className="text-amber-400 text-base">{goodLengthPct}%</strong>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-4 pt-2 gap-2 text-xs">
          <button
            onClick={() => setActiveTab('biomechanics')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'biomechanics'
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Release Biomechanics
          </button>
          <button
            onClick={() => setActiveTab('funnel')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'funnel'
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Length & Seam Analysis
          </button>
          <button
            onClick={() => setActiveTab('drills')}
            className={`pb-2 px-2 font-medium border-b-2 transition-colors ${
              activeTab === 'drills'
                ? 'border-emerald-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Prescribed Drills (3)
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
          {activeTab === 'biomechanics' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span>Release Height Consistency: 2.14m ± 0.04m</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  The high-speed camera optical tracker detected extremely stable vertical release height with only 4cm standard deviation across 8 deliveries. High arm action enables steep bounce on good length balls.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <Target className="w-4 h-4 text-sky-400" />
                  <span>Crease Cut Distance: 0.22m Inside Popping Line</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Bowler utilized the front crease efficiently, maximizing ball travel time reduction and giving the batsman 0.03s less reaction time at 144 km/h.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'funnel' && (
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Seam Upright Angle Efficiency: 92%</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  Backspin rate averaged 2,240 RPM with a 14° tilt towards first slip, producing an average of +34mm out-swing deviation after passing halfway down the pitch.
                </p>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-200">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <span>Correction Opportunity: Back of Length Leakage</span>
                </div>
                <p className="text-slate-400 leading-relaxed">
                  When attempting the wobble seam delivery, release dropped by 7cm (to 2.07m), causing the ball to pitch 1.8m shorter than desired, which Travis Head punished for 4 runs backward of point.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'drills' && (
            <div className="space-y-2.5">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-emerald-400">01. Target Disc Funnel Drill</div>
                <p className="text-slate-300 mt-1">
                  Place two 30cm rubber discs at 14.5m and 15.2m on 4th-stump line. Execute 18 deliveries using phone tripod audio trigger mode to record hit percentage.
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-sky-400">02. Late In-Swinger Yorker Alignment</div>
                <p className="text-slate-300 mt-1">
                  Practice locking the wrist with index finger pressure at point of release to replicate Ball 1.2 (143.8 km/h bowled).
                </p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="font-bold text-purple-400">03. High Front Arm Pull Drill</div>
                <p className="text-slate-300 mt-1">
                  Use resistance bands to maintain front-arm elevation past eye-line to prevent early collapse when bowling wobble-seam cutters.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
