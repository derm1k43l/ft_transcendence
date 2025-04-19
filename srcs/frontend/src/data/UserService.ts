import { 
    UserProfile,
    mockUsers,
    mockMessages,
    ChatMessage,
    mockNotifications,
    FriendRequest,
    Notification,
    GameInvite,
    mockGameInvites,
} from './mock_data.js';

// User lookup functions
export function findUserByUsername(username: string): UserProfile | undefined {
    if (!username) return undefined;
    return mockUsers.find(user => 
        user.username.toLowerCase() === username.toLowerCase()
    );
}

export function findUserByEmail(email: string): UserProfile | undefined {
    if (!email) return undefined;
    return mockUsers.find(user => 
        user.email?.toLowerCase() === email.toLowerCase()
    );
}

export function getUserById(id: number): UserProfile | undefined {
    return mockUsers.find(user => user.id === id);
}

export function createUser(userData: Partial<UserProfile>): UserProfile {
    const newUser: UserProfile = {
        id: mockUsers.length + 1,
        username: userData.username || '',
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName || userData.username || '',
        avatarUrl: userData.avatarUrl || `https://placehold.co/150x150/7c00e3/ffffff?text=${(userData.displayName || userData.username || '?').charAt(0).toUpperCase()}`,
        joinDate: new Date().toISOString().split('T')[0],
        stats: { wins: 0, losses: 0 },
        status: 'online',
        lastActive: new Date()
    };
    
    mockUsers.push(newUser);
    return newUser;
}

// Chat-related functions
export function sendMessage(fromUserId: number, toUserId: number, content: string): ChatMessage | null {
    const fromUser = getUserById(fromUserId);
    const toUser = getUserById(toUserId);
    
    if (!fromUser || !toUser || !content.trim()) {
        return null;
    }
    
    const newMessage: ChatMessage = {
        id: mockMessages.length + 1,
        senderId: fromUserId,
        receiverId: toUserId,
        content: content.trim(),
        timestamp: new Date(),
        read: false
    };
    
    mockMessages.push(newMessage);
    return newMessage;
}

export function getUnreadMessageCount(userId: number): number {
    return mockMessages.filter(msg => 
        msg.receiverId === userId && !msg.read
    ).length;
}

export function markMessagesAsRead(fromUserId: number, toUserId: number): void {
    mockMessages.forEach(msg => {
        if (msg.senderId === fromUserId && msg.receiverId === toUserId) {
            msg.read = true;
        }
    });
}

// Function to get conversations for a user
export function getUserConversations(userId: number): any[] {
    const user = getUserById(userId);
    if (!user) return [];
    
    // Get all users who have exchanged messages with current user
    const chatUserIds = [...new Set([
        ...mockMessages
            .filter(msg => msg.senderId === userId || msg.receiverId === userId)
            .map(msg => msg.senderId === userId ? msg.receiverId : msg.senderId)
    ])];
    
    return chatUserIds.map(contactId => {
        const contact = getUserById(contactId);
        if (!contact) return null;
        
        // Get the last message
        const messages = mockMessages.filter(msg => 
            (msg.senderId === userId && msg.receiverId === contactId) || 
            (msg.senderId === contactId && msg.receiverId === userId)
        ).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        
        const lastMessage = messages.length > 0 ? messages[0] : null;
        
        // Get unread count
        const unreadCount = messages.filter(msg => 
            msg.senderId === contactId && 
            msg.receiverId === userId && 
            !msg.read
        ).length;
        
        return {
            user: contact,
            lastMessage,
            unreadCount
        };
    }).filter(Boolean);
}

// Notification Manager
export const NotificationManager = {
    show: (options: {
        title?: string;
        message: string;
        duration?: number;
        type?: 'info' | 'success' | 'warning' | 'error';
    }) => {
        console.log("Mock notification:", options);
    },
    initialize: () => {
        console.log("Mock NotificationManager initialized");
    }
};

// Friend-related functions
export function sendFriendRequest(fromUserId: number, toUserId: number): boolean {
    const toUser = getUserById(toUserId);
    if (!toUser) return false;
    
    if (!toUser.friendRequests) {
        toUser.friendRequests = [];
    }
    
    const existingRequest = toUser.friendRequests.find(
        req => req.from === fromUserId && req.status === 'pending'
    );
    
    if (existingRequest) return false;
    
    // Add new request
    const newRequest: FriendRequest = {
        id: Math.max(0, ...toUser.friendRequests.map(r => r.id)) + 1,
        from: fromUserId,
        to: toUserId,
        status: 'pending',
        date: new Date().toISOString().split('T')[0]
    };
    
    toUser.friendRequests.push(newRequest);
    
    // Create notification for recipient
    const fromUser = getUserById(fromUserId);
    if (fromUser) {
        const newNotification: Notification = {
            id: mockNotifications.length + 1,
            userId: toUserId,
            type: 'friendRequest',
            message: `${fromUser.displayName} sent you a friend request`,
            read: false,
            timestamp: new Date(),
            relatedUserId: fromUserId
        };
        mockNotifications.push(newNotification);
    }
    
    return true;
}

