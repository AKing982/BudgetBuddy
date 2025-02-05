package com.app.budgetbuddy.workbench.subBudget;

import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.workbench.converter.SubBudgetEntityConverter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static com.app.budgetbuddy.workbench.budget.BudgetUtil.convertSubBudgetsToEntities;

@Component
public class SubBudgetConverterUtil
{
    private SubBudgetEntityConverter subBudgetEntityConverter;

    @Autowired
    public SubBudgetConverterUtil(SubBudgetEntityConverter subBudgetEntityConverter)
    {
        this.subBudgetEntityConverter = subBudgetEntityConverter;
    }

    public List<SubBudget> convertSubBudgetEntities(List<SubBudgetEntity> subBudgetEntities)
    {
        return subBudgetEntities.stream()
                .map(subBudgetEntityConverter::convert)
                .toList();
    }

    public Set<SubBudgetEntity> convertSubBudgetToEntities(List<SubBudget> subBudgets)
    {
       List<SubBudgetEntity> subBudgetEntities = new ArrayList<>();
       return convertSubBudgetsToEntities(subBudgets);
    }

}
