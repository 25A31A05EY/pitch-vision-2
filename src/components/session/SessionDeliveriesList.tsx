import React, { useState } from 'react';
import { Delivery, CricketSession } from '../../types/cricket';
import { Play, Eye, Download, Sparkles, Filter, ChevronRight, Zap } from 'lucide-react';

interface SessionDeliveriesListProps {
  session: CricketSession;
  selectedDeliveryId?: string;
  onSelectDelivery: (delivery: Delivery) => void;
  onReviewInDRS: (ballId: string) => void;
}

export const SessionDeliveriesList: React.FC<SessionDeliveriesListProps> = ({
  session,
  selectedDeliveryId,
  onSelectDelivery,
  onReviewInDRS,
}) => {
  const [filterHighlight, setFilterHighlight] = useState(false);

  const deliveries = filterHighlight
    ? session.deliveries.filter((d) => d.isHighlighted)
    : session.deliveries;

  const handleExportCSV = () => {
    const headers = 'Ball,Over,Bowler,Batsman,Speed_kmh,Speed_mph,Length,Line,Swing_mm,Spin_rpm,Outcome\n';
    const rows = session.deliveries
      .map(
        (d) =>
          `${d.ballNumber},${d.overNumber},${d.bowlerName},${d.batsmanName},${d.speedKmh},${d.speedMph},${d.length},${d.line},${d.swingMm},${d.spinRpm},"${d.outcome}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `PitchVision_Session_${session.id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 space-y-3 shadow-xl">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider">
            Ball-by-Ball Auto-Clipped Telemetry
          </h4>
          <p className="text-xs text-slate-400">
            {session.deliveries.length} tracked deliveries in current session
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setFilterHighlight(!filterHighlight)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
              filterHighlight
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Highlights Only
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            title="Download CSV telemetry"
          >
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
      </div>

      {/* Deliveries Rows */}
      <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
        {deliveries.map((delivery) => {
          const isSelected = selectedDeliveryId === delivery.id;

          return (
            <div
              key={delivery.id}
              onClick={() => onSelectDelivery(delivery)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                isSelected
                  ? 'bg-emerald-500/10 border-emerald-500'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Ball number & outcome */}
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl font-mono font-bold text-xs flex items-center justify-center shrink-0 ${
                    delivery.outcome.includes('Wicket')
                      ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                      : delivery.outcome === '4 Runs' || delivery.outcome === '6 Runs'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {delivery.overNumber}
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      {delivery.speedKmh} km/h
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({delivery.speedMph} mph)
                    </span>
                    <span className="text-[11px] text-slate-500">·</span>
                    <span
                      className={`text-[11px] font-bold ${
                        delivery.outcome.includes('Wicket')
                          ? 'text-red-400'
                          : delivery.outcome.includes('Run')
                          ? 'text-emerald-400'
                          : 'text-amber-400'
                      }`}
                    >
                      {delivery.outcome}
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 capitalize">
                    {delivery.length.replace('_', ' ')} · {delivery.line.replace('_', ' ')} ·{' '}
                    <span className="text-sky-400">
                      {delivery.swingMm > 0 ? `+${delivery.swingMm}mm Out` : `${delivery.swingMm}mm In`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions: Review in DRS */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onReviewInDRS(delivery.id);
                  }}
                  className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors flex items-center gap-1 text-[11px]"
                  title="Load into 3D DRS Hawk-Eye"
                >
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
                  <span className="hidden sm:inline">DRS</span>
                </button>
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