// Function to accept a friend request
export function acceptFriendRequest(userId: number, requestId: number): boolean {
    const user = getUserById(userId);
    if (!user || !user.friendRequests) return false;
    
    const request = user.friendRequests.find(r => r.id === requestId && r.status === 'pending');
    if (!request) return false;
    
    // Update request status
    request.status = 'accepted';
    
    // Add each user to the other's friends list
    const fromUser = getUserById(request.from);
    if (!fromUser) return false;
    
    if (!user.friends) user.friends = [];
    if (!fromUser.friends) fromUser.friends = [];
    
    if (!user.friends.includes(fromUser.id)) {
        user.friends.push(fromUser.id);
    }
    
    if (!fromUser.friends.includes(user.id)) {
        fromUser.friends.push(user.id);
    }
    
    // Create notification for the sender
    const newNotification: Notification = {
        id: mockNotifications.length + 1,
        userId: fromUser.id,
        type: 'friendRequest',
        message: `${user.displayName} accepted your friend request`,
        read: false,
        timestamp: new Date()
    };
    mockNotifications.push(newNotification);
    
    return true;
}

// Notification functions
export function getUnreadNotifications(userId: number): Notification[] {
    return mockNotifications.filter(notification => 
        notification.userId === userId && !notification.read
    );
}

export function markNotificationAsRead(notificationId: number): boolean {
    const notification = mockNotifications.find(n => n.id === notificationId);
    if (notification) {
        notification.read = true;
        return true;
    }
    return false;
}


// Game invite functions
export function sendGameInvite(fromUserId: number, toUserId: number, gameMode: string = 'classic'): boolean {
    const fromUser = getUserById(fromUserId);
    const toUser = getUserById(toUserId);
    
    if (!fromUser || !toUser) {
        return false;
    }
    
    const newInvite: GameInvite = {
        id: mockGameInvites.length + 1,
        from: fromUserId,
        to: toUserId,
        status: 'pending',
        timestamp: new Date(),
        gameMode
    };
    
    mockGameInvites.push(newInvite);
    
    // Create notification
    const newNotification: Notification = {
        id: mockNotifications.length + 1,
        userId: toUserId,
        type: 'gameInvite',
        message: `${fromUser.displayName} invited you to play a game`,
        read: false,
        timestamp: new Date(),
        relatedUserId: fromUserId
    };
    mockNotifications.push(newNotification);
    
    return true;
}

// will need to update to take from database this 
export function getTopPlayers(sortBy: 'wins' | 'winrate', limit: number = 10): UserProfile[] {
    // Make a copy to avoid modifying the original array
    const players = [...mockUsers];
    
    // Sort based on criteria / 2 tabel
    if (sortBy === 'wins') {
        players.sort((a, b) => (b.stats?.wins || 0) - (a.stats?.wins || 0));
    } else if (sortBy === 'winrate') {
        players.sort((a, b) => {
            const aTotal = (a.stats?.wins || 0) + (a.stats?.losses || 0);
            const bTotal = (b.stats?.wins || 0) + (b.stats?.losses || 0);
            
            const aRate = aTotal > 0 ? (a.stats?.wins || 0) / aTotal : 0;
            const bRate = bTotal > 0 ? (b.stats?.wins || 0) / bTotal : 0;
            
            return bRate - aRate;
        });
    }
    
    // Return only the requested number of players
    return players.slice(0, limit);
}

export function getRankIcon(rank: string): string {
    // Extract numeric rank if possible
    const rankNum = parseInt(rank?.replace(/\D/g, '') || '0');
    
    if (rankNum <= 10) return '<i class="fas fa-crown" style="color: gold;"></i>';
    if (rankNum <= 50) return '<i class="fas fa-medal" style="color: silver;"></i>';
    if (rankNum <= 100) return '<i class="fas fa-award" style="color: #cd7f32;"></i>';
    return '<i class="fas fa-chess-pawn"></i>';
}

export function getRankTitle(rank: string): string {
    const rankNum = parseInt(rank?.replace(/\D/g, '') || '0');
    
    if (rankNum <= 10) return 'Grandmaster';
    if (rankNum <= 50) return 'Master';
    if (rankNum <= 100) return 'Expert';
    return 'Amateur';
}