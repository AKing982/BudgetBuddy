package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPBudgetCategory;
import com.app.budgetbuddy.domain.BudgetCategory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class BPBudgetCategoryConverter implements Converter<BudgetCategory, BPBudgetCategory>
{

    @Override
    public BPBudgetCategory convert(BudgetCategory budgetCategory)
    {
        BPBudgetCategory bpBudgetCategory = new BPBudgetCategory();
        bpBudgetCategory.setCategory(budgetCategory.getCategoryName());
        bpBudgetCategory.setId(budgetCategory.getId());
        bpBudgetCategory.setBudgetedAmount(BigDecimal.valueOf(budgetCategory.getBudgetedAmount()));
        bpBudgetCategory.setOverBudget(budgetCategory.isOverSpent());
        bpBudgetCategory.setActualAmount(BigDecimal.valueOf(budgetCategory.getBudgetActual()));
        bpBudgetCategory.setStartDate(budgetCategory.getStartDate());
        bpBudgetCategory.setEndDate(budgetCategory.getEndDate());
        bpBudgetCategory.setPlannedAmount(BigDecimal.ZERO);
        return bpBudgetCategory;
    }
}
