import axios, {AxiosInstance} from "axios";
import BudgetRunnerService from "./BudgetRunnerService";
import {BudgetRegistration} from "../utils/Items";


class BudgetSetupService
{
    private static instance: BudgetSetupService;
    private static axios: AxiosInstance;

    constructor(){
        BudgetSetupService.axios = axios.create({
            baseURL: 'http://localhost:8080/api/budgetSetup/',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    public static getInstance() : BudgetSetupService
    {
        if(!BudgetSetupService.instance){
            BudgetSetupService.instance = new BudgetSetupService();
        }
        return BudgetSetupService.instance;
    }

    public async getBudgetSetupResponse(userId: number, budgetRegistration: BudgetRegistration)
    {
        return null;
    }


}