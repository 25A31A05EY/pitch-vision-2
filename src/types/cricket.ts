export type UserRole = 'player' | 'coach' | 'admin' | 'spectator';

export type BowlingStyle =
  | 'Right-arm Fast'
  | 'Right-arm Fast-Medium'
  | 'Left-arm Fast'
  | 'Right-arm Off-spin'
  | 'Right-arm Leg-spin'
  | 'Left-arm Orthodox';

export type BattingStyle = 'Right-hand bat' | 'Left-hand bat';

export interface UserProfile {
  id: string;
  name: string;
  phone: string;
  role: UserRole;
  teamId: string;
  teamName: string;
  avatarUrl?: string;
  bowlingStyle?: BowlingStyle;
  battingStyle?: BattingStyle;
  jerseyNumber?: number;
  bio?: string;
}

export type PitchLength = 'yorker' | 'full' | 'good_length' | 'back_of_length' | 'short';
export type PitchLine = 'outside_off' | 'off_stump' | 'middle_stump' | 'leg_stump' | 'down_leg';
export type DeliveryOutcome =
  | 'Dot'
  | '1 Run'
  | '2 Runs'
  | '4 Runs'
  | '6 Runs'
  | 'Wicket (Bowled)'
  | 'Wicket (LBW)'
  | 'Wicket (Caught)'
  | 'Play & Miss';

export interface Delivery {
  id: string;
  ballNumber: number;
  overNumber: string; // e.g. "1.1", "1.2"
  bowlerName: string;
  batsmanName: string;
  speedKmh: number;
  speedMph: number;
  releaseHeightM: number;
  releaseDistanceM: number;
  swingMm: number; // positive = outswing, negative = inswing
  spinRpm: number;
  seamAngleDeg: number;
  length: PitchLength;
  line: PitchLine;
  pitchX: number; // meters from pitch center line (-1.5m to 1.5m)
  pitchY: number; // meters from bowling crease (10m to 20m)
  arrivalX: number; // arrival position across stumps (-0.5m to 0.5m)
  arrivalHeightM: number; // height above ground at stumps (0.1m to 1.8m)
  outcome: DeliveryOutcome;
  shotZone: string; // "Covers", "Point", "Midwicket", "Long-on", "Fine Leg", "Third Man", "Straight"
  shotAngleDeg: number; // 0 to 360 degrees
  shotDistanceM: number;
  videoClipUrl: string;
  isHighlighted: boolean;
  notes?: string;
  timestamp: string;
}

export interface CricketSession {
  id: string;
  title: string;
  type: 'Net Session' | 'Match Play' | 'Bowling Drill' | 'Batting Assessment';
  date: string;
  location: string;
  bowler: string;
  totalDeliveries: number;
  avgSpeedKmh: number;
  maxSpeedKmh: number;
  dotBallPct: number;
  cloudSyncStatus: 'synced' | 'uploading' | 'queued';
  deliveries: Delivery[];
}

export interface DRSScenario {
  id: string;
  ballId: string;
  title: string;
  bowlerName: string;
  batsmanName: string;
  originalDecision: 'Out' | 'Not Out';
  reviewBy: 'Batting Team' | 'Bowling Team';
  pitching: 'In-line' | 'Outside Leg' | 'Outside Off';
  impact: 'In-line' | 'Outside Off';
  wickets: 'Hitting' | 'Umpire\'s Call' | 'Missing';
  impactDistanceM: number; // distance from stumps in meters
  stumpHitTarget: 'Middle Stump' | 'Off Stump (Top)' | 'Leg Stump' | 'Over Stumps' | 'Miss Off';
  ultraEdgeSpike: boolean;
  spikeFrame: number;
  finalDecision: 'OUT' | 'NOT OUT';
  trajectoryPoints: Array<{ x: number; y: number; z: number }>;
}

export interface TeamJoinRequest {
  id: string;
  userName: string;
  phone: string;
  role: UserRole;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface Team {
  id: string;
  name: string;
  club: string;
  joinCode: string;
  membersCount: number;
  city: string;
  joinRequests: TeamJoinRequest[];
}

export interface FeedComment {
  id: string;
  author: string;
  role: UserRole;
  text: string;
  timestamp: string;
  avatar?: string;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatar?: string;
  teamName: string;
  timeAgo: string;
  title: string;
  description: string;
  delivery: Delivery;
  likesCount: number;
  hasLiked?: boolean;
  comments: FeedComment[];
}
