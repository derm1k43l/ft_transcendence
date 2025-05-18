import { api } from './api.js';
import { UserProfile, LoginResponse } from '../types/index.js';
import { NotificationManager } from '../components/Notification.js';
import { completeUser } from './UserService.js';

export async function login(credentials: { 
    username: string; 
    password: string;
}): Promise<UserProfile | null> {
    try {
        const response: LoginResponse = (await api.post('/users/login', credentials)).data;
        
        // Store auth_token for future requests
        if (response.token) {
            localStorage.setItem('auth_token', response.token);
        }
        const user = await getCurrentUser();
        
        return user;
    } catch (error: any) {
        console.error('Login error:', error.response?.data?.message || error);
        throw error.response?.data?.message || 'Login failed. Please check your credentials.';
    }
}

export async function register(userData: { 
    username: string; 
    password: string; 
    email: string;
    display_name?: string;
    avatar_url: 'https://placehold.co/80x80/1d1f21/ffffff?text=User'; // all get same avatar! and we never check if it exist BECOUSE IT DOES!!!
}): Promise<UserProfile> {
    try {
        const user = (await api.post('/users', userData)).data as UserProfile;
        completeUser(user);
        return user;
    } catch (error: any) {
        console.error('Error registering user:', error.response?.data?.message || error);
        throw error.response?.data?.message || 'Registration failed. Please try again.';
    }
}

export async function logout(): Promise<void> {
    try {
        // Call the logout endpoint if it exists
        if (localStorage.getItem('auth_token')) {
            await api.post('/users/log-out', {});
        }
    } catch (error) {
        console.error('Error during logout:', error);
    } finally {
        // Always clear auth data regardless of API result
        clearAuthData();
    }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
    try {
        if (!localStorage.getItem('auth_token')) {
            console.log('user has no auth_token');
            clearAuthData();
            return null;
        }
        const user = (await api.get(`/users/current`)).data as UserProfile;
        await completeUser(user);
        return user;
    } catch (error) {
        console.error(`Failed to fetch current user: not logged in`);
        clearAuthData();
        return null;
    }
}

// mywbe here also some security 
export async function updateUserPassword(userId: number, oldPassword: string, newPassword: string): Promise<boolean> {
    try {
        await api.put(`/users/${userId}/password`, {
            old_password: oldPassword,
            new_password: newPassword
        });
        return true;
    } catch (error: any) {
        console.error(`Failed to update password for user ID: ${userId}`, error?.response?.data?.message || error);
        return false;
    }
}

export function clearAuthData(): void {
    localStorage.removeItem('auth_token');
}

// export async function googleLogin(): Promise<UserProfile | null> {

// }

//testt
export async function deleteUserAccount(userId: number): Promise<boolean> {
    try {
        await api.delete(`/users/${userId}`);
        return true;
    } catch (error: any) {
        console.error(`Error deleting user account for ID ${userId}:`, error?.response?.data?.message || error);
        return false;
    }
}

// Check if a username exists
export async function checkUsernameExists(username: string): Promise<boolean> {
    try {
        const user = await findUserByUsername(username);
        return !!user;
    } catch {
        return false;
    }
}

// Find user by username
export async function findUserByUsername(username: string): Promise<UserProfile | null> {
    try {
        const user = (await api.get(`/users/byname/${username}`)).data as UserProfile;
        await completeUser(user);
        return user;
    } catch (error) {
        console.error(`Failed to fetch user with Username ${username}:`);
        return null;
    }
}

// Find user by email
export async function findUserByEmail(email: string): Promise<UserProfile | null> {
    try {
        const user = (await api.get(`/users/byemail/${email}`)).data as UserProfile;
        await completeUser(user);
        return user;
    } catch (error) {
        console.error(`Failed to fetch user with Email ${email}:`);
        return null;
    }
}
