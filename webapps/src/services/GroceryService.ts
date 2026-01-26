import {
    BudgetComparison,
    BudgetPeriod,
    BudgetStatistics,
    GroceryBudget,
    GroceryItem,
    GroceryPurchase,
    SpendingInsight
} from "../config/Types";
import axios from "axios";



class GroceryService {
    static async createBudget(budget: GroceryBudget): Promise<GroceryBudget> {
        const response = await axios.post('/api/grocery/budgets', budget);
        return response.data;
    }

    static async getBudgets(month?: string): Promise<GroceryBudget[]> {
        const response = await axios.get('/api/grocery/budgets', {
            params: { month }
        });
        return response.data;
    }

    static async getBudgetById(id: string): Promise<GroceryBudget> {
        const response = await axios.get(`/api/grocery/budgets/${id}`);
        return response.data;
    }

    static async updateBudget(id: string, budget: Partial<GroceryBudget>): Promise<GroceryBudget> {
        const response = await axios.put(`/api/grocery/budgets/${id}`, budget);
        return response.data;
    }

    static async deleteBudget(id: string): Promise<void> {
        await axios.delete(`/api/grocery/budgets/${id}`);
    }

    static async addManualPurchase(budgetId: number, items: GroceryItem[]): Promise<GroceryPurchase> {
        const response = await axios.post(`/api/grocery/budgets/${budgetId}/purchases`, { items });
        return response.data;
    }

    static async uploadReceipt(budgetId: number, file: File): Promise<GroceryPurchase> {
        const formData = new FormData();
        formData.append('receipt', file);
        const response = await axios.post(`/api/grocery/budgets/${budgetId}/receipts`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    }

    static async getPurchases(budgetId: number): Promise<GroceryPurchase[]> {
        const response = await axios.get(`/api/grocery/budgets/${budgetId}/purchases`);
        return response.data;
    }

    static async getBudgetStatistics(budgetId: number): Promise<BudgetStatistics> {
        const response = await axios.get(`/api/grocery/budgets/${budgetId}/statistics`);
        return response.data;
    }

    static async compareBudgets(budgetId1: number, budgetId2: number): Promise<BudgetComparison> {
        const response = await axios.get('/api/grocery/budgets/compare', {
            params: { budget1: budgetId1, budget2: budgetId2 }
        });
        return response.data;
    }

    static async getSpendingInsights(budgetId: number, period: BudgetPeriod): Promise<SpendingInsight[]> {
        const response = await axios.get(`/api/grocery/budgets/${budgetId}/insights`, {
            params: { period }
        });
        return response.data;
    }

    static async attachTransaction(budgetId: number, transactionId: string): Promise<void> {
        await axios.post(`/api/grocery/budgets/${budgetId}/transactions/${transactionId}`);
    }
}

export default GroceryService;