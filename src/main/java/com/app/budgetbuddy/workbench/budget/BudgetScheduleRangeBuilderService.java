package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.services.BudgetScheduleRangeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class BudgetScheduleRangeBuilderService
{
    private final BudgetScheduleRangeService budgetScheduleRangeService;

    @Autowired
    public BudgetScheduleRangeBuilderService(BudgetScheduleRangeService budgetScheduleRangeService)
    {
        this.budgetScheduleRangeService = budgetScheduleRangeService;
    }
}
