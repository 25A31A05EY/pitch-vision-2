import React, { useState } from 'react';
import { Delivery, PitchLength, PitchLine } from '../../types/cricket';
import { Filter, Layers, Zap, Info } from 'lucide-react';

interface PitchMapVisualizerProps {
  deliveries: Delivery[];
  onSelectDelivery?: (delivery: Delivery) => void;
  selectedDeliveryId?: string;
}

export const PitchMapVisualizer: React.FC<PitchMapVisualizerProps> = ({
  deliveries,
  onSelectDelivery,
  selectedDeliveryId,
}) => {
  const [lengthFilter, setLengthFilter] = useState<PitchLength | 'all'>('all');
  const [lineFilter, setLineFilter] = useState<PitchLine | 'all'>('all');
  const [outcomeFilter, setOutcomeFilter] = useState<'all' | 'wickets' | 'dots' | 'boundaries'>('all');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [inspectedDelivery, setInspectedDelivery] = useState<Delivery | null>(null);

  // Filter deliveries
  const filtered = deliveries.filter((d) => {
    if (lengthFilter !== 'all' && d.length !== lengthFilter) return false;
    if (lineFilter !== 'all' && d.line !== lineFilter) return false;
    if (outcomeFilter === 'wickets' && !d.outcome.includes('Wicket')) return false;
    if (outcomeFilter === 'dots' && d.outcome !== 'Dot' && d.outcome !== 'Play & Miss') return false;
    if (outcomeFilter === 'boundaries' && d.outcome !== '4 Runs' && d.outcome !== '6 Runs') return false;
    return true;
  });

  // Calculate length zone percentages
  const total = deliveries.length || 1;
  const goodLengthCount = deliveries.filter((d) => d.length === 'good_length').length;
  const fullCount = deliveries.filter((d) => d.length === 'full' || d.length === 'yorker').length;
  const shortCount = deliveries.filter((d) => d.length === 'short' || d.length === 'back_of_length').length;

  // Convert pitch coordinates (pitchX: -1.5m to 1.5m, pitchY: 8m to 20m) to SVG percentages
  // SVG coordinates: Width: 260px (pitch width ~3.05m), Height: 500px (pitch length 8m to 20.12m)
  const getSvgCoordinates = (pitchX: number, pitchY: number) => {
    // pitchX: center is 130px. 1 meter ~ 70px.
    const x = 130 + pitchX * 65;
    // pitchY: 8m is top (y=20px), 20.12m is batting crease (y=470px).
    // range: 20.12 - 8 = 12.12m mapped to 450px
    const y = 20 + ((pitchY - 8) / 12.12) * 450;
    return { x, y };
  };

  const getOutcomeColor = (outcome: string) => {
    if (outcome.includes('Wicket')) return '#ef4444'; // Red
    if (outcome === 'Dot' || outcome === 'Play & Miss') return '#eab308'; // Amber/Gold
    if (outcome === '4 Runs' || outcome === '6 Runs') return '#10b981'; // Green
    return '#38bdf8'; // Sky blue (1-2 runs)
  };

  return (
    <div className="flex flex-col w-full bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-4 shadow-xl">
      {/* Header & Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            2D Pitch Map & Length Scatter
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time delivery impact coordinates across 22 yards
          </p>
        </div>

        {/* Heatmap Toggle & Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              showHeatmap
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {showHeatmap ? 'Heatmap: ON' : 'Heatmap: OFF'}
          </button>
        </div>
      </div>

      {/* Length Zone KPI Pills */}
      <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono">
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Good Length (14-16m)</div>
          <div className="text-base font-bold text-emerald-400 tabular-nums">
            {((goodLengthCount / total) * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-slate-500">{goodLengthCount} deliveries</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Full / Yorker (&gt;16m)</div>
          <div className="text-base font-bold text-sky-400 tabular-nums">
            {((fullCount / total) * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-slate-500">{fullCount} deliveries</div>
        </div>
        <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase">Short / Back (&lt;14m)</div>
          <div className="text-base font-bold text-amber-400 tabular-nums">
            {((shortCount / total) * 100).toFixed(0)}%
          </div>
          <div className="text-[10px] text-slate-500">{shortCount} deliveries</div>
        </div>
      </div>

      {/* Main Pitch Canvas and Details Split */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Pitch Graphic Container */}
        <div className="md:col-span-7 flex justify-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
          <div className="relative w-[260px] h-[480px]">
            {/* SVG 2D Pitch Representation */}
            <svg
              viewBox="0 0 260 480"
              className="w-full h-full rounded-lg overflow-hidden shadow-inner select-none"
            >
              {/* Pitch turf background */}
              <rect x="20" y="10" width="220" height="460" rx="8" fill="#a39074" opacity="0.9" />

              {/* Length Zone Shading */}
              {/* Short Zone (8m to 11m) */}
              <rect x="20" y="20" width="220" height="90" fill="#78350f" opacity="0.15" />
              <text x="30" y="35" fill="#fef08a" fontSize="9" fontFamily="JetBrains Mono" opacity="0.8">
                SHORT (&lt;11m)
              </text>

              {/* Back of a Length (11m to 13.5m) */}
              <rect x="20" y="110" width="220" height="85" fill="#ca8a04" opacity="0.12" />
              <text x="30" y="125" fill="#fde047" fontSize="9" fontFamily="JetBrains Mono" opacity="0.8">
                BACK OF LENGTH (11-13.5m)
              </text>

              {/* Good Length (13.5m to 16m) - Key Bowling Channel */}
              <rect x="20" y="195" width="220" height="95" fill="#15803d" opacity="0.22" />
              <text x="30" y="210" fill="#86efac" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                GOOD LENGTH (13.5-16m)
              </text>

              {/* Full Zone (16m to 18m) */}
              <rect x="20" y="290" width="220" height="80" fill="#0284c7" opacity="0.15" />
              <text x="30" y="305" fill="#7dd3fc" fontSize="9" fontFamily="JetBrains Mono" opacity="0.8">
                FULL (16-18m)
              </text>

              {/* Yorker Zone (18m to 19.5m) */}
              <rect x="20" y="370" width="220" height="60" fill="#dc2626" opacity="0.18" />
              <text x="30" y="385" fill="#fca5a5" fontSize="9" fontFamily="JetBrains Mono" opacity="0.8">
                YORKER (18-19.5m)
              </text>

              {/* Pitch Stumps & Crease Markings */}
              {/* Bowling Crease / Stumps at bottom */}
              <line x1="30" y1="440" x2="230" y2="440" stroke="#ffffff" strokeWidth="2.5" />
              {/* Stumps line */}
              <line x1="40" y1="465" x2="220" y2="465" stroke="#ffffff" strokeWidth="1.5" />
              {/* 3 Stumps */}
              <circle cx="120" cy="465" r="3" fill="#ffffff" />
              <circle cx="130" cy="465" r="3" fill="#ffffff" />
              <circle cx="140" cy="465" r="3" fill="#ffffff" />
              <text x="130" y="458" textAnchor="middle" fill="#ffffff" fontSize="8" fontFamily="JetBrains Mono">
                BATSMAN CREASE
              </text>

              {/* Stumps & Crease at top (Bowler's end) */}
              <line x1="30" y1="20" x2="230" y2="20" stroke="#ffffff" strokeWidth="2" opacity="0.7" />

              {/* Off Stump, Middle, Leg Corridor Guides */}
              <line x1="130" y1="20" x2="130" y2="465" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.3" />
              <line x1="105" y1="20" x2="105" y2="465" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.2" />
              <line x1="155" y1="20" x2="155" y2="465" stroke="#ffffff" strokeWidth="0.5" strokeDasharray="2 4" opacity="0.2" />

              {/* Heatmap Glow Circles (If enabled) */}
              {showHeatmap &&
                filtered.map((d) => {
                  const { x, y } = getSvgCoordinates(d.pitchX, d.pitchY);
                  return (
                    <circle
                      key={`hm_${d.id}`}
                      cx={x}
                      cy={y}
                      r="24"
                      fill="#f59e0b"
                      opacity="0.25"
                      style={{ filter: 'blur(8px)' }}
                    />
                  );
                })}

              {/* Delivery Impact Dots */}
              {filtered.map((d) => {
                const { x, y } = getSvgCoordinates(d.pitchX, d.pitchY);
                const isSelected = selectedDeliveryId === d.id || inspectedDelivery?.id === d.id;
                const dotColor = getOutcomeColor(d.outcome);

                return (
                  <g
                    key={d.id}
                    onClick={() => {
                      setInspectedDelivery(d);
                      if (onSelectDelivery) onSelectDelivery(d);
                    }}
                    className="cursor-pointer"
                  >
                    {isSelected && (
                      <circle
                        cx={x}
                        cy={y}
                        r="11"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2"
                        className="animate-ping"
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
                      x={x + 7}
                      y={y + 3}
                      fill="#ffffff"
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

        {/* Delivery Details & Inspector Panel */}
        <div className="md:col-span-5 flex flex-col space-y-3">
          {/* Legend */}
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase text-slate-400">Legend & Outcomes</span>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Wicket ({deliveries.filter((d) => d.outcome.includes('Wicket')).length})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span>Dot / Miss ({deliveries.filter((d) => d.outcome === 'Dot' || d.outcome === 'Play & Miss').length})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Boundary ({deliveries.filter((d) => d.outcome === '4 Runs' || d.outcome === '6 Runs').length})</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                <span>1–2 Runs ({deliveries.filter((d) => d.outcome === '1 Run' || d.outcome === '2 Runs').length})</span>
              </div>
            </div>
          </div>

          {/* Inspected Delivery Details */}
          {inspectedDelivery ? (
            <div className="p-3.5 bg-slate-950 rounded-xl border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-800">
                <span className="text-xs font-bold text-white uppercase font-mono">
                  Ball {inspectedDelivery.overNumber} (Ball #{inspectedDelivery.ballNumber})
                </span>
                <span
                  className="px-2 py-0.5 rounded text-[11px] font-bold"
                  style={{
                    backgroundColor: `${getOutcomeColor(inspectedDelivery.outcome)}20`,
                    color: getOutcomeColor(inspectedDelivery.outcome),
                  }}
                >
                  {inspectedDelivery.outcome}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px]">SPEED</span>
                  <strong className="text-white text-sm">
                    {inspectedDelivery.speedKmh} <span className="text-xs text-slate-400">km/h</span>
                  </strong>
                  <span className="text-slate-500 text-[10px] block">({inspectedDelivery.speedMph} mph)</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SEAM / SWING</span>
                  <strong className="text-sky-400 text-sm">
                    {inspectedDelivery.swingMm > 0
                      ? `+${inspectedDelivery.swingMm}mm Out`
                      : `${inspectedDelivery.swingMm}mm In`}
                  </strong>
                  <span className="text-slate-500 text-[10px] block">{inspectedDelivery.spinRpm} RPM</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">PITCH LENGTH</span>
                  <strong className="text-slate-200">
                    {inspectedDelivery.length.replace('_', ' ').toUpperCase()} ({inspectedDelivery.pitchY}m)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">LINE</span>
                  <strong className="text-slate-200">
                    {inspectedDelivery.line.replace('_', ' ').toUpperCase()}
                  </strong>
                </div>
              </div>

              {inspectedDelivery.notes && (
                <p className="text-[11px] text-slate-300 italic bg-slate-900 p-2 rounded-lg">
                  "{inspectedDelivery.notes}"
                </p>
              )}
            </div>
          ) : (
            <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800/60 text-center text-xs text-slate-400">
              Tap any delivery point on the pitch to inspect speed, swing, and telemetry.
            </div>
          )}

          {/* Filter Dropdowns */}
          <div className="space-y-2 pt-1">
            <span className="text-[11px] font-bold uppercase text-slate-400">Filter Deliveries</span>
            <div className="grid grid-cols-2 gap-2">
              <select
                value={lengthFilter}
                onChange={(e) => setLengthFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Lengths</option>
                <option value="yorker">Yorker</option>
                <option value="full">Full</option>
                <option value="good_length">Good Length</option>
                <option value="back_of_length">Back of Length</option>
                <option value="short">Short</option>
              </select>

              <select
                value={outcomeFilter}
                onChange={(e) => setOutcomeFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500"
              >
                <option value="all">All Outcomes</option>
                <option value="wickets">Wickets Only</option>
                <option value="dots">Dots & Misses</option>
                <option value="boundaries">Boundaries (4s/6s)</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
