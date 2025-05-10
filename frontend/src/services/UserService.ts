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

export async function resetUserStats(userId: number): Promise<boolean> {
	try {
		await api.put(`/user-stats/${userId}/reset`);
		return true;
	} catch (error: any) {
		console.error('Error resetting user stats:', error.response.data.message);
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
