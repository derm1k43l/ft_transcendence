import { api } from './api.js';

import { 
    UserProfile,
    ChatMessage, 
    AppNotification,
    Friend,
    FriendRequest,
    GameInvite,
    GameSettings,
    NotificationOptions,
	LoginResponse,
    MatchRecord,
    Achievement,
    UserStats,
} from '../types/index.js';

import {
    DEFAULT_GAME_SETTINGS,
    DEFAULT_ACHIEVEMENTS,
    DEFAULT_COVER_PHOTO,
    DEFAULT_AVATAR,
    DEFAULT_STATS
} from '../constants/defaults.js';

import { NotificationManager } from '../components/Notification.js';

// ===== User Management Functions =====

export async function getUserById(id: number): Promise<UserProfile | null> {
	try {
		const user = (await api.get(`/users/${id}`)).data as UserProfile;
		return user;
	} catch (error: any) {
		console.error(`Failed to fetch user with ID ${id}: `, error?.response?.data?.message || error);
		return null;
	}
}

export async function getAllUsers(): Promise<UserProfile[]> {
	try {
		const users: UserProfile[] = (await api.get(`/users/`)).data as UserProfile[];
        for (const user of users) {
            await setMatchHistory(user);
            await setUserStats(user);
        }
		return users;
	} catch (error: any) {
		console.error(`Failed to fetch all users: `, error?.response?.data?.message || error);
		return [];
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
        console.error(`Failed to send message from ${fromUserId} to ${toUserId}`, error?.response?.data?.message || error);
        return null;
    }
}

export async function getUnreadMessageCount(userId: number): Promise<number> {
    try {
        const response = await api.get(`/users/${userId}/messages/unread/count`);
        return response.data.count;
    } catch (error: any) {
        console.error(`Failed to get unread message count for user ID: ${userId}`, error?.response?.data?.message || error);
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
        console.error(`Failed to mark messages as read from ${fromUserId} to ${toUserId}`, error?.response?.data?.message || error);
    }
}

// Function to get conversations for a user
export async function getUserConversations(userId: number): Promise<any[]> {
    try {
        const response = await api.get(`/users/${userId}/conversations`);
        return response.data;
    } catch (error: any) {
        console.error(`Failed to get conversations for user ID: ${userId}`, error?.response?.data?.message || error);
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
        console.error(`Failed to get top players by ${sortBy}`, error?.response?.data?.message || error);
        return [];
    }
}


// ===== Friend Management =====

export async function getFriendsList(userId: number): Promise<Friend[]> {
    try {
        const response = await api.get(`/friends/users/${userId}`);
        return response.data as Friend[];
    } catch (error: any) {
        console.error(`Failed to get friends list for user ID: ${userId}`, error?.response?.data?.message || error);
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
        console.error(`Failed to send friend request from ${fromUserId} to ${toUserId}`, error?.response?.data?.message || error);
        return false;
    }
}

// export async function getFriendRequests(userId: number, status?: 'pending' | 'accepted' | 'rejected'): Promise<FriendRequest[]> {
//     try {
//         const allRequests = (await api.get('/friend-requests')).data as FriendRequest[];
// 		const userRequests = allRequests.filter(r => r.from_user_id === userId || r.to_user_id === userId);
// 		if (status)
// 		{
// 			const filteredUserRequests = userRequests.filter(r => r.status === status);
// 			return filteredUserRequests;
// 		}
//         return userRequests;
//     } catch (error: any) {
//         console.error(`Failed to get friend requests for user ID: ${userId}`, error?.response?.data?.message || error);
//         return [];
//     }
// }

export async function getIncomingFriendRequests(userId: number): Promise<FriendRequest[]> {
    try {
        const requests = (await api.get(`/friend-requests/received/users/${userId}`)).data as FriendRequest[];
        return requests;
    } catch (error: any) {
        console.error(`Failed to get friend requests for user ID: ${userId}`, error?.response?.data?.message || error);
        return [];
    }
}

export async function getOutgoingFriendRequests(userId: number): Promise<FriendRequest[]> {
    try {
        const requests = (await api.get(`/friend-requests/sent/users/${userId}`)).data as FriendRequest[];
        return requests;
    } catch (error: any) {
        console.error(`Failed to get friend requests for user ID: ${userId}`, error?.response?.data?.message || error);
        return [];
    }
}

export async function acceptFriendRequest(userId: number, requestId: number): Promise<boolean> {
    try {
        await api.put(`/friend-requests/status/${requestId}`, {
            status: "accepted"
        });
        return true;
    } catch (error: any) {
        console.error(`Failed to accept friend request ID: ${requestId}`, error?.response?.data?.message || error);
        return false;
    }
}

export async function rejectFriendRequest(userId: number, requestId: number): Promise<boolean> {
    try {
        await api.put(`/friend-requests/status/${requestId}`, {
            status: "rejected"
        });
        return true;
    } catch (error: any) {
        console.error(`Failed to reject friend request ID: ${requestId}`, error?.response?.data?.message || error);
        return false;
    }
}

