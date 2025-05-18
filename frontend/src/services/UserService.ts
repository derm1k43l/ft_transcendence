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
	TournamentMatch,
	Tournament
} from '../types/index.js';

import {
    DEFAULT_GAME_SETTINGS,
    DEFAULT_ACHIEVEMENTS,
    DEFAULT_COVER_PHOTO,
    DEFAULT_AVATAR,
    DEFAULT_STATS
} from '../constants/defaults.js';

import { NotificationManager } from '../components/Notification.js';
import { getCurrentUser } from './auth.js';

// ===== User Management Functions =====

export async function getUserById(id: number): Promise<UserProfile | null> {
	try {
		const user = (await api.get(`/users/${id}`)).data as UserProfile;
        await completeUser(user);
		return user;
	} catch (error: any) {
		console.error(`Failed to fetch user with ID ${id}: `, error?.response?.data?.message || error);
		return null;
	}
}

export async function getAllUsers(): Promise<UserProfile[]> {
	try {
		const users: UserProfile[] = (await api.get(`/users/`)).data as UserProfile[];
        for (const user of users)
            await completeUser(user);
		return users;
	} catch (error: any) {
		console.error(`Failed to fetch all users: `, error?.response?.data?.message || error);
		return [];
	}
}

// above functions are tested and working


// need to test following functions



// ===== Chat-related Functions =====

export async function sendMessage(receiver_id: number, content: string) {
    try {
        content = content.trim();
        if (content.length < 1) return null;
        const response = await api.post('/chat-messages/', {
            receiver_id: receiver_id,
            content: content,
        });
        const message = response.data as ChatMessage;
        return message;
    } catch (error: any) {
        console.error(`Failed to send message to ${receiver_id}: `, error?.response?.data?.message || error);
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

export async function markMessagesAsRead(messages: ChatMessage[]) {
    if (messages.length === 0) return;
    const receiver = await getCurrentUser();
    if (!receiver) return;
    try {
        for (const msg of messages) {
            if (msg.receiver_id === receiver.id && !msg.read)
                await api.put(`/chat-messages/read/${msg.id}`);
    }
    } catch (error: any) {
        console.error(`Failed to mark messages as read: `, error?.response?.data?.message || error);
    }
}

// Function to get chat messages for a user
export async function getChatMessages(userId: number, partnerId: number): Promise<ChatMessage[]> {
    try {
        const messages = (await api.get(`/chat-messages/chat/users/${userId}/${partnerId}`)).data as ChatMessage[];
        // messages.sort((a: ChatMessage, b: ChatMessage) => 
        //     new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        // );
        return messages;
    } catch (error: any) {
        console.error(`Failed to get chat messages between users: ${userId} and ${partnerId}: `, error?.response?.data?.message || error);
        return [];
    }
}

export async function getLastMessageAndUnreadCount(userId: number, partnerId: number): Promise<{ lastMessage: ChatMessage | null, unreadCount: number }> {
    try {
        let unreadCount = 0;
        const messages = (await api.get(`/chat-messages/chat/users/${userId}/${partnerId}`)).data as ChatMessage[];
        // messages.sort((a: ChatMessage, b: ChatMessage) => 
        //     new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        // );
        for (const msg of messages) {
            if (msg.receiver_id === userId && !msg.read)
                unreadCount++;
        }
        const lastMessage = messages[messages.length - 1];
        if (lastMessage) return { lastMessage: lastMessage, unreadCount: unreadCount};
    } catch (error: any) {
        console.error(`Failed to get chat messages between users: ${userId} and ${partnerId}: `, error?.response?.data?.message || error);
    }
    return { lastMessage: null, unreadCount: 0 };
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

export async function getFriendStatus(userId1: number, userId2: number): Promise<boolean> {
    try {
        const response = await api.get(`/friends/users/${userId1}/${userId2}`);
        return response.data.isFriend as boolean;
    } catch (error: any) {
        console.error(`Failed to get friend status between ${userId1} and ${userId1}`, error?.response?.data?.message || error);
        return false;
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
    if (userId <= 0)
        return DEFAULT_GAME_SETTINGS;
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













export async function completeUser(user: UserProfile | null) {
    if (!user) return;
    await setMatchHistory(user);
    await setAchievements(user);
    await setUserStats(user);
    await setRealStatus(user);
}

export async function setMatchHistory(user: UserProfile): Promise<MatchRecord[]> {
    try {
        const records = (await api.get(`/match-history/users/${user.id}`)).data as MatchRecord[];
        // records.sort((a: MatchRecord, b: MatchRecord) => 
        //     new Date(b.date).getTime() - new Date(a.date).getTime()
        // );
        records.reverse();
        user.match_history = records;
    } catch (error: any) {
        console.error(`Failed to get match history`, error?.response?.data?.message || error);
        user.match_history = [];
    }

    return user.match_history;
}

export async function setAchievements(user: UserProfile): Promise<Achievement[]> {
    user.achievements = JSON.parse(JSON.stringify(DEFAULT_ACHIEVEMENTS)) as Achievement[]; // deep copy

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

export function setRealStatus(user: UserProfile | null) {
    if (!user) return;
    if (!user.status || !user.last_active) {
        user.status = 'offline';
        return;
    }

    // check for timeout
    const timeout = new Date();
    timeout.setMinutes(timeout.getMinutes() + 3);

    if (new Date(user.last_active) < timeout)
        user.status = 'offline';
}

// ===== Tournament =====

export async function getAllTournaments(): Promise<Tournament[]> {
    try {
        const tournaments = (await api.get(`/tournament/`)).data as Tournament[];
        return tournaments;
    } catch (error: any) {
        console.error(`Failed to get tournaments for user ID: `, error?.response?.data?.message || error);
        return [];
    }
}

export async function addTournament(tournamentInfos: {
	id: number,
	tournament_name: string,
	creator_id: number,
	player_amount: number,
	status: 'pending' | 'running' | 'finished',
	winner_name?: string | null,
	players: string[],
	matches: TournamentMatch[],
}): Promise<Tournament | null> {
    try {
        const tournament = (await api.post(`/tournament/`, tournamentInfos)).data as Tournament;
        return tournament;
    } catch (error: any) {
        console.error(`Failed to create tournament: `, error?.response?.data?.message || error);
        return null;
    }
}

export async function updateTournament(tournamentId: number, tournament: Tournament): Promise<boolean> {
    try {
        await api.put(`/tournament/${tournamentId}`, tournament);
        return true;
    } catch (error: any) {
        console.error(`Failed to update tournament: ${tournamentId}`, error?.response?.data?.message || error);
        return false;
    }
}

export async function deleteTournament(tournamentId: number): Promise<boolean> {
    try {
        const response = (await api.delete(`/tournament/${tournamentId}`)).data as { message: string };
        console.log(`${response.message} with id: ${tournamentId}`);
        return true;
    } catch (error: any) {
        console.error(`Failed to delete tournament: ${tournamentId}`, error?.response?.data?.message || error);
        return false;
    }
}
