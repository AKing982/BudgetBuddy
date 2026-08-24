import {EnvelopeNotification} from "../config/Types";
import axios from "axios";
import {apiUrl} from "../config/api";

interface EnvelopeNotificationStatus
{
    notificationId: number;
    isRead: boolean;
    isAccepted: boolean;
    status: string;
}

class EnvelopeNotificationService {

    private static instance: EnvelopeNotificationService;

    private constructor(){

    }

    public static getInstance(): EnvelopeNotificationService {
        if (!EnvelopeNotificationService.instance) {
            EnvelopeNotificationService.instance = new EnvelopeNotificationService();
        }
        return EnvelopeNotificationService.instance;
    }

    public async sendEnvelopeAcceptNotification(notificationId: number) : Promise<EnvelopeNotificationStatus>
    {

        try
        {
            console.log('Notification Id: ', notificationId);
            const response = await axios.post(`${apiUrl}/envelope-notifications/send-accept/`, null,
            {params: {notificationId}}
            );
            console.log("Response: ", response);
            return response.data;
        }catch(error){
            console.error("There was an error sending the envelope accept notification: ", error);
            throw error;
        }
    }

    public async createNewEnvelopeNotifications(envelopeId: number, startDate: Date, endDate: Date) : Promise<EnvelopeNotification[]>
    {
        if(!envelopeId || !startDate || !endDate)
        {
            throw new Error('Invalid parameters. envelopeId, startDate, and endDate must be provided.');
        }
        try
        {
            const response = await axios.post<EnvelopeNotification[]>(`${apiUrl}/envelope-notifications/create-notifications`, null, {
                params: {
                    envelopeId: envelopeId,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            })
            return response.data;
        }catch(error){
            console.error("There was an error creating new envelope notifications: ", error);
            throw error;
        }
    }

    public async checkForNewAndPastDueNotifications(envelopeId: number, startDate: Date, endDate: Date) : Promise<Boolean>
    {
        if(!envelopeId || !startDate || !endDate)
        {
            throw new Error('Invalid parameters. envelopeId, startDate, and endDate must be provided.');
        }
        try
        {
            const response = await axios.get<EnvelopeNotification[]>(`${apiUrl}/envelope-notifications/check-for-new-and-past-due`, {
                params: {
                    envelopeId: envelopeId,
                    startDate: startDate.toISOString(),
                    endDate: endDate.toISOString()
                }
            })
           return response.data.length > 0;
        }catch(error){
            console.error("There was an error checking for new and past due notifications: ", error);
            throw error;
        }
    }

    public async getUserEnvelopeNotifications(userId: number) : Promise<EnvelopeNotification[]>
    {
        return [];
    }

    public async getEnvelopeNotificationById(notificationId: number) : Promise<EnvelopeNotification | null>
    {
        return null;
    }

    public async updateEnvelopeNotificationReadStatus(notificationId: number, readStatus: boolean) : Promise<boolean>
    {
        return false;
    }
}

export default EnvelopeNotificationService;
