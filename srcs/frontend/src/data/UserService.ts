import { 
    UserProfile,
    mockUsers,
    mockMessages,
    ChatMessage, 
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
