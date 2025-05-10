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
export async function findUserByUsername(username: string): Promise<UserProfile | undefined> {
	try {
		const user = (await api.get(`/users/byname/${username}`)).data as UserProfile;
		return user;
	} catch (error) {
		console.error(`Failed to fetch user with ID ${username}:`);
		return undefined;
	}
}

export async function findUserByEmail(email: string): Promise<UserProfile | undefined> {
	try {
		const user = (await api.get(`/users/byemail/${email}`)).data as UserProfile;
		return user;
	} catch (error) {
		console.error(`Failed to fetch user with ID ${email}:`);
		return undefined;
	}
}

export async function getUserById(id: number): Promise<UserProfile | undefined> {
	try {
		const user = (await api.get(`/users/${id}`)).data as UserProfile;
		return user;
	} catch (error) {
		console.error(`Failed to fetch user with ID ${id}:`);
		return undefined;
	}
}

export async function getUserGameSettings(userId: number): Promise<GameSettings | undefined> {
	try {
		const user = await getUserById(userId);
		return user?.gameSettings;
	} catch (error) {
		console.error("Error retrieving game settings:", error);
		return undefined;
	}
}










export async function registerUser(userData: {
	username: string;
	displayName: string;
	password: string;
	email?: string;
  }): Promise<UserProfile> {
	try {
	  const response = await api.post<UserProfile>('/users', userData);
	  return response.data;
	} catch (error) {
	  console.error('Error registering user:', error);
	  throw error;
	}
}

export async function login(credentials: {
	username: string;
	password: string;
  }): Promise<LoginResponse> {
	try {
	  const response = await api.post<LoginResponse>('/users/login', credentials);
	  
	  // Store token for future requests
	  if (response.data.token) {
		localStorage.setItem('auth_token', response.data.token);
	  }
	  
	  return response.data;
	} catch (error) {
	  console.error('Login error:', error);
	  throw error;
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

export async function resetUserStats(userId: number): Promise<boolean> {
	try {
		await api.put(`/user-stats/${userId}/reset`);
		return true;
	} catch (error) {
		console.error('Error resetting user stats:', error);
		return false;
	}
}
