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
            const response = await axios.post(`${apiUrl}envelope-notifications/send-accept/`, {
                params: notificationId
            });
            console.log("Response: ", response);
            return response.data;
        }catch(error){
            console.error("There was an error sending the envelope accept notification: ", error);
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
