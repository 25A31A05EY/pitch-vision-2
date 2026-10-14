import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RotateCcw,
  Video,
  Square,
  Play,
  Pause,
  Mic,
  Maximize2,
  Zap,
  Target,
  Sparkles,
  Volume2,
  CheckCircle2,
  AlertCircle,
  Download,
  Film,
  RefreshCw,
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
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  const [setupStep, setSetupStep] = useState<'guide' | 'calibrate' | 'live'>('live');
  const [isCalibrated, setIsCalibrated] = useState(true);
  const [audioTriggerEnabled, setAudioTriggerEnabled] = useState(true);

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

  // Real Video Recording with MediaRecorder
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordedVideosList, setRecordedVideosList] = useState<
    Array<{ id: string; url: string; timestamp: string; duration: string; speedKmh: number }>
  >([]);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const recordedVideoPlayerRef = useRef<HTMLVideoElement>(null);
  const canvasOverlayRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Enumerate camera devices
  const enumerateCameras = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = devices.filter((d) => d.kind === 'videoinput');
      setAvailableDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (e) {
      console.warn('Could not enumerate video devices:', e);
    }
  };

  // Start / Stop physical camera
  const startCamera = async (forceDeviceId?: string) => {
    setCameraLoading(true);
    setCameraError(null);

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: forceDeviceId
          ? { deviceId: { exact: forceDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : {
              facingMode: facingMode,
              width: { ideal: 1280 },
              height: { ideal: 720 },
            },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => console.warn('Video play error:', err));
        };
      }

      setCameraActive(true);
      setCameraLoading(false);
      enumerateCameras();
    } catch (err: any) {
      console.warn('Device camera could not be accessed:', err);
      setCameraActive(false);
      setCameraLoading(false);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission was denied. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError('No camera hardware was detected on this device.');
      } else {
        setCameraError(`Camera initialization failed: ${err.message || 'Check browser permissions'}`);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  // Attach stream to videoRef when stream is available or videoRef mounts
  useEffect(() => {
    if (streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(console.warn);
    }
  }, [cameraActive]);

  // Initial attempt to start camera
  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, [facingMode]);

  // Start real video recording using MediaRecorder
  const handleStartRecording = () => {
    // If camera is not active, try activating first
    if (!cameraActive || !streamRef.current) {
      startCamera();
      return;
    }

    try {
      recordedChunksRef.current = [];
      const stream = streamRef.current;

      // Determine supported mime type
      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/webm;codecs=vp9')) {
        mimeType = 'video/webm;codecs=vp9';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8')) {
        mimeType = 'video/webm;codecs=vp8';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        if (blob.size > 0) {
          const url = URL.createObjectURL(blob);
          setRecordedVideoUrl(url);

          const newVideoItem = {
            id: `rec_${Date.now()}`,
            url,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            duration: `${elapsedSeconds}s`,
            speedKmh: recentDetection?.speed || 142.4,
          };
          setRecordedVideosList((prev) => [newVideoItem, ...prev]);

          // Automatically trigger ball detection & attach recorded video URL
          triggerDeliveryCapture(undefined, url);
        }
      };

      recorder.start(100); // 100ms slice for real-time capture
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
      setElapsedSeconds(0);

      recordingTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } catch (e: any) {
      console.error('Failed to start MediaRecorder:', e);
      alert('Could not start video recorder: ' + e.message);
    }
  };

  // Stop real video recording
  const handleStopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecording(false);
  };

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
  const triggerDeliveryCapture = (customSpeed?: number, videoUrl?: string) => {
    setTrackingActive(true);
    playAudioCue();

    // Generate authentic delivery physics
    const speed = customSpeed || Number((136 + Math.random() * 11).toFixed(1));
    const speedMph = Number((speed * 0.621371).toFixed(1));
    const swingMm = Math.round((Math.random() - 0.45) * 70);
    const spinRpm = Math.round(1800 + Math.random() * 600);
    const lengths: PitchLength[] = ['good_length', 'full', 'back_of_length', 'yorker', 'short'];
    const lines: PitchLine[] = ['off_stump', 'outside_off', 'middle_stump', 'leg_stump'];

    const chosenLength = lengths[Math.floor(Math.random() * (lengths.length - 1))];
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
      videoClipUrl: videoUrl || recordedVideoUrl || '',
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

    drawTrackingTrajectory(chosenLength, swingMm);

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

    const startX = canvas.width * 0.48;
    const startY = canvas.height * 0.22;
    const bounceX = canvas.width * 0.5 + (swing > 0 ? -15 : 15);
    const bounceY = canvas.height * (len === 'yorker' ? 0.78 : len === 'full' ? 0.72 : 0.65);
    const endX = canvas.width * 0.5 + (swing > 0 ? 30 : -25);
    const endY = canvas.height * 0.82;

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#0284c7';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo((startX + bounceX) / 2, startY + 40, bounceX, bounceY);
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(bounceX, bounceY);
    ctx.quadraticCurveTo((bounceX + endX) / 2, bounceY + 20, endX, endY);
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(bounceX, bounceY, 6, 0, Math.PI * 2);
    ctx.fill();

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
            Live Device Camera & Video Recording
          </span>
          <span className="text-slate-600">·</span>
          {cameraActive ? (
            <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live Camera Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs font-mono text-amber-400">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Camera Standby
            </span>
          )}
        </div>

        {/* View Mode Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setSetupStep('guide')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              setupStep === 'guide' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Tripod Guide
          </button>
          <button
            onClick={() => setSetupStep('calibrate')}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
              setupStep === 'calibrate' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
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

      {/* Permission or Camera Start Banner if camera is not active */}
      {!cameraActive && (
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 text-xs text-slate-300">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-white block">Camera Access Needed for Live Video Recording</span>
              <span className="text-slate-400">
                {cameraError || 'Click below to allow browser camera access and stream live high-FPS video.'}
              </span>
            </div>
          </div>
          <button
            onClick={() => startCamera()}
            disabled={cameraLoading}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg flex items-center gap-2 shrink-0 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            {cameraLoading ? 'Starting Camera...' : 'Enable Live Device Camera'}
          </button>
        </div>
      )}

      {/* Tripod Guide Mode */}
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

      {/* Main Video Viewport: Video element is permanently mounted to receive the camera stream */}
      <div className="relative w-full h-[380px] sm:h-[460px] bg-slate-950 overflow-hidden flex items-center justify-center">
        {/* Real Live Camera Video Element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            cameraActive ? 'opacity-100 z-0' : 'opacity-0 pointer-events-none'
          }`}
        />

        {/* Fallback image when camera is off */}
        {!cameraActive && (
          <div className="absolute inset-0 w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900 to-slate-950 p-6 text-center z-0">
            <img
              src="/src/assets/images/cricket_pitch_action_1791968241773.jpg"
              alt="Live Cricket Pitch Feed"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
            <div className="relative z-10 max-w-sm space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Camera className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white">Live Camera Preview</h3>
              <p className="text-xs text-slate-300">
                Connect your device camera to record high-FPS deliveries and real-time computer vision ball tracking.
              </p>
              <button
                onClick={() => startCamera()}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg inline-flex items-center gap-2 cursor-pointer"
              >
                <Video className="w-4 h-4" />
                Start Live Video Feed
              </button>
            </div>
          </div>
        )}

        {/* Canvas overlay for Computer Vision trajectories */}
        <canvas
          ref={canvasOverlayRef}
          width={800}
          height={480}
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        />

        {/* Calibration Trapezoid Overlay */}
        {(setupStep === 'calibrate' || isCalibrated) && (
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 opacity-70">
            <polygon
              points="340,110 460,110 560,420 240,420"
              fill="rgba(56, 189, 248, 0.04)"
              stroke="#38bdf8"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            <line x1="330" y1="120" x2="470" y2="120" stroke="#10b981" strokeWidth="2" />
            <text x="400" y="105" textAnchor="middle" fill="#10b981" fontSize="10" fontFamily="JetBrains Mono">
              STUMPS DETECTED (20.12m)
            </text>
            <line x1="260" y1="390" x2="540" y2="390" stroke="#f59e0b" strokeWidth="2" />
            <text x="400" y="410" textAnchor="middle" fill="#f59e0b" fontSize="10" fontFamily="JetBrains Mono">
              BATTING CREASE
            </text>
          </svg>
        )}

        {/* Live Recording HUD Badge (Top Left) */}
        <div className="absolute top-3 left-3 z-20 flex flex-col gap-1.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-950/90 backdrop-blur-md border border-slate-800 text-xs shadow-lg">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                isRecording ? 'bg-red-500 animate-ping' : cameraActive ? 'bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-slate-200 font-bold">
              {isRecording ? `RECORDING LIVE [${formatTimer(elapsedSeconds)}]` : cameraActive ? 'LIVE CAMERA STREAM' : 'CAMERA STANDBY'}
            </span>
            <span className="text-slate-600">|</span>
            <span className="font-mono text-emerald-400">{fpsMode} FPS</span>
          </div>

          {audioTriggerEnabled && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[10px] text-slate-300 font-mono">
              <Mic className="w-3 h-3 text-sky-400" />
              <span>Smart Acoustic Pitch Trigger: ACTIVE</span>
            </div>
          )}
        </div>

        {/* Live Detected Delivery Specs Banner */}
        {recentDetection && (
          <div className="absolute top-3 right-3 z-20 p-3 rounded-xl bg-slate-950/95 backdrop-blur-md border border-emerald-500/40 shadow-2xl text-right animate-in fade-in duration-200">
            <div className="text-[10px] uppercase font-mono text-emerald-400 font-bold flex items-center justify-end gap-1">
              <Sparkles className="w-3 h-3" /> BALL #{recentDetection.ballCount} TRACKED
            </div>
            <div className="text-2xl font-bold font-mono text-white tabular-nums">
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

        {/* Bottom Floating Trigger Bar */}
        <div className="absolute bottom-4 left-0 right-0 z-20 flex items-center justify-center gap-3 px-4">
          {/* Main Record Button */}
          <button
            onClick={isRecording ? handleStopRecording : handleStartRecording}
            className={`px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all shadow-2xl flex items-center gap-2 cursor-pointer ${
              isRecording
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/40 animate-pulse'
                : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/30 active:scale-95'
            }`}
          >
            {isRecording ? (
              <>
                <Square className="w-4 h-4 fill-white" />
                Stop Recording & Save Clip ({formatTimer(elapsedSeconds)})
              </>
            ) : (
              <>
                <Video className="w-4 h-4" />
                Record Live Video Delivery
              </>
            )}
          </button>

          {/* Test CV Delivery Simulation */}
          <button
            onClick={() => triggerDeliveryCapture()}
            disabled={trackingActive}
            className="px-4 py-3 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-xs tracking-wider uppercase transition-all shadow-xl flex items-center gap-1.5 cursor-pointer"
            title="Simulate ball delivery with trajectory lines and speed calculation"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">Simulate CV Trajectory</span>
          </button>
        </div>
      </div>

      {/* Studio Control Toolbar */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
        {/* Camera Device Switcher & Flip */}
        <div className="flex items-center gap-2">
          {availableDevices.length > 1 ? (
            <select
              value={selectedDeviceId}
              onChange={(e) => {
                setSelectedDeviceId(e.target.value);
                startCamera(e.target.value);
              }}
              className="bg-slate-900 border border-slate-800 text-xs text-slate-200 rounded-xl px-2.5 py-1.5 focus:ring-1 focus:ring-emerald-500"
            >
              {availableDevices.map((d, idx) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
          ) : (
            <button
              onClick={() => {
                setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition-colors"
              title="Flip between front and rear cameras"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Flip Camera ({facingMode === 'environment' ? 'Back' : 'Front'})</span>
            </button>
          )}

          <button
            onClick={() => startCamera()}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh Camera Connection"
          >
            <RefreshCw className="w-3.5 h-3.5" />
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

        {/* Audio Pitch Cue Toggle */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAudioTriggerEnabled(!audioTriggerEnabled)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
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

      {/* Recorded Live Video Playback Strip (When video has been recorded) */}
      {recordedVideosList.length > 0 && (
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-white">
                Recorded Live Delivery Clips ({recordedVideosList.length})
              </span>
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              Ready for DRS & Biomechanical Review
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {recordedVideosList.slice(0, 2).map((item, idx) => (
              <div
                key={item.id}
                className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-black overflow-hidden flex items-center justify-center shrink-0 border border-slate-800 relative">
                    <video src={item.url} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                      <Play className="w-4 h-4 text-white fill-white" />
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>Clip #{recordedVideosList.length - idx}</span>
                      <span className="text-emerald-400 font-mono text-[11px]">{item.speedKmh} km/h</span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                      Duration: {item.duration} · {item.timestamp}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <a
                    href={item.url}
                    download={`PitchVision_LiveClip_${item.id}.webm`}
                    className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                    title="Download recorded clip"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
