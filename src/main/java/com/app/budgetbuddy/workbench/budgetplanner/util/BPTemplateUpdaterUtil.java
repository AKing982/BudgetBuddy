package com.app.budgetbuddy.workbench.budgetplanner.util;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import lombok.extern.slf4j.Slf4j;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
public class BPTemplateUpdaterUtil
{
    public static Set<String> findExistingCategoriesWithinRange(List<BPCategory> existing)
    {
        return existing.stream()
                .map(bp -> bp.getRange().getStartDate() + "_" + bp.getRange().getEndDate() + "_" + bp.getName().toLowerCase())
                .collect(Collectors.toSet());
    }

    public static List<BPCategory> createUnmatchedBPCategories(List<BPCategory> existingBPCategories, List<BudgetCategory> budgetCategories, Long templateDetailId, List<BPColumn> columns)
    {
        if(existingBPCategories == null || existingBPCategories.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {

            if(templateDetailId == null)
            {
                throw new TemplateDetailException("Template detail id cannot be null");
            }
            if(budgetCategories == null || columns == null)
            {
                throw new DataException("Budget categories or BPColumns cannot be null");
            }
            if(budgetCategories.isEmpty() || columns.isEmpty())
            {
                return Collections.emptyList();
            }
            List<BPCategory> unmatchedBPCategories = new ArrayList<>();
            Set<BudgetCategory> unmatchedBudgetCategories = new HashSet<>();
            for(BPCategory existingCategory : existingBPCategories)
            {
                String bpCategoryName = existingCategory.getName();
                for(BudgetCategory budgetCategory : budgetCategories)
                {
                    if(!bpCategoryName.equalsIgnoreCase(budgetCategory.getCategoryName()))
                    {
                        unmatchedBudgetCategories.add(budgetCategory);
                    }
                }
            }

            for(BudgetCategory unmatchedBudgetCategory : unmatchedBudgetCategories)
            {
                String budgetCategoryName = unmatchedBudgetCategory.getCategoryName();
                Optional<BPColumn> column = findMatchingColumnForBudgetCategory(unmatchedBudgetCategory, columns);
                if(column.isEmpty())
                {
                    log.warn("No matching column found for budget category: {}", unmatchedBudgetCategory);
                    continue;
                }
                BPColumn matchingColumn = column.get();
                BPCategory bpCategory = new BPCategory();
                bpCategory.setActive(true);
                bpCategory.setRange(new DateRange(unmatchedBudgetCategory.getStartDate(), unmatchedBudgetCategory.getEndDate()));
                bpCategory.setType(BPType.BUDGET);
                bpCategory.setPlannedAmount(BigDecimal.ZERO);
                bpCategory.setName(budgetCategoryName);
                bpCategory.setBudgeted(BigDecimal.valueOf(unmatchedBudgetCategory.getBudgetedAmount()));
                bpCategory.setActual(unmatchedBudgetCategory.getBudgetActual() > 0 ? BigDecimal.valueOf(unmatchedBudgetCategory.getBudgetActual()) : BigDecimal.ZERO);
                bpCategory.setColumnIndex(matchingColumn.getColumnIndex());
                bpCategory.setTemplateDetailId(templateDetailId);
                bpCategory.setPlannedAmount(BigDecimal.ZERO);
                unmatchedBPCategories.add(bpCategory);
            }
                return unmatchedBPCategories;
        }catch(DataException e){
                log.error("There was an error creating unmatched budget categories: ", e);
                return Collections.emptyList();
        }
    }

    public static Map<FuturePeriodCategories, List<BPCategory>> getFutureCategoryByBPCategoryMap(List<BPCategory> bpCategories, List<FuturePeriodCategories> futureCategories, DateRange dateRange)
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

    public static BPColumn findMatchingColumnForBPCategory(List<BPCategory> categories, BPTemplateDetail detail)
    {
        List<BPColumn> columns = detail.getLayoutGrid().columns();
        return categories.stream()
                .map(category -> {
                    DateRange range = category.getRange();
                    return columns.stream()
                            .filter(col -> col.getDateRange().getStartDate().isEqual(range.getStartDate())
                                    && col.getDateRange().getEndDate().isEqual(range.getEndDate()))
                            .findFirst()
                            .orElse(null);
                })
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(null);
    }

    public static Optional<BPColumn> findMatchingColumnForBudgetCategory(BudgetCategory budgetCategory, List<BPColumn> columns)
    {
        if(budgetCategory == null || columns == null || columns.isEmpty())
        {
            return Optional.empty();
        }
        return columns.stream()
                .filter(col -> col.getDateRange().getStartDate().isEqual(budgetCategory.getStartDate())
                        && col.getDateRange().getEndDate().isEqual(budgetCategory.getEndDate()))
                .findFirst();
    }

    public static BPCategory buildNewBPCategory(FuturePeriodCategories fc, DateRange dateRange, BPColumn column, Long templateDetailId)
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


    public static Set<String> findMatchingFutureCategories(Map<FuturePeriodCategories, List<BPCategory>> futurePeriodCategoriesMap)
    {
        return futurePeriodCategoriesMap.keySet()
                .stream()
                .map(FuturePeriodCategories::category)
                .collect(Collectors.toSet());
    }

    public static List<FuturePeriodCategories> findUnmatchedFuturePeriodCategories(List<FuturePeriodCategories> futurePeriodCategories, Set<String> matchedCategories)
    {
        return futurePeriodCategories.stream()
                .filter(fc -> !matchedCategories.contains(fc.category()))
                .filter(fc -> BigDecimal.valueOf(fc.planned()).compareTo(BigDecimal.ZERO) != 0)
                .toList();
    }

}
