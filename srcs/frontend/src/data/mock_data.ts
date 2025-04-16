// will delete this whe back is ready
// Define a structure for user data
export interface UserProfile {
    id: number;
    username: string;
    password?: string;
    displayName: string;
    avatarUrl?: string;
    stats?: {
        wins: number;
        losses: number;
    };
}

// Debug message to verify loading
console.log("Loading mock_data.ts");

// Mock user database
export const mockUsers: UserProfile[] = [
    {
        id: 1,
        username: "test",
        password: "test", 
        displayName: "Test User",
        avatarUrl: "",
        stats: { wins: 5, losses: 2 }
    },
    {
        id: 2,
        username: "player2",
        password: "password123",
        displayName: "Another Player",
        stats: { wins: 10, losses: 10 }
    }
];

console.log("Mock users defined:", mockUsers);

// Function to find a user by username
export function findUserByUsername(username: string): UserProfile | undefined {
    console.log(`Looking for username: ${username} in mockUsers`);
    if (!username) return undefined;
    
    const foundUser = mockUsers.find(user => 
        user.username.toLowerCase() === username.toLowerCase()
    );
    
    console.log(`Found user:`, foundUser);
    return foundUser;
}