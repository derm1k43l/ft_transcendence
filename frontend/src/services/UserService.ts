import { api } from './api.js';

import { 
    UserProfile,
    ChatMessage, 
    AppNotification,
    FriendRequest,
    GameInvite,
    GameSettings,
    NotificationOptions,
	LoginResponse
} from '../types/index.js';

import {
    DEFAULT_GAME_SETTINGS,
    DEFAULT_ACHIEVEMENTS,
    DEFAULT_COVER_PHOTO,
    DEFAULT_AVATAR
} from '../constants/defaults.js';

import { NotificationManager } from '../components/Notification.js';

// ===== User Management Functions =====

// User lookup functions
export async function findUserByUsername(username: string): Promise<UserProfile | null> {
	try {
		const user = (await api.get(`/users/byname/${username}`)).data as UserProfile;
		return user;
	} catch (error) {
		console.error(`Failed to fetch user with Username ${username}:`);
		return null;
	}
}

export async function findUserByEmail(email: string): Promise<UserProfile | null> {
	try {
		const user = (await api.get(`/users/byemail/${email}`)).data as UserProfile;
		return user;
	} catch (error) {
		console.error(`Failed to fetch user with Email ${email}:`);
		return null;
	}
}

export async function getUserById(id: number): Promise<UserProfile | null> {
	try {
		const user = (await api.get(`/users/${id}`)).data as UserProfile;
		return user;
	} catch (error) {
		console.error(`Failed to fetch user with ID ${id}:`);
		return null;
	}
}

export async function getUserGameSettings(userId: number): Promise<GameSettings | null> {
	try {
		const user = await getUserById(userId);
		return user?.game_settings || DEFAULT_GAME_SETTINGS;
	} catch (error) {
		console.error("Error retrieving game settings:", error);
		return null;
	}
}

export async function registerUser(userData: {
	username: string;
	password: string;
	display_name: string;
	email: string;
}): Promise<UserProfile> {
	try {
	  const response = await api.post('/users', userData);
	  return response.data;
	} catch (error: any) {
	  console.error('Error registering user:', error.response.data.message);
	  throw error.response.data.message;
	}
}

export async function login(credentials: {
	username: string;
	password: string;
  }): Promise<LoginResponse> {
	try {
		const response = await api.post('/users/login', credentials);
		// Store token for future requests
		if (response.data.token) {
			localStorage.setItem('auth_token', response.data.token);
		}
		return response.data;
	} catch (error: any) {
		console.error('Login error:', error.response.data.message);
		throw error.response.data.message;
	}
}




// above functions are tested and working


// need to test following functions



// ===== Chat-related Functions =====

export async function sendMessage(fromUserId: number, toUserId: number, content: string): Promise<ChatMessage | null> {
    try {
        if (!content.trim()) return null;
        
        const response = await api.post('/messages', {
            sender_id: fromUserId,
            receiver_id: toUserId,
            content: content.trim()
        });
        
        return response.data;
    } catch (error: any) {
        console.error(`Failed to send message from ${fromUserId} to ${toUserId}`, error?.response?.data || error);
        return null;
    }
}

export async function getUnreadMessageCount(userId: number): Promise<number> {
    try {
        const response = await api.get(`/users/${userId}/messages/unread/count`);
        return response.data.count;
    } catch (error: any) {
        console.error(`Failed to get unread message count for user ID: ${userId}`, error?.response?.data || error);
        return 0;
    }
}

export async function markMessagesAsRead(fromUserId: number, toUserId: number): Promise<void> {
    try {
        await api.put(`/messages/read`, {
            sender_id: fromUserId,
            receiver_id: toUserId
        });
    } catch (error: any) {
        console.error(`Failed to mark messages as read from ${fromUserId} to ${toUserId}`, error?.response?.data || error);
    }
}

// Function to get conversations for a user
export async function getUserConversations(userId: number): Promise<any[]> {
    try {
        const response = await api.get(`/users/${userId}/conversations`);
        return response.data;
    } catch (error: any) {
        console.error(`Failed to get conversations for user ID: ${userId}`, error?.response?.data || error);
        return [];
    }
}

export async function resetUserStats(userId: number): Promise<boolean> {
	try {
		await api.put(`/user-stats/${userId}/reset`);
		return true;
	} catch (error: any) {
		console.error('Error resetting user stats:', error.response.data.message);
		return false;
	}
}

// ===== Leaderboard Functions =====

export async function getTopPlayers(sortBy: 'wins' | 'winrate' = 'wins', limit: number = 10): Promise<UserProfile[]> {
    try {
        const response = await api.get(`/leaderboard?sort=${sortBy}&limit=${limit}`);
        return response.data;
    } catch (error: any) {
        console.error(`Failed to get top players by ${sortBy}`, error?.response?.data || error);
        return [];
    }
}


// ===== Friend Management =====

export async function getFriendsList(userId: number): Promise<number[]> {
    try {
        const response = await api.get(`/users/${userId}/friends`);
        return response.data;
    } catch (error: any) {
        console.error(`Failed to get friends list for user ID: ${userId}`, error?.response?.data || error);
        return [];
    }
}

export async function sendFriendRequest(fromUserId: number, toUserId: number): Promise<boolean> {
    try {
        await api.post('/friend-requests', {
            from_user_id: fromUserId,
            to_user_id: toUserId
        });
        return true;
    } catch (error: any) {
        console.error(`Failed to send friend request from ${fromUserId} to ${toUserId}`, error?.response?.data || error);
        return false;
    }
}

export async function getFriendRequests(userId: number, status?: 'pending' | 'accepted' | 'rejected'): Promise<FriendRequest[]> {
    try {
        let endpoint = `/users/${userId}/friend-requests`;
        if (status) {
            endpoint += `?status=${status}`;
        }
        const response = await api.get(endpoint);
        return response.data;
    } catch (error: any) {
        console.error(`Failed to get friend requests for user ID: ${userId}`, error?.response?.data || error);
        return [];
    }
}

export async function acceptFriendRequest(userId: number, requestId: number): Promise<boolean> {
    try {
        await api.put(`/friend-requests/${requestId}/accept`, {
            user_id: userId
        });
        return true;
    } catch (error: any) {
        console.error(`Failed to accept friend request ID: ${requestId}`, error?.response?.data || error);
        return false;
    }
}

export async function rejectFriendRequest(userId: number, requestId: number): Promise<boolean> {
    try {
        await api.put(`/friend-requests/${requestId}/reject`, {
            user_id: userId
        });
        return true;
    } catch (error: any) {
        console.error(`Failed to reject friend request ID: ${requestId}`, error?.response?.data || error);
        return false;
    }
}



export async function logout(): Promise<void> {
	try {
	  // Call the logout endpoint if it exists
	  if (localStorage.getItem('auth_token')) {
		await api.post('/users/logout', {});
	  }
	} catch (error) {
	  console.error('Error during logout:', error);
	} finally {
	  // Always clear the token regardless of API result
	  localStorage.removeItem('auth_token');
	}
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
