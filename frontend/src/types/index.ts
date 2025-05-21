// Types.ts - All interface definitions for the application

// User-related interfaces
export interface UserProfile {
    id: number;
    username: string;
    password?: string;
    display_name: string;
    email?: string;
    bio?: string;
    avatar_url?: string;
    cover_photo_url?: string;
    join_date?: string;
    has_two_factor_auth?: boolean;
    stats?: UserStats;
    match_history?: MatchRecord[];
    achievements?: Achievement[];
    friends?: number[];
    friend_requests?: FriendRequest[];
    game_settings?: GameSettings;
    notifications?: AppNotification[];
    status: 'online' | 'offline' | 'in-game';
    last_active: string;
}

// maybe need more
export interface LoginResponse {
    token: string;
    user: UserProfile;
}


export interface UserStats {
    played: number;
    wins: number;
    losses: number;
    winrate: number;
    rank: 'Bronze' | 'Silver' | 'Gold' | 'Diamond';
    level: number;
}

// Game-related interfaces
export interface GameSettings {
    board_color: string;
    paddle_color: string;
    ball_color: string;
    score_color: string;
    powerup: boolean;
}

export interface MatchRecord {
    id?: number;
    user_id: number;
    opponent_id?: number;
    opponent_name?: string;
    result: 'win' | 'loss' | 'draw';
    score: string;
    date: string;
    duration?: string;
    game_mode?: string;
    status: 'pending' | 'running' | 'finished';
    tournament_id?: number | null;
}

export interface GameInvite {
    id: number;
    from: number;
    to: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    timestamp: string;
    gameMode?: string;
}

export interface Achievement {
    id: number;
    name: string;
    description: string;
    icon: string;
    completed: boolean;
    dateCompleted?: string;
    translations?: {
        [lang: string]: {
          description: string;
        }
    };
}

export interface Friend {
    user_id: number;
    friend_id: number;
    friend_username: string;
    friend_display_name: string;
    friend_avatar_url: string;
    friend_status: string;
    friend_last_active: string;
}

export interface FriendRequest {
    id: number;
    from_user_id: number;
    to_user_id: number;
    status: 'pending' | 'accepted' | 'rejected';
    date: string;

    from_username: string;
    from_display_name: string;
    from_avatar_url: string;
    to_username: string;
    to_display_name: string;
    to_avatar_url: string;
}

export interface ChatMessage {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    timestamp: string;
    read: boolean;
}

export interface ChatMessageDetail {
    id: number;
    sender_id: number;
    receiver_id: number;
    content: string;
    timestamp: string;
    read: boolean;

    sender_username: string;
    sender_display_name: string;
    sender_avatar_url: string;
    receiver_username: string;
    receiver_display_name: string;
    receiver_avatar_url: string;
}

export interface AppNotification {
    id: number;
    userId: number;
    type: 'friendRequest' | 'gameInvite' | 'achievement' | 'system';
    message: string;
    read: boolean;
    timestamp: Date;
    actionUrl?: string;
    relatedUserId?: number;
}

export interface NotificationOptions {
    title?: string;
    message: string;
    duration?: number; // in milliseconds
    type?: 'info' | 'success' | 'warning' | 'error';
}

export interface TournamentMatch {

	id: number;
	round: number;
	player1_name?: string | null;
	player2_name?: string | null;
	score?: string | null;
	winner_name?: string | null;
	status: 'pending' | 'running' | 'finished';
};

export interface Tournament {
	id: number;
	tournament_name: string;
	creator_id: number;
	player_amount: number;
	status: 'pending' | 'running' | 'finished';
	winner_name?: string | null;
	players: string[];
	matches: TournamentMatch[];
}
