import {UserLog} from "../utils/Items";
import axios from "axios";
import {API_BASE_URL, apiUrl} from "../config/api";

class UserLogService
{
    private static instance: UserLogService;

    private constructor() {
    }

    public static getInstance() : UserLogService
    {
        if(!UserLogService.instance)
        {
            UserLogService.instance = new UserLogService();
        }
        return UserLogService.instance;
    }

    // Helper method to calculate session duration
    public calculateSessionDuration(loginTime: string): number {
        try {
            const login = new Date(loginTime);
            const logout = new Date();
            return Math.floor((logout.getTime() - login.getTime()) / 1000); // Duration in seconds
        } catch (error) {
            console.error('Error calculating session duration:', error);
            return 0;
        }
    }

    public async fetchUserLogById(id: number) : Promise<UserLog>
    {
        try
        {
            const response = await axios.get(`${API_BASE_URL}/userLog/${id}`);
            return this.mapToUserLog(response.data);
        }catch(error)
        {
            console.error('Error fetching user log by id: ', error);
            throw error;
        }
    }

    public async fetchActiveUserLogByUserId(userId: number) : Promise<UserLog>
    {
        try
        {
            const response = await axios.get(`${API_BASE_URL}/userLog/active/${userId}`);
            return this.mapToUserLog(response.data);
        }catch(error)
        {
            console.error('Error fetching active user log: ', error);
            throw error;
        }
    }

    public async updateUserLog(id: number, userLog: Partial<UserLog>) : Promise<UserLog>
    {
        try
        {
            const userLogRequest = this.prepareUserLogRequest(userLog);
            const response = await axios.put(`${API_BASE_URL}/userLog/update/${id}`, userLogRequest);
            return this.mapToUserLog(response.data);
        } catch (error) {
            console.error('Error updating user log:', error);
            throw error;
        }
    }

    public async saveUserLog(userId: number, sessionDuration: number, loginAttempts: number, lastLogin: Date, lastLogout: Date) : Promise<UserLog>
    {

        try
        {
            const userLogRequest = {
                userId: userId,
                sessionDuration: sessionDuration,
                loginAttempts: loginAttempts,
                lastLogin: lastLogin.toISOString().slice(0, 19),
                lastLogout: lastLogout.toISOString().slice(0, 19),
                isActive: true
            };

            const response = await axios.post(`${API_BASE_URL}/userLog/save`, userLogRequest);
            return this.mapToUserLog(response.data);
        } catch (error) {
            console.error('Error saving user log:', error);
            throw error;
        }
    }

    private mapToUserLog(data: any) : UserLog
    {
        return {
            id: data.id,
            userId: data.user?.id || data.userId,
            lastLogin: data.lastLogin,
            lastLogout: data.lastLogout,
            sessionDuration: data.sessionDuration,
            loginAttempts: data.loginAttempts,
            isActive: data.isActive
        };
    }

    private prepareUserLogRequest(userLog: Partial<UserLog>)
    {
        return {
            userId: userLog.userId,
            lastLogin: userLog.lastLogin,
            sessionDuration: userLog.sessionDuration,
            lastLogout: userLog.lastLogout,
            isActive: userLog.isActive
        };
    }
}
export default UserLogService;