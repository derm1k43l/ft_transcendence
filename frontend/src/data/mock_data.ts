// data/mock_data.ts
import { 
    UserProfile, 
    ChatMessage, 
    GameInvite, 
    AppNotification,
    Achievement,
    GameSettings
} from './Types.js';

// Default game settings
export const DEFAULT_GAME_SETTINGS: GameSettings = {
    boardColor: '#000000',
    paddleColor: '#FFFFFF',
    ballColor: '#FFFFFF',
    scoreColor: '#FFFFFF'
};

// Mock achievements data for both users
const commonAchievements: Achievement[] = [
    {
        id: 1,
        name: "First Victory",
        description: "Win your first game",
        icon: "fas fa-trophy",
        completed: true,
        dateCompleted: "2025-03-15"
    },
    {
        id: 2,
        name: "On Fire",
        description: "Win 5 games in a row",
        icon: "fas fa-fire",
        completed: false
    },
    {
        id: 3,
        name: "Social Butterfly",
        description: "Add 5 friends",
        icon: "fas fa-users",
        completed: false
    },
    {
        id: 4,
        name: "Tournament Finalist",
        description: "Reach the finals in a tournament",
        icon: "fas fa-award",
        completed: false
    }
];

// Mock user database
export const mockUsers: UserProfile[] = [
    {
        id: 1,
        username: "test",
        password: "test", 
        displayName: "Test User",
        avatarUrl: "https://placehold.co/150x150/1d1f21/ffffff?text=Test+User",
        coverPhotoUrl: "https://placehold.co/1200x300/7c00e3/ffffff?text=Test+Profile",
        bio: "I love playing pong and making new friends here!",
        email: "test@example.com",
        joinDate: "2025-01-10",
        stats: { 
            wins: 15, 
            losses: 8,
            rank: "#42",
            level: 5
        },
        friends: [2, 3],
        friendRequests: [
            {
                id: 1,
                from: 4,
                to: 1,
                status: 'pending',
                date: '2025-04-10'
            }
        ],
        matchHistory: [
            {
                id: 1,
                opponentId: 2,
                opponent: "Admin",
                result: "win",
                score: "11-8",
                date: "2025-04-15"
            },
            {
                id: 2,
                opponentId: 3,
                opponent: "Player3",
                result: "loss",
                score: "7-11",
                date: "2025-04-12"
            },
            {
                id: 3,
                opponentId: 2,
                opponent: "Admin",
                result: "win",
                score: "11-9",
                date: "2025-04-10"
            },
            {
                id: 4,
                opponentId: 4,
                opponent: "Player4",
                result: "win",
                score: "11-5",
                date: "2025-04-05"
            }
        ],
        achievements: commonAchievements,
        // Add game settings for this user
        gameSettings: {
            ...DEFAULT_GAME_SETTINGS
        },
        status: 'online',
        lastActive: new Date()
    },
    {
        id: 2,
        username: "admin",
        password: "admin",
        displayName: "Admin",
        avatarUrl: "https://placehold.co/150x150/005f73/ffffff?text=Admin",
        coverPhotoUrl: "https://placehold.co/1200x300/005f73/ffffff?text=Admin+Profile", 
        bio: "System administrator and avid Pong player since the 70s.",
        email: "admin@example.com",
        joinDate: "2025-01-01",
        stats: { 
            wins: 42, 
            losses: 12,
            rank: "#1",
            level: 15
        },
        friends: [1, 3, 4],
        matchHistory: [
            {
                id: 1,
                opponentId: 1,
                opponent: "Test User",
                result: "loss",
                score: "8-11",
                date: "2025-04-15"
            },
            {
                id: 2,
                opponentId: 3,
                opponent: "Player3",
                result: "win",
                score: "11-4",
                date: "2025-04-14"
            },
            {
                id: 3,
                opponentId: 1,
                opponent: "Test User",
                result: "loss",
                score: "9-11",
                date: "2025-04-10"
            },
            {
                id: 4,
                opponentId: 4,
                opponent: "Player4",
                result: "win",
                score: "11-2",
                date: "2025-04-08"
            }
        ],
        achievements: [
            ...commonAchievements.map(a => ({...a})),
            {
                id: 5,
                name: "Legend",
                description: "Win 50 games",
                icon: "fas fa-crown",
                completed: false
            }
        ],
        // Custom game settings for this user
        gameSettings: {
            ...DEFAULT_GAME_SETTINGS,
            boardColor: '#0a0a0a',
            ballColor: '#ff5555'
        },
        status: 'online',
        lastActive: new Date()
    }
];

// Mock chat messages - now exported
export const mockMessages: ChatMessage[] = [
    {
        id: 1,
        senderId: 1, // test user
        receiverId: 2, // admin
        content: "Hey Admin, how's it going?",
        timestamp: new Date(2025, 3, 15, 10, 30),
        read: true
    },
    {
        id: 2,
        senderId: 2, // admin
        receiverId: 1, // test user
        content: "Hi there! I'm good, just finished improving mock data",
        timestamp: new Date(2025, 3, 15, 10, 32),
        read: true
    },
    {
        id: 3,
        senderId: 1, // test user
        receiverId: 2, // admin
        content: "That's great! I noticed u da best!",
        timestamp: new Date(2025, 3, 15, 10, 34),
        read: true
    }
];

// Mock game invites
export const mockGameInvites: GameInvite[] = [
    {
        id: 1,
        from: 2, // admin
        to: 1, // test user
        status: 'pending',
        timestamp: new Date(2025, 3, 16, 14, 30),
        gameMode: 'classic'
    }
];

// Mock notifications
export const mockNotifications: AppNotification[] = [
    {
        id: 1,
        userId: 1, // test user
        type: 'friendRequest',
        message: 'PlayerBigBOSS sent you a friend request',
        read: false,
        timestamp: new Date(2025, 3, 16, 8, 30),
        relatedUserId: 4
    },
    {
        id: 2,
        userId: 1, // test user
        type: 'gameInvite',
        message: 'Admin invited you to play a game',
        read: false,
        timestamp: new Date(2025, 3, 16, 14, 30),
        relatedUserId: 2
    },
];

console.log("Mock data initialized and ready to use");