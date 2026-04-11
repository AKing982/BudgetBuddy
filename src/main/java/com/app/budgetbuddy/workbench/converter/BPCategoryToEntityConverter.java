package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPCategory;
import com.app.budgetbuddy.domain.BPType;
import com.app.budgetbuddy.entities.BPCategoryEntity;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import com.app.budgetbuddy.repositories.BPCategoryGroupRepository;
import com.app.budgetbuddy.repositories.BPColumnRepository;
import com.app.budgetbuddy.repositories.BPTemplateDetailsRepository;
import com.app.budgetbuddy.services.BudgetCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
public class BPCategoryToEntityConverter implements Converter<BPCategory, BPCategoryEntity>
{
    private final BPColumnRepository bpColumnRepository;
    private final BPTemplateDetailsRepository bpTemplateDetailsRepository;
    private final BPCategoryGroupRepository bpCategoryGroupRepository;
    private final BudgetCategoryService budgetCategoryService;

    @Autowired
    public BPCategoryToEntityConverter(BPColumnRepository bpColumnRepository,
                                       BPTemplateDetailsRepository bpTemplateDetailsRepository,
                                       BPCategoryGroupRepository bpCategoryGroupRepository,
                                       BudgetCategoryService budgetCategoryService)
    {
        this.bpColumnRepository = bpColumnRepository;
        this.bpTemplateDetailsRepository = bpTemplateDetailsRepository;
        this.bpCategoryGroupRepository = bpCategoryGroupRepository;
        this.budgetCategoryService = budgetCategoryService;
    }

    @Override
    public BPCategoryEntity convert(BPCategory budgetCategory)
    {
        if(budgetCategory == null)
        {
            return null;
        }
        BPColumnEntity columnEntity = bpColumnRepository.findByColumnIndexAndStartDateAndEndDate(
                budgetCategory.getColumnIndex(),
                budgetCategory.getRange().getStartDate(),
                budgetCategory.getRange().getEndDate()
        );
        BudgetCategoryEntity budgetCategoryEntity = getBudgetCategory(budgetCategory);
        BPCategoryEntity bpCategoryEntity = new BPCategoryEntity();
        bpCategoryEntity.setBpColumn(columnEntity);
        bpCategoryEntity.setBudgetCategory(budgetCategoryEntity);
        bpCategoryEntity.setOverBudget(budgetCategory.isOverBudget());
        bpCategoryEntity.setStartDate(budgetCategory.getRange().getStartDate());
        bpCategoryEntity.setEndDate(budgetCategory.getRange().getEndDate());
        bpCategoryEntity.setActualAmount(budgetCategory.getActual());
        bpCategoryEntity.setBudgetedAmount(budgetCategory.getBudgeted());
        bpCategoryEntity.setCategoryGroup(null);
        bpCategoryEntity.setPlannedAmount(BigDecimal.ZERO);
        return bpCategoryEntity;
    }

    private BudgetCategoryEntity getBudgetCategory(BPCategory category)
    {
        if(category.isGroupHeader() || category.getType() != BPType.BUDGET)
        {
            return null;
        }
        if(category.getBudgetCategoryId() == null)
        {
            return null;  // predicted future category — no real entity exists yet
        }
        return budgetCategoryService.findById(category.getBudgetCategoryId())
                .orElse(null);
    }
}
