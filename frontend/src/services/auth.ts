import { api } from './api.js';
import { UserProfile, LoginResponse } from '../types/index.js';
import { NotificationManager } from '../components/Notification.js';

// Authentication state
let currentUser: UserProfile | null = null;
let isAuthenticated: boolean = false;

// Initialize the authentication state from localStorage
export async function initializeAuth(): Promise<UserProfile | null> {
    try {
        currentUser = await getCurrentUser();
        if (currentUser) {
            isAuthenticated = true;
        }
        return currentUser;
    } catch (error) {
        // Token invalid or expired
        clearAuthData();
        return null;
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
        
        // Set authentication state
        currentUser = response.data.user;
        isAuthenticated = true;
        
        return response.data;
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
}): Promise<UserProfile> {
    try {
        const response = await api.post('/users', userData);
        return response.data;
    } catch (error: any) {
        console.error('Error registering user:', error.response?.data?.message || error);
        throw error.response?.data?.message || 'Registration failed. Please try again.';
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
        // Always clear auth data regardless of API result
        clearAuthData();
    }
}

export async function getCurrentUser(): Promise<UserProfile | null> {
    try {
        const user = (await api.get(`/users/current`)).data as UserProfile;
        return user;
    } catch (error) {
        console.error(`Failed to fetch current user: not logged in`);
        return null;
    }
}


// mywbe here also some security 
export async function updateUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
        await api.put(`/users/${userId}/password`, {
            current_password: currentPassword,
            new_password: newPassword
        });
        return true;
    } catch (error: any) {
        console.error(`Failed to update password for user ID: ${userId}`, error?.response?.data?.message || error);
        return false;
    }
}

export function isUserAuthenticated(): boolean {
    return isAuthenticated;
}


// Get the current user object
export function getAuthenticatedUser(): UserProfile | null {
    return currentUser;
}

export function clearAuthData(): void {
    localStorage.removeItem('auth_token');
    currentUser = null;
    isAuthenticated = false;
}

export async function socialLogin(provider: 'google' | 'fortytwo'): Promise<void> {
    // Implementation for social login for google only
    
    throw new Error(`${provider} login not implemented`);
}

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
        return user;
    } catch (error) {
        console.error(`Failed to fetch user with Email ${email}:`);
        return null;
    }
}
