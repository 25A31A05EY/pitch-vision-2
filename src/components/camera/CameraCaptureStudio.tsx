import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RotateCcw,
  Sliders,
  CheckCircle2,
  Video,
  Play,
  Square,
  Mic,
  Maximize2,
  ShieldCheck,
  Zap,
  Target,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { Delivery, PitchLength, PitchLine } from '../../types/cricket';

interface CameraCaptureStudioProps {
  onNewDeliveryCaptured: (delivery: Delivery) => void;
  activeBowlerName?: string;
  activeBatsmanName?: string;
}

export const CameraCaptureStudio: React.FC<CameraCaptureStudioProps> = ({
  onNewDeliveryCaptured,
  activeBowlerName = 'Arjun Patel',
  activeBatsmanName = 'Callum Smith',
}) => {
  // Capture state
  const [isRecording, setIsRecording] = useState(false);
  const [fpsMode, setFpsMode] = useState<60 | 120>(120);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [setupStep, setSetupStep] = useState<'guide' | 'calibrate' | 'live'>('live');
  const [isCalibrated, setIsCalibrated] = useState(true);
  const [audioTriggerEnabled, setAudioTriggerEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Simulated CV Tracking Overlay
  const [trackingActive, setTrackingActive] = useState(false);
  const [recentDetection, setRecentDetection] = useState<{
    speed: number;
    swing: number;
    length: string;
    line: string;
    ballCount: number;
  } | null>(null);

  // Phone Level & Gyroscope State
  const [tiltRoll, setTiltRoll] = useState({ pitch: 0.4, roll: -0.2 });

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Start / Stop physical camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: any) {
      console.warn('Physical camera unavailable, running CV simulator fallback:', err);
      setCameraActive(false);
      setCameraError('Camera access unavailable. Computer vision tracker running in synthetic mode.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [facingMode]);

  // Recording counter
  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setElapsedSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  // Audio Cue for Delivery Detect
  const playAudioCue = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio context might be restricted before user gesture
    }
  };

  // Trigger Delivery CV Tracking Simulation
  const triggerDeliveryCapture = (customSpeed?: number) => {
    setTrackingActive(true);
    playAudioCue();

    // Generate authentic delivery physics
    const speed = customSpeed || Number((136 + Math.random() * 11).toFixed(1));
    const speedMph = Number((speed * 0.621371).toFixed(1));
    const swingMm = Math.round((Math.random() - 0.45) * 70); // in-swing or out-swing
    const spinRpm = Math.round(1800 + Math.random() * 600);
    const lengths: PitchLength[] = ['good_length', 'full', 'back_of_length', 'yorker', 'short'];
    const lines: PitchLine[] = ['off_stump', 'outside_off', 'middle_stump', 'leg_stump'];

    const chosenLength = lengths[Math.floor(Math.random() * (lengths.length - 1))]; // bias to good length
    const chosenLine = lines[Math.floor(Math.random() * lines.length)];

    const delivery: Delivery = {
      id: `del_${Date.now()}`,
      ballNumber: (recentDetection?.ballCount || 8) + 1,
      overNumber: `2.${((recentDetection?.ballCount || 8) % 6) + 1}`,
      bowlerName: activeBowlerName,
      batsmanName: activeBatsmanName,
      speedKmh: speed,
      speedMph: speedMph,
      releaseHeightM: 2.14,
      releaseDistanceM: 0.22,
      swingMm: swingMm,
      spinRpm: spinRpm,
      seamAngleDeg: swingMm > 0 ? 12 : -14,
      length: chosenLength,
      line: chosenLine,
      pitchX: (Math.random() - 0.5) * 0.6,
      pitchY: chosenLength === 'yorker' ? 18.2 : chosenLength === 'full' ? 16.5 : 14.8,
      arrivalX: (Math.random() - 0.5) * 0.4,
      arrivalHeightM: chosenLength === 'yorker' ? 0.2 : 0.65,
      outcome: Math.random() > 0.7 ? 'Wicket (LBW)' : Math.random() > 0.4 ? 'Dot' : '1 Run',
      shotZone: 'Covers',
      shotAngleDeg: 135,
      shotDistanceM: 24,
      videoClipUrl: '',
      isHighlighted: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setRecentDetection({
      speed,
      swing: swingMm,
      length: chosenLength.replace('_', ' ').toUpperCase(),
      line: chosenLine.replace('_', ' ').toUpperCase(),
      ballCount: delivery.ballNumber,
    });

    // Draw trajectory animation on canvas
    drawTrackingTrajectory(chosenLength, swingMm);

    // Auto-clipped highlight notification
    setTimeout(() => {
      onNewDeliveryCaptured(delivery);
      setTrackingActive(false);
    }, 1200);
  };

  // Trajectory canvas animation
  const drawTrackingTrajectory = (len: string, swing: number) => {
    const canvas = canvasOverlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Bowler hand start
    const startX = canvas.width * 0.48;
    const startY = canvas.height * 0.22;

    // Pitch bounce point
    const bounceX = canvas.width * 0.5 + (swing > 0 ? -15 : 15);
    const bounceY = canvas.height * (len === 'yorker' ? 0.78 : len === 'full' ? 0.72 : 0.65);

    // Stumps arrive point
    const endX = canvas.width * 0.5 + (swing > 0 ? 30 : -25);
    const endY = canvas.height * 0.82;

    // Draw glowing trajectory
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + bounceX) / 2, startY + 40, bounceX, bounceY);
    ctx.stroke();

    // Post-bounce trajectory
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(bounceX, bounceY);
    ctx.quadraticCurveTo((bounceX + endX) / 2, bounceY + 20, endX, endY);
    ctx.stroke();

    // Bounce impact circle
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bounceX, bounceY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Clean up after 2.5s
    setTimeout(() => {
      if (canvasOverlayRef.current) {
        const c = canvasOverlayRef.current.getContext('2d');
        c?.clearRect(0, 0, canvasOverlayRef.current.width, canvasOverlayRef.current.height);
      }
    }, 2500);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col w-full bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
      {/* Top Capture Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
            Automated Session Capture
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs font-mono text-emerald-400">
            {isCalibrated ? 'Tripod Calibrated' : 'Needs Calibration'}
          </span>
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSetupStep('guide')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              setupStep === 'guide'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tripod Guide
          </button>
          <button
            onClick={() => setSetupStep('calibrate')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              setupStep === 'calibrate'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Crease Calibration
          </button>
          <button
            onClick={() => setSetupStep('live')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              setupStep === 'live'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Live Tracking
          </button>
        </div>
      </div>

      {/* Tripod Guide Mode (Instructions & Gyro Level) */}
      {setupStep === 'guide' && (
        <div className="p-4 bg-slate-950/70 border-b border-slate-800 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-200 mb-1">01. Elevation</div>
              <p className="text-[12px] text-slate-400">
                Mount smartphone at 1.2m (approx waist height) facing directly down pitch center.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-200 mb-1">02. Distance</div>
              <p className="text-[12px] text-slate-400">
                Place tripod 6–8 meters behind the bowler or wicketkeeper to capture full 22-yard corridor.
              </p>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <div className="text-xs font-bold text-slate-200 mb-1">03. Horizontal Bubble Level</div>
              <div className="flex items-center gap-2 mt-1">
                <div className="w-8 h-8 rounded-full border-2 border-emerald-500 flex items-center justify-center bg-emerald-500/10">
                  <div
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400 transition-transform"
                    style={{
                      transform: `translate(${tiltRoll.roll * 8}px, ${tiltRoll.pitch * 8}px)`,
                    }}
                  />
                </div>
                <div className="text-[11px] font-mono text-emerald-400">
                  Pitch: +{tiltRoll.pitch}° · Roll: {tiltRoll.roll}° (Level OK)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Crease Calibration Mode */}
      {setupStep === 'calibrate' && (
        <div className="p-3 bg-slate-950/80 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Target className="w-4 h-4 text-emerald-400" />
            <span>
              Pitch Perspective Lock: <strong>22.0 yards (20.12m)</strong> scale calibrated.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsCalibrated(true)}
              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors"
            >
              Lock Calibration Grid
            </button>
            <button
              onClick={() => setIsCalibrated(false)}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
            >
              Reset Points
            </button>
          </div>
        </div>
      )}

      {/* Camera / Video Viewport Area */}
      <div className="relative w-full h-[360px] sm:h-[440px] bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Real camera video or realistic synthetic background */}
        {cameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center">
            <img
              src="/src/assets/images/cricket_pitch_action_1791968241773.jpg"
              alt="Live Cricket Pitch Feed"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
          </div>
        )}

        {/* Canvas overlay for Computer Vision trajectories */}
        <canvas
          ref={canvasOverlayRef}
          width={800}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Calibration Trapezoid Lines Overlay (If in calibrate mode or camera active) */}
        {(setupStep === 'calibrate' || isCalibrated) && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
            {/* 4-point pitch perspective corridor */}
            <polygon
              points="340,110 460,110 560,420 240,420"
              fill="rgba(56, 189, 248, 0.04)"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {/* Bowling Crease Line */}
            <line x1="330" y1="120" x2="470" y2="120" stroke="#10b981" strokeWidth="2" />
            <text x="400" y="105" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="JetBrains Mono">
              STUMPS DETECTED (20.12m)
            </text>
            {/* Popping Crease Line */}
            <line x1="260" y1="390" x2="540" y2="390" stroke="#f59e0b" strokeWidth="2" />
            <text x="400" y="410" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="JetBrains Mono">
              BATTING CREASE
            </text>
          </svg>
        )}

        {/* Live Tracking HUD Pill (Top Left) */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-950/85 backdrop-blur-md border border-slate-800 text-xs">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-emerald-400'}`} />
            <span className="font-mono text-slate-200">
              {isRecording ? `REC ${formatTimer(elapsedSeconds)}` : 'STANDBY (AUTO-CLIPPING)'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-emerald-400">{fpsMode} FPS</span>
          </div>

          {audioTriggerEnabled && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900/80 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 font-mono">
              <Mic className="w-3 h-3 text-sky-400" />
              <span>Smart Acoustic Pitch Trigger Active</span>
            </div>
          )}
        </div>

        {/* Live Detected Delivery Specs Banner (When delivery occurs) */}
        {recentDetection && (
          <div className="absolute top-3 right-3 z-20 p-2.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 shadow-xl text-right animate-in fade-in duration-200">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold flex items-center justify-end gap-1">
              <Sparkles className="w-3 h-3" /> BALL #{recentDetection.ballCount} DETECTED
            </div>
            <div className="text-xl font-bold font-mono text-white tabular-nums">
              {recentDetection.speed} <span className="text-xs text-slate-400">km/h</span>
            </div>
            <div className="text-xs text-slate-300 font-mono">
              {recentDetection.length} · {recentDetection.line}
            </div>
            <div className="text-[11px] font-mono text-sky-400">
              Seam: {recentDetection.swing > 0 ? `+${recentDetection.swing}mm Out` : `${recentDetection.swing}mm In`}
            </div>
          </div>
        )}

        {/* Quick Action Overlay (Center bottom button for testing delivery trigger) */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-3 px-4">
          <button
            onClick={() => triggerDeliveryCapture()}
            disabled={trackingActive}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-bold text-xs tracking-wider uppercase transition-all shadow-lg flex items-center gap-2 cursor-pointer"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            {trackingActive ? 'Tracking Trajectory...' : 'Trigger CV Ball Delivery'}
          </button>
        </div>
      </div>

      {/* Studio Control Toolbar */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Recording Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRecording(!isRecording)}
            className={`px-3.5 py-1.5 rounded-xl font-medium text-xs flex items-center gap-1.5 transition-colors ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/30'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
            }`}
          >
            {isRecording ? <Square className="w-3.5 h-3.5 fill-white" /> : <Video className="w-3.5 h-3.5" />}
            {isRecording ? 'Stop Session' : 'Start Auto-Clip'}
          </button>

          {/* Camera Flip Button */}
          <button
            onClick={() => {
              setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Switch front/rear camera"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* FPS Mode Selector */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-900 rounded-lg border border-slate-800">
          <button
            onClick={() => setFpsMode(60)}
            className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
              fpsMode === 60 ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            60 FPS
          </button>
          <button
            onClick={() => setFpsMode(120)}
            className={`px-2.5 py-1 text-xs font-mono rounded-md transition-colors ${
              fpsMode === 120 ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            120 FPS High-Speed
          </button>
        </div>

        {/* Audio Trigger Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioTriggerEnabled(!audioTriggerEnabled)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
              audioTriggerEnabled
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                : 'bg-slate-800 text-slate-400'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            {audioTriggerEnabled ? 'Audio Cue: ON' : 'Audio Cue: OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
