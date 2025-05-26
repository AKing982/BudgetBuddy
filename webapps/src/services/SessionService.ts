import {apiUrl} from "../config/api";
import axios from "axios";

class SessionService {
    private static instance: SessionService;
    private baseUrl: string = 'http://localhost:8080'; // Your Spring Boot backend URL

    private constructor() {}

    public static getInstance(): SessionService {
        if (!SessionService.instance) {
            SessionService.instance = new SessionService();
        }
        return SessionService.instance;
    }

    // Create session after successful login
    async createSession(sessionData: {
        userId: string;
        username: string;
        email: string;
        fullName: string;
        roles?: string[];
    }): Promise<any> {
        try {
            console.log('API URL: ', apiUrl);
            const response = await axios.post(`${apiUrl}/session/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include', // Important: Include cookies for session
                body: JSON.stringify(sessionData)
            });

            if (!response) {
                throw new Error(`Failed to create session: ${response}`);
            }

            const result = await response.data;
            console.log('Session created:', result);
            return result;
        } catch (error) {
            console.error('Error creating session:', error);
            throw error;
        }
    }

    // Get current session info
    async getCurrentSession(): Promise<any> {
        try {
            const response = await fetch(`${apiUrl}/current-session`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include'
            });

            if (!response.ok) {
                if (response.status === 401) {
                    return null; // No active session
                }
                throw new Error(`Failed to get session: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error getting session:', error);
            throw error;
        }
    }

    // Update session data
    async updateSession(updates: Record<string, any>): Promise<any> {
        try {
            const response = await fetch(`${apiUrl}/session/update`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify(updates)
            });

            if (!response.ok) {
                throw new Error(`Failed to update session: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error updating session:', error);
            throw error;
        }
    }

    // Invalidate current session
    async invalidateSession(): Promise<void> {
        try {
            const response = await fetch(`${apiUrl}/session/invalidate`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Failed to invalidate session: ${response.statusText}`);
            }

            console.log('Session invalidated successfully');
        } catch (error) {
            console.error('Error invalidating session:', error);
            throw error;
        }
    }

    // Extend session lifetime
    async extendSession(): Promise<any> {
        try {
            const response = await fetch(`${apiUrl}/session/extend`, {
                method: 'POST',
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Failed to extend session: ${response.statusText}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error extending session:', error);
            throw error;
        }
    }
}

export default SessionService;