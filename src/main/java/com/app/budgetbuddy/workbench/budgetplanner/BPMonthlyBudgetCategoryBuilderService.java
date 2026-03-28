package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPBudgetCategoryService;
import com.app.budgetbuddy.services.BudgetCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BPMonthlyBudgetCategoryBuilderService implements BPBudgetCategoryBuilderService
{
    private final BPBudgetCategoryService bpBudgetCategoryService;
    private final BudgetCategoryService budgetCategoryService;
    private final PreCalculationEngine preCalculationEngine;

    @Autowired
    public BPMonthlyBudgetCategoryBuilderService(BPBudgetCategoryService bpBudgetCategoryService,
                                                 BudgetCategoryService budgetCategoryService,
                                                 PreCalculationEngine preCalculationEngine)
    {
        this.bpBudgetCategoryService = bpBudgetCategoryService;
        this.budgetCategoryService = budgetCategoryService;
        this.preCalculationEngine = preCalculationEngine;
    }

    @Override
    public List<BPBudgetCategory> buildBPBudgetCategories(List<BudgetCategory> budgetCategories, SubBudget subBudget)
    {
        return List.of();
    }

    @Override
    public BPBudgetCategory saveBPBudgetCategory(BPBudgetCategory budgetCategory) {
        return null;
    }
}
