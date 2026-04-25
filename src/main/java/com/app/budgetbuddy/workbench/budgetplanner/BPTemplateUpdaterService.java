package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BudgetCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

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

    private Map<FuturePeriodCategories, List<BPCategory>> getFutureCategoryByBPCategoryMap(List<BPCategory> bpCategories, List<FuturePeriodCategories> futureCategories, DateRange dateRange)
    {
        Map<FuturePeriodCategories, List<BPCategory>> result = new HashMap<>();
        Map<String, FuturePeriodCategories> categoryNames = new HashMap<>();
        for(FuturePeriodCategories futureCategory : futureCategories)
        {
            categoryNames.put(futureCategory.category(), futureCategory);
        }
        bpCategories.stream()
                .filter(d -> d.getRange().getStartDate().isEqual(dateRange.getStartDate()) && d.getRange().getEndDate().isEqual(dateRange.getEndDate()))
                .filter(bp -> categoryNames.containsKey(bp.getName()))
                .forEach(bp -> result
                        .computeIfAbsent(categoryNames.get(bp.getName()), k -> new ArrayList<>())
                        .add(bp));
        return result;
    }

    public List<BPCategory> updateFuturePeriodBPCategories(BPTemplateDetail detail, List<FuturePeriodCategories> categories, DateRange dateRange)
    {
        Long templateDetailId = detail.getId();
        List<BPCategory> bpCategories = categoryService.getCategoriesByTemplateDetailId(templateDetailId);
        if(bpCategories.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BPCategory> updatedCategories = new ArrayList<>();
        Map<FuturePeriodCategories, List<BPCategory>> futureCategoryByBPCategoryMap = getFutureCategoryByBPCategoryMap(bpCategories, categories, dateRange);
        log.info("futureCategoryByBPCategoryMap size: {}", futureCategoryByBPCategoryMap.size());
        for(Map.Entry<FuturePeriodCategories, List<BPCategory>> entry : futureCategoryByBPCategoryMap.entrySet())
        {
            FuturePeriodCategories futurePeriodCategories = entry.getKey();
            List<BPCategory> bpCategoryList = entry.getValue();
            BigDecimal planned = BigDecimal.valueOf(futurePeriodCategories.planned());
            for(BPCategory bpCategory : bpCategoryList)
            {
                BigDecimal existingPlannedAmount = bpCategory.getPlannedAmount();
                log.info("  category={} start={} end={} existingPlanned={} incomingPlanned={}",
                        bpCategory.getName(),
                        bpCategory.getRange().getStartDate(),
                        bpCategory.getRange().getEndDate(),
                        existingPlannedAmount,
                        planned);
                if(existingPlannedAmount == null || existingPlannedAmount.compareTo(BigDecimal.ZERO) == 0)
                {
                    bpCategory.setPlannedAmount(planned);
                    updatedCategories.add(bpCategory);
                }
            }
        }
        log.info("Updated Categories: {}", updatedCategories);
        if(!updatedCategories.isEmpty())
        {
            categoryService.updateCategoryPlannedAmounts(updatedCategories);
        }
        return updatedCategories;
    }


    private List<BPCategory> createMissingFuturePeriodBPCategories(List<FuturePeriodCategories> unmatched, DateRange dateRange, List<BPColumn> columns, Long templateDetailId)
    {
        if(unmatched.isEmpty()) return Collections.emptyList();
        BPColumn matchingColumn = columns.stream()
                .filter(col -> col.getDateRange().getStartDate().isEqual(dateRange.getStartDate())
                        && col.getDateRange().getEndDate().isEqual(dateRange.getEndDate()))
                .findFirst()
                .orElse(null);
        if(matchingColumn == null)
        {
            log.warn("No matching column found for date range: {}", dateRange);
            return Collections.emptyList();
        }
        List<BPCategory> newCategories = unmatched.stream()
                .map(fc -> buildNewBPCategory(fc, dateRange, matchingColumn, templateDetailId))
                .toList();
        categoryService.saveNewTemplateCategories(newCategories, templateDetailId);
        return newCategories;
    }

    private BPCategory buildNewBPCategory(FuturePeriodCategories fc, DateRange dateRange, BPColumn column, Long templateDetailId)
    {
        BPCategory category = new BPCategory();
        category.setName(fc.category());
        category.setTemplateDetailId(templateDetailId);
        category.setRange(dateRange);
        category.setPlannedAmount(BigDecimal.valueOf(fc.planned()));
        category.setActual(BigDecimal.ZERO);
        category.setBudgeted(BigDecimal.ZERO);
        category.setType(BPType.BUDGET);
        category.setBudgeted(BigDecimal.ZERO);
        category.setColumnIndex(column.getColumnIndex());
        return category;
    }

    private List<BPCategory> updateExistingFuturePeriodBPCategories(Map<FuturePeriodCategories, List<BPCategory>> futurePeriodCategoriesMap)
    {
        List<BPCategory> updatedCategories = new ArrayList<>();
        for(Map.Entry<FuturePeriodCategories, List<BPCategory>> entry : futurePeriodCategoriesMap.entrySet())
        {
            FuturePeriodCategories futurePeriodCategories = entry.getKey();
            BigDecimal planned = BigDecimal.valueOf(futurePeriodCategories.planned());
            List<BPCategory> bpCategories = entry.getValue();
            for(BPCategory bpCategory : bpCategories)
            {
                BigDecimal existingPlanned = bpCategory.getPlannedAmount();
                if(planned.compareTo(BigDecimal.ZERO) != 0 && (existingPlanned == null || existingPlanned.stripTrailingZeros().compareTo(planned.stripTrailingZeros()) != 0))
                {
                    bpCategory.setPlannedAmount(planned);
                    updatedCategories.add(bpCategory);
                }
            }
        }
        if(!updatedCategories.isEmpty())
        {
            categoryService.updateCategoryPlannedAmounts(updatedCategories);
        }
        return updatedCategories;
    }

    public List<BPCategory> updateBPCategories(BPTemplateDetail detail, Long userID, boolean isIncomeTemplate)
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
        Map<String, List<BudgetCategory>> budgetCategoryCache = new HashMap<>();
        for(BPCategory bpCategory : bpCategories)
        {
            if(SKIP_UPDATE.contains(bpCategory.getName()))
            {
                continue;
            }
            DateRange range = bpCategory.getRange();
            String cacheKey = range.getStartDate() + "_" + range.getEndDate();
            List<BudgetCategory> budgetCategories = budgetCategoryCache.computeIfAbsent(cacheKey, k ->
                    isIncomeTemplate
                            ? budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(range.getStartDate(), range.getEndDate(), userID)
                            : budgetCategoryService.getBudgetCategoriesByDateRange(range.getStartDate(), range.getEndDate(), userID)
            );
            budgetCategories.stream()
                    .filter(bc -> bc.getCategoryName().equalsIgnoreCase(bpCategory.getName()))
                    .findFirst()
                    .ifPresent(bc -> {
                        BigDecimal incoming = BigDecimal.valueOf(bc.getBudgetActual());
                        BigDecimal existing = bpCategory.getActual();
                        if(incoming.compareTo(BigDecimal.ZERO) == 0) return;
                        if(existing == null || existing.compareTo(BigDecimal.ZERO) == 0 || incoming.compareTo(existing) != 0)
                        {
                            log.info("Updating category={} range={} to {} | existing={} incoming={}",
                                    bpCategory.getName(),
                                    range.getStartDate(),
                                    range.getEndDate(),
                                    existing,
                                    incoming);
                            bpCategory.setActual(incoming);
                            updatedCategories.add(bpCategory);
                        }
                    });
        }
        if(!updatedCategories.isEmpty())
        {
            categoryService.updateCategories(updatedCategories);
        }
        return updatedCategories;
    }
}
