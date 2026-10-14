import React, { useState } from 'react';
import { Delivery } from '../../types/cricket';

interface BeehiveVisualizerProps {
  deliveries: Delivery[];
  onSelectDelivery?: (delivery: Delivery) => void;
  selectedDeliveryId?: string;
}

export const BeehiveVisualizer: React.FC<BeehiveVisualizerProps> = ({
  deliveries,
  onSelectDelivery,
  selectedDeliveryId,
}) => {
  const [hoveredDelivery, setHoveredDelivery] = useState<Delivery | null>(null);

  // Stumps width ~22.8 cm, height ~71.1 cm (28 inches)
  // SVG coordinates: Width: 320, Height: 360
  // Center (middle stump) is x=160
  // Off stump x=135, Leg stump x=185
  // Ground is y=300, Top of stumps y=160 (height=140px)
  // Bails at y=155

  const getBeehiveCoords = (arrivalX: number, arrivalHeightM: number) => {
    // arrivalX: -0.5m to 0.5m. 1m = 180px
    const x = 160 + arrivalX * 180;
    // arrivalHeightM: 0m to 1.8m. Ground is 300px. 1m = 150px
    const y = 300 - arrivalHeightM * 140;
    return { x, y };
  };

  const getOutcomeColor = (outcome: string) => {
    if (outcome.includes('Wicket')) return '#ef4444';
    if (outcome === 'Dot' || outcome === 'Play & Miss') return '#eab308';
    if (outcome === '4 Runs' || outcome === '6 Runs') return '#10b981';
    return '#38bdf8';
  };

  const stumpsHitsCount = deliveries.filter(
    (d) => Math.abs(d.arrivalX) <= 0.13 && d.arrivalHeightM <= 0.75
  ).length;

  return (
    <div className="flex flex-col w-full bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-xl">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            Beehive Stumps Arrival Visualizer
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Front-on arrival line and height at batsman's popping crease
          </p>
        </div>
        <div className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-400">
          Stumps Corridor: {stumpsHitsCount}/{deliveries.length} balls
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* SVG Graphic */}
        <div className="md:col-span-8 flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <div className="relative w-[320px] h-[320px]">
            <svg viewBox="0 0 320 320" className="w-full h-full select-none">
              {/* Ground level */}
              <line x1="20" y1="300" x2="300" y2="300" stroke="#475569" strokeWidth="2" />
              <text x="290" y="314" textAnchor="end" fill="#64748b" fontSize="9" fontFamily="JetBrains Mono">
                TURF LEVEL
              </text>

              {/* Height reference lines */}
              {/* Knee roll (approx 0.5m = 70px above ground -> y=230) */}
              <line x1="40" y1="230" x2="280" y2="230" stroke="#334155" strokeDasharray="3 3" />
              <text x="45" y="225" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
                KNEE ROLL (0.50m)
              </text>

              {/* Waist height (approx 1.0m = 140px above ground -> y=160) */}
              <line x1="40" y1="160" x2="280" y2="160" stroke="#334155" strokeDasharray="3 3" />
              <text x="45" y="155" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
                BAILS / TOP OF STUMPS (0.71m)
              </text>

              {/* Batsman Stance Silhouette box */}
              <rect
                x="80"
                y="80"
                width="60"
                height="220"
                fill="#38bdf8"
                opacity="0.05"
                rx="6"
              />
              <text x="110" y="72" textAnchor="middle" fill="#38bdf8" fontSize="8" fontFamily="JetBrains Mono" opacity="0.6">
                RIGHT-HAND BAT
              </text>

              {/* Wickets Envelope Zone */}
              <rect
                x="130"
                y="160"
                width="60"
                height="140"
                fill="#ef4444"
                opacity="0.08"
                rx="2"
              />

              {/* 3 Stumps (Off: 138, Middle: 160, Leg: 182) */}
              <rect x="136" y="160" width="5" height="140" fill="#e2b96f" rx="1.5" />
              <rect x="157.5" y="160" width="5" height="140" fill="#e2b96f" rx="1.5" />
              <rect x="179" y="160" width="5" height="140" fill="#e2b96f" rx="1.5" />

              {/* Bails */}
              <rect x="133" y="156" width="26" height="4" fill="#e2b96f" rx="1" />
              <rect x="161" y="156" width="26" height="4" fill="#e2b96f" rx="1" />

              {/* Labels for Off, Middle, Leg */}
              <text x="138" y="314" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
                OFF
              </text>
              <text x="160" y="314" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
                MID
              </text>
              <text x="182" y="314" textAnchor="middle" fill="#94a3b8" fontSize="8" fontFamily="JetBrains Mono">
                LEG
              </text>

              {/* Deliveries Beehive Points */}
              {deliveries.map((d) => {
                const { x, y } = getBeehiveCoords(d.arrivalX, d.arrivalHeightM);
                const isSelected = selectedDeliveryId === d.id || hoveredDelivery?.id === d.id;
                const dotColor = getOutcomeColor(d.outcome);

                return (
                  <g
                    key={d.id}
                    onMouseEnter={() => setHoveredDelivery(d)}
                    onMouseLeave={() => setHoveredDelivery(null)}
                    onClick={() => onSelectDelivery && onSelectDelivery(d)}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="12"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        opacity="0.9"
                      />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 7 : 5.5}
                      fill={dotColor}
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                    <text
                      x={x}
                      y={y + 3}
                      textAnchor="middle"
                      fill="#0f172a"
                      fontSize="8"
                      fontFamily="JetBrains Mono"
                      fontWeight="bold"
                    >
                      {d.ballNumber}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Hover / Selected Info */}
        <div className="md:col-span-4 space-y-3">
          {hoveredDelivery ? (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-xs font-bold font-mono text-white">
                  Ball #{hoveredDelivery.ballNumber} ({hoveredDelivery.overNumber})
                </span>
                <span className="text-xs font-bold text-emerald-400">
                  {hoveredDelivery.speedKmh} km/h
                </span>
              </div>
              <div className="text-xs text-slate-300 space-y-1 font-mono">
                <div>Arrival Height: <strong>{(hoveredDelivery.arrivalHeightM * 100).toFixed(0)} cm</strong></div>
                <div>Line: <strong>{hoveredDelivery.line.replace('_', ' ').toUpperCase()}</strong></div>
                <div>Outcome: <strong className="text-amber-400">{hoveredDelivery.outcome}</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="font-bold text-slate-300 uppercase tracking-wide">Coach Analysis</div>
              <p>
                Arrival cluster shows dominant targeting of 4th-stump channel with 62% balls below bail line (71cm). High LBW & bowled probability zone.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
