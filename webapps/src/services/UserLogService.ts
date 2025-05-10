import {UserLog} from "../utils/Items";
import axios from "axios";

class UserLogService
{
    private static instance: UserLogService;
    private readonly baseURL: string = 'http://localhost:8080/api/userLog';

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

    public async fetchUserLogById(id: number) : Promise<UserLog>
    {
        try
        {
            const response = await axios.get(`${this.baseURL}/${id}`);
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
            const response = await axios.get(`${this.baseURL}/active/${userId}`);
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
            const response = await axios.put(`${this.baseURL}/update/${id}`, userLogRequest);
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
                lastLogin: lastLogin.getTime(),
                lastLogout: lastLogout.getTime(),
                isActive: true
            };

            const response = await axios.post(`${this.baseURL}/save`, userLogRequest);
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
            sessionDuration: userLog.sessionDuration,
            loginAttempts: userLog.loginAttempts,
            lastLogin: userLog.lastLogin,
            lastLogout: userLog.lastLogout,
            isActive: userLog.isActive
        };
    }
}
export default UserLogService;