export async function updateUserProfile(userId: number, updates: Partial<UserProfile>): Promise<boolean> {
    try {
        // some security concern here
        const { id, username, password, ...allowedUpdates } = updates;
        allowedUpdates.avatar_url = undefined; // dont overwrite avatar
        allowedUpdates.cover_photo_url = undefined; // dont overwrite cover photo
        await api.put(`/users/${userId}`, allowedUpdates);
        return true;
    } catch (error: any) {
        console.error(`Failed to update user profile for ID: ${userId}`, error?.response?.data?.message || error);
        return false;
    }
}

export async function getUserGameSettings(userId: number): Promise<GameSettings> {
    try {
        const settings = (await api.get(`/game-settings/users/${userId}`)).data as GameSettings;
        return settings;
    } catch (error: any) {
        console.error(`Failed to get game settings for user ID: ${userId}`, error?.response?.data?.message || error);
        return DEFAULT_GAME_SETTINGS;
    }
}

export async function updateUserGameSettings(userId: number, settings: GameSettings): Promise<boolean> {
    try {
        await api.put(`/game-settings/users/${userId}`, settings);
        return true;
    } catch (error: any) {
        console.error(`Failed to update game settings for user ID: ${userId}`, error?.response?.data?.message || error);
        return false;
    }
}

export async function resetUserGameSettings(userId: number): Promise<boolean> {
    return updateUserGameSettings(userId, { ...DEFAULT_GAME_SETTINGS });
}

export async function addMatchRecord(record: MatchRecord): Promise<boolean> {
    try {
        await api.post(`/match-history/`, record);
        return true;
    } catch (error: any) {
        console.error(`Failed to add this game to match history`, error?.response?.data?.message || error);
        return false;
    }
}

export async function setMatchHistory(user: UserProfile): Promise<MatchRecord[]> {
    try {
        const records = (await api.get(`/match-history/users/${user.id}`)).data as MatchRecord[];
        user.match_history = records;
    } catch (error: any) {
        console.error(`Failed to get match history`, error?.response?.data?.message || error);
        user.match_history = [];
    }

    return user.match_history;
}

export async function setAchievements(user: UserProfile): Promise<Achievement[]> {
    user.achievements = DEFAULT_ACHIEVEMENTS;

    // check if user has won a game
    if (user.match_history) {
        for (const match of user.match_history) {
            if (match.result === 'win') {
                    user.achievements[0].completed = true;
                    break;
                }
        }
    }

    // check if user has won 3 games in a row
    if (user.match_history) {
        let consecutiveWins = 0;
        for (const match of user.match_history) {
            if (match.result === 'win') {
                consecutiveWins++;
                if (consecutiveWins >= 3) {
                    user.achievements[1].completed = true;
                    break;
                }
            } else {
                consecutiveWins = 0;
            }
        }
    }

    // check if user has at least 3 friends
    if ((await getFriendsList(user.id)).length >= 3)
        user.achievements[2].completed = true;

    return user.achievements;
}

export async function setUserStats(user: UserProfile): Promise<UserStats> {
    user.stats = { ...DEFAULT_STATS };
    if (!user.match_history || !user.match_history.length) {
        return user.stats;
    }

    user.stats.played = user.match_history.length;
    for (const match of user.match_history) {
        if (match.result === 'win')
            user.stats.wins++;
        if (match.result === 'loss')
            user.stats.losses++;
    }
    if (user.stats.wins + user.stats.losses > 0)
        user.stats.winrate = Math.round(user.stats.wins / (user.stats.wins + user.stats.losses) * 100);

    if (user.stats.winrate >= 25 && user.stats.played >=  1) user.stats.rank = 'Silver';
    if (user.stats.winrate >= 50 && user.stats.played >=  5) user.stats.rank = 'Gold';
    if (user.stats.winrate >= 75 && user.stats.played >= 10) user.stats.rank = 'Diamond';

    user.stats.level = Math.round((user.stats.played / 4) * (1 + user.stats.winrate / 100));

    return user.stats;
}

export async function uploadAvatar(user_id: number, image: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('avatar', image);
        const response = await api.put(`/users/${user_id}/avatar`, formData, {
            headers: {
                'Content-Type': undefined,
            },
        });
        const body: { message: string, avatar_url: string } = response.data;
        return body.avatar_url;
    } catch (error: any) {
        console.error(`Failed to upload avatar for user id ${user_id}: `, error?.response?.data?.message || error);
        const oldURL = (await getUserById(user_id))?.avatar_url;
        if (oldURL) return oldURL;
        return DEFAULT_AVATAR;
    }
}

export async function uploadCover(user_id: number, image: File): Promise<string> {
    try {
        const formData = new FormData();
        formData.append('cover', image);
        const response = await api.put(`/users/${user_id}/cover`, formData, {
            headers: {
                'Content-Type': undefined,
            },
        });
        const body: { message: string, cover_photo_url: string } = response.data;
        return body.cover_photo_url;
    } catch (error: any) {
        console.error(`Failed to upload cover photo for user id ${user_id}: `, error?.response?.data?.message || error);
        return DEFAULT_COVER_PHOTO;
    }
}
