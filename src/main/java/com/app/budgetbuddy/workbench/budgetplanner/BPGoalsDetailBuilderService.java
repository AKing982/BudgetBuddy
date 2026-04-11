package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BPGoalsDetailBuilderService
{
    private final BudgetGoalsService budgetGoalsService;
    private final SubBudgetGoalsService subBudgetGoalsService;

    @Autowired
    public BPGoalsDetailBuilderService(SubBudgetGoalsService subBudgetGoalsService,
                                       BudgetGoalsService budgetGoalsService)
    {
        this.subBudgetGoalsService = subBudgetGoalsService;
        this.budgetGoalsService = budgetGoalsService;
    }

    public BPGoalsDetail buildGoalsDetail(BPTemplateType templateType, List<BPCategory> categories)
    {
        return null;
    }
}
