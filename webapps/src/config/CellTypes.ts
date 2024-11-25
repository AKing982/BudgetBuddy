interface Cell {
    id: string;
    value: string | number;
    formula?: string;
    editable: boolean;
    format?: CellFormat;
}

type CellType = 'label' | 'calculation' | 'category' | 'expense' | 'reference' | 'income' | 'grocery' | 'percentage' | 'balance' | 'currency';

interface IncomeCell extends Cell {
    type: 'Income';
    frequency: 'one-time' | 'weekly' | 'biweekly' | 'monthly';
    nextDate?: Date;
    source?: string;
    grossAmount?: number;
    netAmount?: number;
}

interface LabelCell extends Cell {
    type: 'label';
    description?: string;
    cellFormat: CellFormat;
}

interface GroceryCell extends Cell {
    type: 'grocery';

    item: {
        name: string;
        category: string;
        brand?: string;
        unit: string;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
    };

    store: {
        name: string;
        location?: string;
        purchaseDate?: Date;
        receiptId?: string;
    };

    budgetImpact?: {
        category: string;
        impact: 'high' | 'medium' | 'low';
        percentageOfCategory: number;
        trend?: 'increasing' | 'decreasing' | 'stable';
    };

    priceHistory: Array<{
        date: Date;
        store: string;
        unitPrice: number;
        quantity: number;
        totalPrice: number;
    }>;

    frequency: {
        purchaseFrequency: 'one-time' | 'weekly' | 'daily' | 'biweekly' | 'monthly';
        lastPurchased?: Date;
        nextPurchase?: Date;
        isRegularItem: boolean;
    };

    shoppingList?: {
        isOnList: boolean;
        quantity: number;
        priority: 'high' | 'medium' | 'low';
        notes?: string;
    };

    alerts?: {
        priceIncrease?: number;

    }


}

interface PercentageCell extends Cell {
    type: 'percentage';
    baseValue: number;
    percentageOf: string;
    calculationType: 'of' | 'increase' | 'decrease' | 'ratio';
    calculationMethod: {
        type: 'direct' | 'relative' | 'cumulative';
        compareWith?: string;
        period?: 'previous' | 'same-last-year' | 'average';
    };

    display: {
        asDecimal: boolean;
        showSymbol: boolean;
        decimalPlaces: number;
    };

    ColorFormat: {
        positiveColor?: boolean;
        negativeColor?: boolean;
    };
}

interface ExpenseCell extends Cell {
    type: 'expense';
    amount: number;
    date?: Date;
    category: string;
    expenseType: 'fixed' | 'variable' | 'recurring' | 'one-time';
    status: 'pending' | 'paid' | 'scheduled' | 'overdue';

    payment: {
        method: 'cash' | 'credit' | 'debit' | 'other';
        account?: string;
        dueDate?: Date;
        paidDate?: Date;
        recurringDetails?: {
            frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
            nextDueDate: Date;
            autoPay?: boolean;
        };
    };

    budget: {
        budgetId: number;
        categoryBudget: number;
        remainingBudget: number;
        percentOfBudget: number;
        overBudget: boolean;

    };

    alerts?: {
        reminderDays: number;
        notifyOnDue: boolean;
        notifyOnOverBudget: boolean;
        customAlerts?: Array<{
            condition: string;
            message: string;
        }>;
    };

}

interface CategoryCell extends Cell {
    type: 'category';
    name: string;
    budgetLimit: number;
    spent: number;
    remaining: number;
    subcategories?: string[];
}

interface FormulaCell extends Cell {
    type: 'formula';
    formula: string;
    referenceCells: string[];
    calculatedValue: number;
    autoUpdate: boolean;
    errorHandling?: {
        fallbackValue: number;
        errorMessage?: string;
    };
}

interface RecurringCell extends Cell {
    type: 'recurring';
    frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'yearly';
    startDate: Date;
    endDate?: Date;
    amount: number;
    category: string;
    description?: string;
    reminder?: {
        enabled: boolean;
        daysBeforeDue: number;
    };

}

interface ReferenceCell extends Cell {
    type: 'reference';
    reference: string;
    referenceType: 'single' | 'range';
    referenceValue: 'value' | 'formula' | 'category' | 'total';
    isValid: boolean;
    referencePath?: {
        sheet?: string;
        category?: string;
        period?: string;
    };
}




interface CellFormat {
    numberFormat?:{
        type: 'currency' | 'decimal' | 'percentage' | 'integer';
        currency?: string;
        locale?: string;
        decimals: number;
    };

    dateFormat?: {
        format: 'short' | 'medium' | 'long' | 'custom';
        customFormat?: string;
        includeTime?: boolean;
        timeFormat?: '12h' | '24h';
    };

    visualFormatting: {
        textAlign: 'left' | 'center' | 'right';
        fontStyle: {
            bold?: boolean;
            italic?: boolean;
            underline?: boolean;
            strikethrough?: boolean;
        };
        fontSize?: 'small' | 'medium' | 'large';
        color?: string;
    };

    conditionalFormatting: {
        conditions: Array<{
            rule: {
                type: 'greater' | 'less' | 'equal' | 'between' | 'contains';
                value: number | string | [number, number];
                compareWith?: string;
            };
            format: {
                color?: string;
                backgroundColor?: string;
                bold?: boolean;
                italic?: boolean;
            };
        }>;
    };
}


