import {BPTemplate, BudgetPlannerRequest} from "../config/Types";
import {API_BASE_URL} from "../config/api";
import axios from "axios";

class BudgetPlannerService {
    private static instance: BudgetPlannerService;

    private constructor() {
    }

    public static getInstance(): BudgetPlannerService {
        if (!BudgetPlannerService.instance) {
            BudgetPlannerService.instance = new BudgetPlannerService();
        }
        return BudgetPlannerService.instance;
    }

    public async updateTemplateCategories(templateId: number, userId: number) : Promise<BPTemplate>
    {
        try
        {
            const response = await axios.put<BPTemplate>(`${API_BASE_URL}/budget-planner/update-template-categories/${templateId}`,
                null, {params: {userId}});
            return response.data;
        }catch(error){
            console.error("There was an error updating the template categories: ", error);
            throw error;
        }
    }

    public async createBudgetTemplate(request: BudgetPlannerRequest): Promise<BPTemplate>
    {
        if (!request) {
            throw new Error("Request must not be null.");
        }
        if (request.userId < 1 || !Number.isInteger(request.userId)) {
            throw new Error("Invalid userId. UserId must be a positive integer.");
        }
        try {
            const response = await axios.post<BPTemplate>(`${API_BASE_URL}/budget-planner/create-template`, request);
            return response.data;
        } catch (error) {
            console.error("There was an error creating the budget template: ", error);
            throw error;
        }
    }

    public async fetchUserTemplates(userId: number): Promise<BPTemplate[]> {
        const response = await axios.get<BPTemplate[]>(
            `${API_BASE_URL}/budget-planner/templates/${userId}`
        );
        return response.data;
    }

    public async updateBudgetTemplate(id: number, request: BudgetPlannerRequest): Promise<BPTemplate> {
        if (!Number.isInteger(id) || id < 1) {
            throw new Error("Invalid id. Id must be a positive integer.");
        }
        if (!request) {
            throw new Error("Request must not be null.");
        }
        try {
            const response = await axios.put<BPTemplate>(`${API_BASE_URL}/budget-planner/${id}/update-template`,
                request
            );
            return response.data;
        } catch (error) {
            console.error("There was an error updating the budget template: ", error);
            throw error;
        }
    }

    public async createDefaultTemplate(userId: number) : Promise<BPTemplate>
    {
        try
        {
            console.log("Creating Default Template");
            const response = await axios.post<BPTemplate>(`${API_BASE_URL}/budget-planner/create-default/${userId}`, {userId});
            return response.data;
        }catch(error)
        {
            console.error("There was an error creating the default budget template: ", error);
            throw error;
        }
    }

    public async updateBudgetTemplateCategoryAmount(updatedAmount: number, startDate: string, endDate: string, userId: number, category: string): Promise<BPTemplate>
    {
        if (!Number.isInteger(userId) || userId < 1)
        {
            throw new Error("Invalid userId. UserId must be a positive integer.");
        }
        if (updatedAmount < 0) {
            throw new Error("Updated amount must be a positive number.");
        }
        if (!startDate || !endDate) {
            throw new Error("Start date and end date must not be empty.");
        }
        if (!category) {
            throw new Error("Category must not be empty.");
        }
        try
        {
            const response = await axios.put<BPTemplate>(`${API_BASE_URL}/budget-planner/update-category-amount`,
                null,
                {
                    params: {updatedAmount, startDate, endDate, userId, category},
                }
            );
            return response.data;
        } catch (error)
        {
            console.error(
                "There was an error updating the budget template category amount: ",
                error
            );
            throw error;
        }
    }

}
export default BudgetPlannerService;