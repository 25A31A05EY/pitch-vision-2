import React, { useState } from 'react';
import { Delivery } from '../../types/cricket';

interface WagonWheelVisualizerProps {
  deliveries: Delivery[];
  onSelectDelivery?: (delivery: Delivery) => void;
  selectedDeliveryId?: string;
}

export const WagonWheelVisualizer: React.FC<WagonWheelVisualizerProps> = ({
  deliveries,
  onSelectDelivery,
  selectedDeliveryId,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'boundaries' | 'singles' | 'dots'>('all');
  const [hoveredDelivery, setHoveredDelivery] = useState<Delivery | null>(null);

  // SVG dimensions: Center is 180, 180. Radius is 140 (boundary rope).
  const centerX = 180;
  const centerY = 180;
  const boundaryRadius = 145;
  const innerRingRadius = 75; // 30 yard circle

  const filtered = deliveries.filter((d) => {
    if (filterType === 'boundaries') return d.outcome === '4 Runs' || d.outcome === '6 Runs';
    if (filterType === 'singles') return d.outcome === '1 Run' || d.outcome === '2 Runs';
    if (filterType === 'dots') return d.outcome === 'Dot' || d.outcome === 'Play & Miss' || d.outcome.includes('Wicket');
    return true;
  });

  // Calculate off-side vs leg-side runs
  // RHB: Off-side is 0 deg to 180 deg (right side/top-right), Leg-side is 180 to 360
  let offRuns = 0;
  let legRuns = 0;
  deliveries.forEach((d) => {
    let r = 0;
    if (d.outcome === '1 Run') r = 1;
    else if (d.outcome === '2 Runs') r = 2;
    else if (d.outcome === '4 Runs') r = 4;
    else if (d.outcome === '6 Runs') r = 6;

    if (d.shotAngleDeg <= 180) offRuns += r;
    else legRuns += r;
  });
  const totalRuns = offRuns + legRuns || 1;

  // Convert angle (0-360) and distance (0-90m) to SVG x,y
  const getCoordinates = (angleDeg: number, distanceM: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    const r = Math.min((distanceM / 85) * boundaryRadius, boundaryRadius);
    const x = centerX + r * Math.cos(rad);
    const y = centerY + r * Math.sin(rad);
    return { x, y };
  };

  const getShotColor = (outcome: string) => {
    if (outcome === '6 Runs') return '#10b981'; // Green
    if (outcome === '4 Runs') return '#34d399';
    if (outcome === '1 Run' || outcome === '2 Runs') return '#38bdf8'; // Blue
    if (outcome.includes('Wicket')) return '#ef4444'; // Red
    return '#f59e0b'; // Amber dot
  };

  return (
    <div className="flex flex-col w-full bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            360° Wagon Wheel Visualizer
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Radial shot distribution, field scoring zones, and boundary angles
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-950 rounded-lg border border-slate-800">
          {(['all', 'boundaries', 'singles', 'dots'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={`px-2.5 py-1 text-xs rounded-md capitalize font-medium transition-colors ${
                filterType === t
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Off-Side vs Leg-Side Split */}
      <div className="grid grid-cols-2 gap-3 text-xs font-mono text-center">
        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Off Side Runs</span>
          <strong className="text-sky-400 text-base">{offRuns} Runs</strong>{' '}
          <span className="text-slate-400 text-xs">({((offRuns / totalRuns) * 100).toFixed(0)}%)</span>
        </div>
        <div className="p-2 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase block">Leg Side Runs</span>
          <strong className="text-emerald-400 text-base">{legRuns} Runs</strong>{' '}
          <span className="text-slate-400 text-xs">({((legRuns / totalRuns) * 100).toFixed(0)}%)</span>
        </div>
      </div>

      {/* Wagon Wheel Canvas & Details Split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-8 flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <div className="relative w-[340px] h-[340px]">
            <svg viewBox="0 0 360 360" className="w-full h-full select-none">
              {/* Outfield Grass */}
              <circle cx={centerX} cy={centerY} r={boundaryRadius + 10} fill="#0d2315" />
              {/* Boundary Rope */}
              <circle
                cx={centerX}
                cy={centerY}
                r={boundaryRadius}
                fill="#14341e"
                stroke="#ffffff"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.8"
              />

              {/* 30-yard inner circle */}
              <circle
                cx={centerX}
                cy={centerY}
                r={innerRingRadius}
                fill="none"
                stroke="#334155"
                strokeWidth="1"
                strokeDasharray="3 3"
              />

              {/* Pitch in Center */}
              <rect
                x={centerX - 5}
                y={centerY - 18}
                width="10"
                height="36"
                fill="#b9a685"
                rx="1"
              />

              {/* Cardinal Sector Dividers */}
              <line x1={centerX} y1="20" x2={centerX} y2="340" stroke="#1e293b" strokeWidth="0.8" />
              <line x1="20" y1={centerY} x2="340" y2={centerY} stroke="#1e293b" strokeWidth="0.8" />

              {/* Field Region Labels */}
              <text x={centerX} y="32" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
                STRAIGHT / SIGHT SCREEN
              </text>
              <text x="325" y={centerY} textAnchor="end" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
                POINT / COVER
              </text>
              <text x="35" y={centerY} textAnchor="start" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
                SQUARE LEG / MIDWICKET
              </text>
              <text x={centerX} y="338" textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
                THIRD MAN / FINE LEG
              </text>

              {/* Shot Trajectory Vectors */}
              {filtered.map((d) => {
                if (d.shotDistanceM <= 0) return null;
                const { x, y } = getCoordinates(d.shotAngleDeg, d.shotDistanceM);
                const isSelected = selectedDeliveryId === d.id || hoveredDelivery?.id === d.id;
                const strokeColor = getShotColor(d.outcome);

                return (
                  <g
                    key={d.id}
                    onMouseEnter={() => setHoveredDelivery(d)}
                    onMouseLeave={() => setHoveredDelivery(null)}
                    onClick={() => onSelectDelivery && onSelectDelivery(d)}
                    className="cursor-pointer"
                  >
                    <line
                      x1={centerX}
                      y1={centerY}
                      x2={x}
                      y2={y}
                      stroke={strokeColor}
                      strokeWidth={isSelected ? 3 : 1.8}
                      opacity={isSelected ? 1 : 0.85}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={isSelected ? 6 : 4}
                      fill={strokeColor}
                      stroke="#0f172a"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Hovered details */}
        <div className="md:col-span-4 space-y-3">
          {hoveredDelivery ? (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/40 space-y-2">
              <div className="flex items-center justify-between pb-1 border-b border-slate-800">
                <span className="text-xs font-bold font-mono text-white">
                  Ball #{hoveredDelivery.ballNumber} ({hoveredDelivery.overNumber})
                </span>
                <span
                  className="text-xs font-bold"
                  style={{ color: getShotColor(hoveredDelivery.outcome) }}
                >
                  {hoveredDelivery.outcome}
                </span>
              </div>
              <div className="text-xs text-slate-300 font-mono space-y-1">
                <div>Zone: <strong>{hoveredDelivery.shotZone}</strong></div>
                <div>Distance: <strong>{hoveredDelivery.shotDistanceM}m</strong></div>
                <div>Delivery Speed: <strong>{hoveredDelivery.speedKmh} km/h</strong></div>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-2">
              <div className="font-bold text-slate-300 uppercase tracking-wide">Shot Scoring Tendency</div>
              <p>
                Opponents targeted cover-point arc for fast cut shots. Recommend shifting fielders deeper into sweeper cover for the next spell.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
