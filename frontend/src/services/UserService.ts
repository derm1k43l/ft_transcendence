import { api } from './api.js';

import { 
    UserProfile,
    ChatMessage, 
    AppNotification,
    FriendRequest,
    GameInvite,
    GameSettings,
    NotificationOptions
} from '../types/index.js';

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
