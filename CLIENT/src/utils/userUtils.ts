import usersData from '../data/users.json';

interface User {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: 'candidate' | 'recruiter';
  company?: string;
}

// Add this interface to define the structure of users.json
interface UsersData {
  users: User[];
}

// Type assertion to tell TypeScript the correct type
const typedUsersData = usersData as UsersData;

export const userUtils = {
  // Register a new user
  register: (userData: User): Promise<{ success: boolean; message: string }> => {
    return new Promise((resolve) => {
      try {
        // Check if user already exists
        const existingUser = typedUsersData.users.find(user => user.email === userData.email);
        if (existingUser) {
          resolve({ success: false, message: 'User already exists' });
          return;
        }

        // Add new user
        typedUsersData.users.push(userData);
        
        // In a real app, we would write to the JSON file here
        // For now, we'll just store in memory
        resolve({ success: true, message: 'Registration successful' });
      } catch (error) {
        resolve({ success: false, message: 'Registration failed' });
      }
    });
  },

  // Login user
  login: (email: string, password: string): Promise<{ success: boolean; user?: User; message: string }> => {
    return new Promise((resolve) => {
      try {
        const user = typedUsersData.users.find(
          user => user.email === email && user.password === password
        );

        if (user) {
          resolve({ success: true, user, message: 'Login successful' });
        } else {
          resolve({ success: false, message: 'Invalid credentials' });
        }
      } catch (error) {
        resolve({ success: false, message: 'Login failed' });
      }
    });
  },

  // Get all users (for testing purposes)
  getAllUsers: (): User[] => {
    return typedUsersData.users;
  }
}; 