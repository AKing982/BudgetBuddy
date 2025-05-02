package com.app.budgetbuddy.workbench.budget;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class BudgetCategoryBuilderFactory
{
    private final DailyBudgetCategoryBuilderService dailyService;
    private final MonthlyBudgetCategoryBuilderService monthlyService;

    @Autowired
    public BudgetCategoryBuilderFactory(final DailyBudgetCategoryBuilderService dailyService,
                                        final MonthlyBudgetCategoryBuilderService monthlyService)
    {
        this.dailyService = dailyService;
        this.monthlyService = monthlyService;
    }

    public AbstractBudgetCategoryBuilder<?> getBudgetCategoryBuilder(String period)
    {
        return switch (period) {
            case "Daily" -> dailyService;
            case "Monthly" -> monthlyService;
            default -> throw new IllegalArgumentException("Invalid period: " + period);
        };
    }
}
