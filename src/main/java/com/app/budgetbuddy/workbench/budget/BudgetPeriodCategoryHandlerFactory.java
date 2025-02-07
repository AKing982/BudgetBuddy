package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.Period;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class BudgetPeriodCategoryHandlerFactory
{
    private final MonthlyBudgetPeriodCategoryHandler monthlyHandler;
    private final WeeklyBudgetPeriodCategoryHandler weeklyHandler;
    private final DailyBudgetPeriodCategoryHandler dailyHandler;
    private final BiWeeklyBudgetPeriodCategoryHandler biWeeklyHandler;

    @Autowired
    public BudgetPeriodCategoryHandlerFactory(MonthlyBudgetPeriodCategoryHandler monthlyHandler,
                                              WeeklyBudgetPeriodCategoryHandler weeklyHandler,
                                              BiWeeklyBudgetPeriodCategoryHandler biWeeklyHandler,
                                              DailyBudgetPeriodCategoryHandler dailyHandler)
    {
        this.monthlyHandler = monthlyHandler;
        this.weeklyHandler = weeklyHandler;
        this.dailyHandler = dailyHandler;
        this.biWeeklyHandler = biWeeklyHandler;
    }

    public BudgetPeriodCategoryHandler getHandler(Period period)
    {
        log.info("Getting budget period handler for period: {}", period.toString());
        return switch (period) {
            case MONTHLY -> monthlyHandler;
            case WEEKLY -> weeklyHandler;
            case BIWEEKLY -> biWeeklyHandler;
            case DAILY -> dailyHandler;
            default -> throw new IllegalArgumentException("Unsupported period type: " + period);
        };
    }
}
