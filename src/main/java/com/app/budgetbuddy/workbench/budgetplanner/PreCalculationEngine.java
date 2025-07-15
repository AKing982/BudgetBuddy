package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.DateRange;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PreCalculationEngine
{
    private final PreCalculationThreadService preCalculationThreadService;

    @Autowired
    public PreCalculationEngine(PreCalculationThreadService preCalculationThreadService)
    {
       this.preCalculationThreadService = preCalculationThreadService;
    }

    public int calculateNumberOfBudgetMonths(Long subBudgetId)
    {
        return 0;
    }

    public List<BudgetCategory> getBudgetCategoriesByDateRange(DateRange dateRange, Long budgetId)
    {
        return null;
    }

    public Map<String, List<BudgetCategory>>
}
