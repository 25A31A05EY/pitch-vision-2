import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { DRSScenario } from '../../types/cricket';
import { Play, Pause, RotateCcw, Volume2, Camera, Info, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';
import confetti from 'canvas-confetti';

interface DrsHawkEyeVisualizerProps {
  scenarios: DRSScenario[];
  activeScenarioId?: string;
}

export const DrsHawkEyeVisualizer: React.FC<DrsHawkEyeVisualizerProps> = ({
  scenarios,
  activeScenarioId,
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackProgress, setPlaybackProgress] = useState(0.5); // 0 to 1
  const [cameraView, setCameraView] = useState<'tv' | 'side' | 'top' | 'umpire'>('tv');
  const [showUltraEdge, setShowUltraEdge] = useState(true);
  const [showPrediction, setShowPrediction] = useState(true);
  const [slowMoSpeed, setSlowMoSpeed] = useState<0.25 | 0.5 | 1.0>(0.5);

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const audioWaveCanvasRef = useRef<HTMLCanvasElement>(null);

  // Three.js instances
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const trajectoryCurveRef = useRef<THREE.Line | null>(null);
  const projectedCurveRef = useRef<THREE.Line | null>(null);
  const bounceRingRef = useRef<THREE.Mesh | null>(null);
  const padImpactMarkerRef = useRef<THREE.Mesh | null>(null);
  const stumpsGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameId = useRef<number | null>(null);

  // Sync selected scenario if prop changes
  useEffect(() => {
    if (activeScenarioId) {
      const idx = scenarios.findIndex((s) => s.id === activeScenarioId);
      if (idx !== -1) setSelectedScenarioIndex(idx);
    }
  }, [activeScenarioId, scenarios]);

  const currentScenario = scenarios[selectedScenarioIndex] || scenarios[0];

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = Math.max(380, containerRef.current.clientHeight || 420);

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    scene.fog = new THREE.FogExp2(0x090d16, 0.035);
    sceneRef.current = scene;

    // Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: false,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xfff5ea, 1.4);
    dirLight.position.set(5, 12, 10);
    dirLight.castShadow = true;
    scene.add(dirLight);

    const stadiumFlood = new THREE.DirectionalLight(0x7090ff, 0.6);
    stadiumFlood.position.set(-6, 8, -5);
    scene.add(stadiumFlood);

    // Ground: Outfield Grass
    const outfieldGeo = new THREE.PlaneGeometry(30, 40);
    const outfieldMat = new THREE.MeshStandardMaterial({
      color: 0x14341e,
      roughness: 0.9,
    });
    const outfield = new THREE.Mesh(outfieldGeo, outfieldMat);
    outfield.rotation.x = -Math.PI / 2;
    outfield.position.set(0, -0.01, 10);
    scene.add(outfield);

    // Pitch Strip: 22 yards = 20.12m long, 3.05m wide
    const pitchGeo = new THREE.PlaneGeometry(3.05, 20.12);
    const pitchMat = new THREE.MeshStandardMaterial({
      color: 0xb9a685,
      roughness: 0.85,
    });
    const pitch = new THREE.Mesh(pitchGeo, pitchMat);
    pitch.rotation.x = -Math.PI / 2;
    pitch.position.set(0, 0, 10.06);
    pitch.receiveShadow = true;
    scene.add(pitch);

    // Crease Lines (Popping crease at 1.22m before stumps at z=18.9, Bowling crease at z=20.12)
    const lineMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    // Batsman Popping Crease
    const popCreaseGeo = new THREE.PlaneGeometry(2.44, 0.08);
    const popCrease = new THREE.Mesh(popCreaseGeo, lineMat);
    popCrease.rotation.x = -Math.PI / 2;
    popCrease.position.set(0, 0.005, 18.9);
    scene.add(popCrease);

    // Batsman Bowling Crease (stumps line)
    const bowlCreaseGeo = new THREE.PlaneGeometry(2.64, 0.06);
    const bowlCrease = new THREE.Mesh(bowlCreaseGeo, lineMat);
    bowlCrease.rotation.x = -Math.PI / 2;
    bowlCrease.position.set(0, 0.005, 20.12);
    scene.add(bowlCrease);

    // Return Creases
    const returnCreaseGeo = new THREE.PlaneGeometry(0.06, 1.8);
    const retLeft = new THREE.Mesh(returnCreaseGeo, lineMat);
    retLeft.rotation.x = -Math.PI / 2;
    retLeft.position.set(-1.32, 0.005, 19.5);
    scene.add(retLeft);

    const retRight = new THREE.Mesh(returnCreaseGeo, lineMat);
    retRight.rotation.x = -Math.PI / 2;
    retRight.position.set(1.32, 0.005, 19.5);
    scene.add(retRight);

    // Stumps at Batting End (z = 20.12)
    const stumpsGroup = new THREE.Group();
    stumpsGroup.position.set(0, 0, 20.12);
    const stumpMat = new THREE.MeshStandardMaterial({
      color: 0xe8c17b,
      roughness: 0.4,
    });

    const stumpPositions = [-0.114, 0, 0.114]; // Off, Middle, Leg (approx 22.8cm total width)
    stumpPositions.forEach((xPos) => {
      const stumpGeo = new THREE.CylinderGeometry(0.019, 0.019, 0.71, 16);
      const stump = new THREE.Mesh(stumpGeo, stumpMat);
      stump.position.set(xPos, 0.71 / 2, 0);
      stump.castShadow = true;
      stumpsGroup.add(stump);
    });

    // Bails
    const bailGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.11, 8);
    const bailLeft = new THREE.Mesh(bailGeo, stumpMat);
    bailLeft.rotation.z = Math.PI / 2;
    bailLeft.position.set(-0.057, 0.72, 0);
    stumpsGroup.add(bailLeft);

    const bailRight = new THREE.Mesh(bailGeo, stumpMat);
    bailRight.rotation.z = Math.PI / 2;
    bailRight.position.set(0.057, 0.72, 0);
    stumpsGroup.add(bailRight);

    scene.add(stumpsGroup);
    stumpsGroupRef.current = stumpsGroup;

    // Batsman Pad Silhouette (Translucent cylindrical marker at batsman impact)
    const padGeo = new THREE.CylinderGeometry(0.12, 0.14, 0.65, 16);
    const padMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      wireframe: false,
    });
    const padMesh = new THREE.Mesh(padGeo, padMat);
    padMesh.position.set(0, 0.35, 17.8);
    scene.add(padMesh);

    // Ball Mesh (Red leather cricket ball with high-contrast seam)
    const ballGeo = new THREE.SphereGeometry(0.055, 32, 32);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xcc1f1a,
      roughness: 0.3,
      metalness: 0.1,
    });
    const ballMesh = new THREE.Mesh(ballGeo, ballMat);
    ballMesh.castShadow = true;
    scene.add(ballMesh);
    ballMeshRef.current = ballMesh;

    // Seam Ring on Ball
    const seamGeo = new THREE.TorusGeometry(0.056, 0.004, 8, 32);
    const seamMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const seamMesh = new THREE.Mesh(seamGeo, seamMat);
    ballMesh.add(seamMesh);

    // Pitch Bounce Impact Marker (expanding glowing ring)
    const ringGeo = new THREE.RingGeometry(0.06, 0.18, 32);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x10b981,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.85,
    });
    const bounceRing = new THREE.Mesh(ringGeo, ringMat);
    bounceRing.rotation.x = -Math.PI / 2;
    bounceRing.position.set(0, 0.01, 15);
    scene.add(bounceRing);
    bounceRingRef.current = bounceRing;

    // Pad Impact Glow Marker
    const impactGeo = new THREE.SphereGeometry(0.08, 16, 16);
    const impactMat = new THREE.MeshBasicMaterial({
      color: 0xef4444,
      transparent: true,
      opacity: 0.8,
    });
    const padImpactMarker = new THREE.Mesh(impactGeo, impactMat);
    padImpactMarker.position.set(0, 0.58, 17.8);
    scene.add(padImpactMarker);
    padImpactMarkerRef.current = padImpactMarker;

    // Handle Window Resize
    const handleResize = () => {
      if (!containerRef.current || !renderer || !camera) return;
      const w = containerRef.current.clientWidth;
      const h = Math.max(380, containerRef.current.clientHeight || 420);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
      renderer.dispose();
    };
  }, []);

  // Update Trajectory Lines & Positions when Scenario Changes
  useEffect(() => {
    if (!sceneRef.current) return;
    const scene = sceneRef.current;

    // Remove previous lines if any
    if (trajectoryCurveRef.current) {
      scene.remove(trajectoryCurveRef.current);
      trajectoryCurveRef.current.geometry.dispose();
    }
    if (projectedCurveRef.current) {
      scene.remove(projectedCurveRef.current);
      projectedCurveRef.current.geometry.dispose();
    }

    const pts = currentScenario.trajectoryPoints;
    if (pts.length < 5) return;

    // 1. Pre-impact curve (Release -> Pitch Bounce -> Pad Impact)
    const pointsPre = [
      new THREE.Vector3(pts[0].x, pts[0].y, pts[0].z),
      new THREE.Vector3(pts[1].x, pts[1].y, pts[1].z),
      new THREE.Vector3(pts[2].x, pts[2].y, pts[2].z),
      new THREE.Vector3(pts[3].x, pts[3].y, pts[3].z),
    ];
    const curvePre = new THREE.CatmullRomCurve3(pointsPre);
    const curvePoints = curvePre.getPoints(50);
    const lineGeo = new THREE.BufferGeometry().setFromPoints(curvePoints);
    const lineMat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      linewidth: 3,
    });
    const trajLine = new THREE.Line(lineGeo, lineMat);
    scene.add(trajLine);
    trajectoryCurveRef.current = trajLine;

    // 2. Projected path (Pad Impact -> Stumps)
    const pointsPost = [
      new THREE.Vector3(pts[3].x, pts[3].y, pts[3].z),
      new THREE.Vector3(pts[4].x, pts[4].y, pts[4].z),
    ];
    const curvePost = new THREE.CatmullRomCurve3(pointsPost);
    const postPoints = curvePost.getPoints(25);
    const postGeo = new THREE.BufferGeometry().setFromPoints(postPoints);

    // Color based on wickets hitting
    const postColor =
      currentScenario.wickets === 'Hitting'
        ? 0xef4444 // Red hitting
        : currentScenario.wickets === "Umpire's Call"
        ? 0xf59e0b // Amber clipping
        : 0x10b981; // Green missing

    const postMat = new THREE.LineDashedMaterial({
      color: postColor,
      dashSize: 0.3,
      gapSize: 0.15,
      linewidth: 3,
    });
    const projLine = new THREE.Line(postGeo, postMat);
    projLine.computeLineDistances();
    scene.add(projLine);
    projectedCurveRef.current = projLine;

    // Update Bounce Ring Position
    if (bounceRingRef.current) {
      bounceRingRef.current.position.set(pts[2].x, 0.01, pts[2].z);
    }

    // Update Pad Impact Marker Position
    if (padImpactMarkerRef.current) {
      padImpactMarkerRef.current.position.set(pts[3].x, pts[3].y, pts[3].z);
    }
  }, [currentScenario]);

  // Camera views
  useEffect(() => {
    if (!cameraRef.current) return;
    const camera = cameraRef.current;

    switch (cameraView) {
      case 'tv':
        // Classic broadcast view from behind bowler towards batsman
        camera.position.set(0.2, 2.4, -2.5);
        camera.lookAt(0, 0.8, 19.5);
        break;
      case 'side':
        // Crease profile camera
        camera.position.set(5.5, 1.2, 18.5);
        camera.lookAt(0, 0.6, 18.5);
        break;
      case 'top':
        // Bird's eye drone tracking
        camera.position.set(0, 16.0, 13.0);
        camera.lookAt(0, 0, 13.0);
        break;
      case 'umpire':
        // Right behind stumps at batsman end looking down pitch
        camera.position.set(0, 1.6, 22.8);
        camera.lookAt(0, 1.0, 12.0);
        break;
    }
  }, [cameraView]);

  // Main Animation Loop
  useEffect(() => {
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const delta = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isPlaying) {
        setPlaybackProgress((prev) => {
          let next = prev + delta * 0.35 * slowMoSpeed;
          if (next >= 1.0) {
            next = 0.0;
          }
          return next;
        });
      }

      // Update ball position along trajectory
      const pts = currentScenario.trajectoryPoints;
      if (ballMeshRef.current && pts.length >= 5) {
        let x = 0;
        let y = 0;
        let z = 0;

        // Break progress into 2 segments: Release->Impact (0 to 0.75), Impact->Stumps (0.75 to 1.0)
        if (playbackProgress < 0.75) {
          const t = playbackProgress / 0.75;
          // Interpolate through pts[0], pts[1], pts[2], pts[3]
          if (t < 0.4) {
            const segT = t / 0.4;
            x = pts[0].x + (pts[1].x - pts[0].x) * segT;
            y = pts[0].y + (pts[1].y - pts[0].y) * segT;
            z = pts[0].z + (pts[1].z - pts[0].z) * segT;
          } else if (t < 0.8) {
            const segT = (t - 0.4) / 0.4;
            x = pts[1].x + (pts[2].x - pts[1].x) * segT;
            y = pts[1].y + (pts[2].y - pts[1].y) * segT;
            z = pts[1].z + (pts[2].z - pts[1].z) * segT;
          } else {
            const segT = (t - 0.8) / 0.2;
            x = pts[2].x + (pts[3].x - pts[2].x) * segT;
            y = pts[2].y + (pts[3].y - pts[2].y) * segT;
            z = pts[2].z + (pts[3].z - pts[2].z) * segT;
          }
        } else {
          // Projected path to stumps
          const t = (playbackProgress - 0.75) / 0.25;
          x = pts[3].x + (pts[4].x - pts[3].x) * t;
          y = pts[3].y + (pts[4].y - pts[3].y) * t;
          z = pts[3].z + (pts[4].z - pts[3].z) * t;
        }

        ballMeshRef.current.position.set(x, y, z);
        ballMeshRef.current.rotation.x += 0.2;
        ballMeshRef.current.rotation.z += 0.15;

        // Pulse the impact ring when ball is near bounce
        if (bounceRingRef.current) {
          const distToBounce = Math.abs(z - pts[2].z);
          const scale = distToBounce < 1.0 ? 1.0 + (1.0 - distToBounce) * 0.4 : 1.0;
          bounceRingRef.current.scale.set(scale, scale, scale);
        }
      }

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameId.current = requestAnimationFrame(animate);
    };

    animationFrameId.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    };
  }, [isPlaying, playbackProgress, slowMoSpeed, currentScenario]);

  // UltraEdge Audio Waveform Canvas Drawing
  useEffect(() => {
    const canvas = audioWaveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    // Draw baseline
    const centerY = height / 2;
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Generate snicko waveform
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#38bdf8';

    const spikeX = width * 0.72; // frame where bat/pad passes ball
    const hasSpike = currentScenario.ultraEdgeSpike;

    for (let x = 0; x < width; x += 2) {
      let amp = (Math.random() - 0.5) * 4; // ambient mic noise
      const distFromSpike = Math.abs(x - spikeX);

      if (hasSpike && distFromSpike < 28) {
        const spikeFactor = Math.cos((distFromSpike / 28) * (Math.PI / 2));
        amp += (Math.random() - 0.5) * 48 * spikeFactor;
      }

      const y = centerY + amp;
      if (x === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Draw current playhead indicator
    const currentX = width * playbackProgress;
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(currentX, 0);
    ctx.lineTo(currentX, height);
    ctx.stroke();

    // Label on spike
    if (hasSpike) {
      ctx.fillStyle = '#f43f5e';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText('BAT NOISE DETECTED (2.4 kHz)', spikeX - 70, 14);
    } else {
      ctx.fillStyle = '#64748b';
      ctx.font = '10px JetBrains Mono, monospace';
      ctx.fillText('NO BAT SOUND — PAD ONLY', spikeX - 60, 14);
    }
  }, [playbackProgress, currentScenario]);

  // Fire celebratory sound/particles if overturned
  const triggerVerdictNotice = () => {
    if (currentScenario.finalDecision === 'OUT') {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#ef4444', '#f59e0b', '#ffffff'],
      });
    }
  };

  return (
    <div className="flex flex-col w-full bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
      {/* Top Header & Scenario Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-950/80 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
            DRS Hawk-Eye 3D Visualizer
          </span>
          <span className="text-xs text-slate-500">·</span>
          <span className="text-xs text-slate-400 font-mono">Ball-Tracking Engine v4.2</span>
        </div>

        {/* Preset Scenarios Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {scenarios.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => {
                setSelectedScenarioIndex(idx);
                setPlaybackProgress(0.2);
              }}
              className={`px-2.5 py-1 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
                selectedScenarioIndex === idx
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              {sc.title.split(':')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* 3D Viewport Area */}
      <div className="relative w-full h-[400px] sm:h-[450px] bg-slate-950" ref={containerRef}>
        <canvas ref={canvasRef} className="w-full h-full block cursor-grab active:cursor-grabbing" />

        {/* Camera Angle Selector Toolbar */}
        <div className="absolute top-3 left-3 flex items-center gap-1 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-800 shadow-lg">
          <button
            onClick={() => setCameraView('tv')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors flex items-center gap-1 ${
              cameraView === 'tv' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Camera className="w-3 h-3" /> Broadcast
          </button>
          <button
            onClick={() => setCameraView('side')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
              cameraView === 'side' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Side Crease
          </button>
          <button
            onClick={() => setCameraView('top')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
              cameraView === 'top' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Top Drone
          </button>
          <button
            onClick={() => setCameraView('umpire')}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
              cameraView === 'umpire' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Umpire View
          </button>
        </div>

        {/* Speed & Pitch Specs HUD */}
        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5 bg-slate-950/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-right">
          <div className="text-[10px] uppercase font-mono text-slate-400">Delivery Velocity</div>
          <div className="text-lg font-bold font-mono tabular-nums text-emerald-400">
            143.8 <span className="text-xs text-slate-400">km/h</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono">
            Bounce: <span className="text-slate-200">15.0m</span> · Pad:{' '}
            <span className="text-slate-200">{currentScenario.impactDistanceM}m</span>
          </div>
        </div>

        {/* Official TV DRS Decision Graphics Card Overlay */}
        <div className="absolute bottom-4 left-3 right-3 sm:right-auto sm:w-[320px] bg-slate-950/90 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800 shadow-2xl">
          <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-800/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              DRS Review: {currentScenario.bowlerName} to {currentScenario.batsmanName}
            </span>
            <span className="text-[10px] font-mono text-slate-400">
              On-field: <strong className="text-slate-200">{currentScenario.originalDecision}</strong>
            </span>
          </div>

          {/* 3 DRS Criteria: Pitching, Impact, Wickets */}
          <div className="space-y-1.5 text-xs font-mono">
            {/* 1. Pitching */}
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">1. PITCHING</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold ${
                    currentScenario.pitching === 'In-line'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {currentScenario.pitching.toUpperCase()}
                </span>
                {currentScenario.pitching === 'In-line' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
            </div>

            {/* 2. Impact */}
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">2. IMPACT</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold ${
                    currentScenario.impact === 'In-line'
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {currentScenario.impact.toUpperCase()}
                </span>
                {currentScenario.impact === 'In-line' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-amber-400" />
                )}
              </div>
            </div>

            {/* 3. Wickets */}
            <div className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/80 border border-slate-800">
              <span className="text-slate-400">3. WICKETS</span>
              <div className="flex items-center gap-1.5">
                <span
                  className={`font-bold ${
                    currentScenario.wickets === 'Hitting'
                      ? 'text-red-400'
                      : currentScenario.wickets === "Umpire's Call"
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {currentScenario.wickets.toUpperCase()}
                </span>
                {currentScenario.wickets === 'Hitting' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
                ) : currentScenario.wickets === "Umpire's Call" ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <XCircle className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </div>
            </div>
          </div>

          {/* Verdict Banner */}
          <div
            onClick={triggerVerdictNotice}
            className={`mt-2.5 py-1.5 px-3 rounded-xl text-center font-bold text-sm tracking-widest uppercase shadow-md transition-all cursor-pointer ${
              currentScenario.finalDecision === 'OUT'
                ? 'bg-red-600 text-white hover:bg-red-500'
                : 'bg-emerald-600 text-white hover:bg-emerald-500'
            }`}
          >
            DECISION: {currentScenario.finalDecision}
            {currentScenario.originalDecision.toUpperCase() !== currentScenario.finalDecision && (
              <span className="block text-[10px] font-normal tracking-normal opacity-90">
                (On-Field Decision Overturned)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Scrubbing & Playback Bar */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 space-y-3">
        {/* Progress Slider */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.005"
            value={playbackProgress}
            onChange={(e) => {
              setIsPlaying(false);
              setPlaybackProgress(parseFloat(e.target.value));
            }}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />

          <span className="text-xs font-mono text-slate-400 w-12 text-right">
            {(playbackProgress * 100).toFixed(0)}%
          </span>

          <button
            onClick={() => {
              setPlaybackProgress(0);
              setIsPlaying(true);
            }}
            className="p-1.5 text-slate-400 hover:text-white transition-colors"
            title="Reset trajectory"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Speed toggles & UltraEdge Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Replay Speed:</span>
            {([0.25, 0.5, 1.0] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => setSlowMoSpeed(spd)}
                className={`px-2 py-0.5 text-xs font-mono rounded transition-colors ${
                  slowMoSpeed === spd
                    ? 'bg-slate-700 text-white font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowUltraEdge(!showUltraEdge)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                showUltraEdge
                  ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              {showUltraEdge ? 'Hide Snicko' : 'UltraEdge Snicko'}
            </button>
          </div>
        </div>

        {/* UltraEdge Waveform Display (If enabled) */}
        {showUltraEdge && (
          <div className="p-2.5 bg-slate-900/90 rounded-xl border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
              <span>SYNCHRONIZED ULTRAEDGE AUDIO FREQUENCY</span>
              <span className="text-sky-400">48,000 Hz Hi-Fi Stumps Mic</span>
            </div>
            <canvas
              ref={audioWaveCanvasRef}
              width={600}
              height={50}
              className="w-full h-12 bg-slate-950 rounded-lg block border border-slate-800/80"
            />
          </div>
        )}
      </div>
    </div>
  );
};
