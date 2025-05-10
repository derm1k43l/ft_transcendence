// Types.ts - All interface definitions for the application

// User-related interfaces
export interface UserProfile {
    id: number;
    username: string;
    password?: string;
    displayName: string;
    email?: string;
    bio?: string;
    avatarUrl?: string;
    coverPhotoUrl?: string;
    joinDate?: string;
    hasTwoFactorAuth?: boolean;
    stats?: UserStats;
    matchHistory?: MatchRecord[];
    achievements?: Achievement[];
    friends?: number[];
    friendRequests?: FriendRequest[];
    gameSettings?: GameSettings;
    notifications?: AppNotification[];
    status?: 'online' | 'offline' | 'in-game';
    lastActive?: Date;
}

// maybe need more
export interface LoginResponse {
    token: string;
    user: UserProfile;
}


export interface UserStats {
    wins: number;
    losses: number;
    rank?: string;
    level?: number;
}

// Game-related interfaces
export interface GameSettings {
    boardColor: string;
    paddleColor: string;
    ballColor: string;
    scoreColor: string;
}

export interface MatchRecord {
    id?: number;
    opponentId: number;
    opponent: string;
    result: 'win' | 'loss' | 'draw';
    score: string;
    date: string;
    duration?: string;
    gameMode?: string;
}

export interface GameInvite {
    id: number;
    from: number;
    to: number;
    status: 'pending' | 'accepted' | 'rejected' | 'expired';
    timestamp: Date;
    gameMode?: string;
}

export interface Achievement {
    id: number;
    name: string;
    description: string;
    icon: string;
    completed: boolean;
    dateCompleted?: string;
}

export interface FriendRequest {
    id: number;
    from: number;
    to: number;
    status: 'pending' | 'accepted' | 'rejected';
    date: string;
}

export interface ChatMessage {
    id: number;
    senderId: number;
    receiverId: number;
    content: string;
    timestamp: Date;
    read: boolean;
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