package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPCategory;
import com.app.budgetbuddy.domain.BPTemplateDetail;
import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BudgetCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BPTemplateUpdaterService
{
    private BPCategoryService categoryService;
    private BudgetCategoryService budgetCategoryService;

    @Autowired
    public BPTemplateUpdaterService(BPCategoryService categoryService, BudgetCategoryService budgetCategoryService)
    {
        this.categoryService = categoryService;
        this.budgetCategoryService = budgetCategoryService;
    }

    private static final Set<String> SKIP_UPDATE = Set.of(
            "Salary", "Expenses", "Balance", "Extra", "Savings"
    );


    public List<BPCategory> updateBPCategories(BPTemplateDetail detail, Long userID)
    {
        log.info("Updating BPCategories for TemplateDetail: {}", detail);
        Long templateDetailId = detail.getId();
        List<BPCategory> bpCategories = categoryService.getCategoriesByTemplateDetailId(templateDetailId);
        if(bpCategories.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BPCategory> updatedCategories = new ArrayList<>();
        log.info("BP Categories: {}", bpCategories);
        for(BPCategory bpCategory : bpCategories)
        {
            if(SKIP_UPDATE.contains(bpCategory.getName()))
            {
                continue;
            }
            log.info("BP Category: {}", bpCategory);
            DateRange range = bpCategory.getRange();
            List<BudgetCategory> budgetCategories = budgetCategoryService.getBudgetCategoriesByDateRange(range.getStartDate(), range.getEndDate(), userID);
            budgetCategories.stream()
                    .filter(bc -> bc.getCategoryName().equalsIgnoreCase(bpCategory.getName()))
                    .findFirst()
                    .ifPresent(bc -> {
                        bpCategory.setActual(BigDecimal.valueOf(bc.getBudgetActual()));
                        updatedCategories.add(bpCategory);
                    });
        }
        categoryService.updateCategories(updatedCategories);
        return updatedCategories;
    }
}
