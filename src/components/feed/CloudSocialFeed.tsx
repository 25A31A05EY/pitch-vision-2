import React, { useState } from 'react';
import { FeedPost, Delivery, UserProfile } from '../../types/cricket';
import {
  Cloud,
  CheckCircle2,
  RefreshCw,
  Heart,
  MessageSquare,
  Share2,
  Play,
  Pause,
  Sliders,
  Send,
  Zap,
  Shield,
  User,
  Activity,
} from 'lucide-react';

interface CloudSocialFeedProps {
  posts: FeedPost[];
  currentUser: UserProfile;
  onPostComment: (postId: string, text: string) => void;
  onLikePost: (postId: string) => void;
  onReviewDRS: (ballId: string) => void;
}

export const CloudSocialFeed: React.FC<CloudSocialFeedProps> = ({
  posts,
  currentUser,
  onPostComment,
  onLikePost,
  onReviewDRS,
}) => {
  const [feedFilter, setFeedFilter] = useState<'team' | 'global'>('team');
  const [activeVideoPostId, setActiveVideoPostId] = useState<string | null>(posts[0]?.id || null);
  const [isPlaying, setIsPlaying] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [slowMoSpeed, setSlowMoSpeed] = useState<Record<string, number>>({});
  const [showTrajectoryOverlay, setShowTrajectoryOverlay] = useState<Record<string, boolean>>({});

  // Background Cloud Sync Simulation State
  const [cloudSyncQueue, setCloudSyncQueue] = useState<
    Array<{ id: string; name: string; sizeMb: number; progress: number; status: 'uploading' | 'completed' }>
  >([
    { id: 'chunk_01', name: 'Delivery_1.2_120fps_raw.mp4', sizeMb: 24.8, progress: 100, status: 'completed' },
    { id: 'chunk_02', name: 'Delivery_1.4_120fps_raw.mp4', sizeMb: 22.4, progress: 85, status: 'uploading' },
    { id: 'chunk_03', name: 'Session_Telemetry_Metadata.json', sizeMb: 1.2, progress: 100, status: 'completed' },
  ]);

  const handleTogglePlay = (postId: string) => {
    setIsPlaying((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  const handleCommentSubmit = (postId: string) => {
    const text = commentInputs[postId]?.trim();
    if (!text) return;
    onPostComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  return (
    <div className="flex flex-col w-full space-y-6">
      {/* Cloud S3/GCS Upload Background Status Banner */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-4 shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-sky-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Cloud Storage & Background Sync
            </span>
            <span className="text-xs text-slate-500">·</span>
            <span className="text-xs text-slate-400 font-mono">AWS S3 / GCS Bucket Engine</span>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Auto-Sync Background Worker Active</span>
          </div>
        </div>

        {/* Sync queue items */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs font-mono">
          {cloudSyncQueue.map((item) => (
            <div
              key={item.id}
              className="p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-1.5"
            >
              <div className="flex items-center justify-between">
                <span className="text-slate-300 truncate max-w-[150px]">{item.name}</span>
                <span className="text-slate-500 text-[10px]">{item.sizeMb} MB</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    item.status === 'completed' ? 'bg-emerald-500' : 'bg-sky-500 animate-pulse'
                  }`}
                  style={{ width: `${item.progress}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span>{item.status === 'completed' ? 'Uploaded to S3' : 'Chunk uploading...'}</span>
                <span>{item.progress}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Feed Filter Switcher */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 p-1 bg-slate-900 rounded-xl border border-slate-800">
          <button
            onClick={() => setFeedFilter('team')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              feedFilter === 'team'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Victoria Thunder Feed
          </button>
          <button
            onClick={() => setFeedFilter('global')}
            className={`px-3.5 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              feedFilter === 'global'
                ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Global Pro Community
          </button>
        </div>

        <span className="text-xs font-mono text-slate-400">
          {posts.length} Highlight Deliveries
        </span>
      </div>

      {/* Posts List */}
      <div className="space-y-6">
        {posts.map((post) => {
          const playing = isPlaying[post.id] ?? false;
          const speed = slowMoSpeed[post.id] ?? 1.0;
          const showTraj = showTrajectoryOverlay[post.id] ?? true;

          return (
            <div
              key={post.id}
              className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
            >
              {/* Post Header */}
              <div className="p-4 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0">
                    {post.authorAvatar ? (
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-slate-300">
                        {post.authorName.slice(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{post.authorName}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium capitalize border border-slate-700">
                        {post.authorRole}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>{post.teamName}</span>
                      <span>·</span>
                      <span>{post.timeAgo}</span>
                    </div>
                  </div>
                </div>

                {/* DRS Simulation Quick Button if ball has wicket/review */}
                {post.delivery.outcome.includes('Wicket') && (
                  <button
                    onClick={() => onReviewDRS(post.delivery.id)}
                    className="px-3 py-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/30 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    Review in DRS
                  </button>
                )}
              </div>

              {/* Title & Description */}
              <div className="px-4 pt-3 pb-2 space-y-1">
                <h4 className="text-sm font-bold text-slate-100">{post.title}</h4>
                <p className="text-xs text-slate-300 leading-relaxed">{post.description}</p>
              </div>

              {/* High-FPS Video Preview & Computer Vision Tracking Overlay */}
              <div className="relative w-full h-[320px] sm:h-[380px] bg-slate-950 overflow-hidden flex items-center justify-center">
                <img
                  src="/src/assets/images/cricket_pitch_action_1791968241773.jpg"
                  alt="Delivery Clip"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover opacity-80"
                />

                {/* Computer Vision Trajectory HUD Overlay */}
                {showTraj && (
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    {/* Trajectory Curve */}
                    <path
                      d="M 380,80 Q 370,180 340,260 T 310,340"
                      fill="none"
                      stroke="#38bdf8"
                      strokeWidth="3.5"
                      strokeDasharray={playing ? 'none' : '4 4'}
                    />
                    {/* Pitch Bounce Marker */}
                    <circle cx="340" cy="260" r="7" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="355" y="265" fill="#fca5a5" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
                      PITCH ({post.delivery.pitchY}m)
                    </text>
                  </svg>
                )}

                {/* Radar HUD Card (Top Right) */}
                <div className="absolute top-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-800 text-right">
                  <div className="text-[10px] uppercase font-mono text-slate-400">Tracked Speed</div>
                  <div className="text-lg font-bold font-mono text-emerald-400 tabular-nums">
                    {post.delivery.speedKmh} <span className="text-xs text-slate-400">km/h</span>
                  </div>
                  <div className="text-[11px] font-mono text-sky-400">
                    {post.delivery.swingMm > 0 ? `+${post.delivery.swingMm}mm Outswing` : `${post.delivery.swingMm}mm Inswing`}
                  </div>
                </div>

                {/* Play / Pause Big Center Button */}
                <button
                  onClick={() => handleTogglePlay(post.id)}
                  className="absolute z-10 w-14 h-14 rounded-full bg-slate-950/80 hover:bg-slate-900 border border-slate-700 flex items-center justify-center text-white backdrop-blur-md shadow-2xl transition-transform active:scale-95"
                  aria-label={playing ? 'Pause' : 'Play'}
                >
                  {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
                </button>

                {/* Bottom Scrub Controls in Video */}
                <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        setSlowMoSpeed((prev) => ({
                          ...prev,
                          [post.id]: prev[post.id] === 0.25 ? 1.0 : 0.25,
                        }))
                      }
                      className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                    >
                      {speed === 0.25 ? '0.25x Slow-Mo' : '1x Normal'}
                    </button>
                    <button
                      onClick={() =>
                        setShowTrajectoryOverlay((prev) => ({
                          ...prev,
                          [post.id]: !(prev[post.id] ?? true),
                        }))
                      }
                      className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                    >
                      {showTraj ? 'Hide Trajectory' : 'Show Trajectory'}
                    </button>
                  </div>
                  <span className="text-slate-400 text-[11px]">120 FPS High-Res Clip</span>
                </div>
              </div>

              {/* Delivery Meta Grid */}
              <div className="px-4 py-2.5 bg-slate-950/60 border-t border-slate-800/80 grid grid-cols-4 gap-2 text-center text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Length</span>
                  <strong className="text-slate-300 capitalize">{post.delivery.length.replace('_', ' ')}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Line</span>
                  <strong className="text-slate-300 capitalize">{post.delivery.line.replace('_', ' ')}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Spin RPM</span>
                  <strong className="text-slate-300">{post.delivery.spinRpm}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 uppercase block">Result</span>
                  <strong className="text-amber-400">{post.delivery.outcome}</strong>
                </div>
              </div>

              {/* Likes & Comments Count Bar */}
              <div className="px-4 py-2.5 flex items-center justify-between border-t border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => onLikePost(post.id)}
                    className={`flex items-center gap-1.5 transition-colors ${
                      post.hasLiked ? 'text-rose-500 font-bold' : 'hover:text-white'
                    }`}
                  >
                    <Heart className={`w-4 h-4 ${post.hasLiked ? 'fill-rose-500' : ''}`} />
                    <span>{post.likesCount}</span>
                  </button>
                  <div className="flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4" />
                    <span>{post.comments.length} Comments</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(window.location.href);
                    alert('Clip share link copied to clipboard!');
                  }}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>

              {/* Comments Section */}
              <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3">
                {/* List of comments */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {post.comments.map((comment) => (
                    <div key={comment.id} className="flex items-start gap-2.5 text-xs">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {comment.avatar ? (
                          <img
                            src={comment.avatar}
                            alt={comment.author}
                            referrerPolicy="no-referrer"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="flex-1 bg-slate-900 p-2 rounded-xl border border-slate-800/80">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="font-bold text-slate-200">
                            {comment.author}{' '}
                            <span className="text-[10px] font-normal text-emerald-400 capitalize">
                              ({comment.role})
                            </span>
                          </span>
                          <span className="text-[10px] text-slate-500">{comment.timestamp}</span>
                        </div>
                        <p className="text-slate-300 leading-relaxed">{comment.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Comment Input */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e) =>
                      setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCommentSubmit(post.id);
                    }}
                    placeholder={`Comment as ${currentUser.name} (${currentUser.role})...`}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    onClick={() => handleCommentSubmit(post.id)}
                    className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl font-bold transition-colors shrink-0"
                    aria-label="Send comment"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
