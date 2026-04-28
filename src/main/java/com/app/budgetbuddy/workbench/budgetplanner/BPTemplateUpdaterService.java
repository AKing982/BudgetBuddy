package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BudgetCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;

import static com.app.budgetbuddy.workbench.budgetplanner.util.BPTemplateUpdaterUtil.*;

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

    List<BPCategory> updateFuturePeriodBPCategories(BPTemplateDetail detail, List<FuturePeriodCategories> categories, DateRange dateRange)
    {
        Long templateDetailId = detail.getId();
        List<BPCategory> bpCategories = categoryService.getCategoriesByTemplateDetailId(templateDetailId);
        if (bpCategories.isEmpty()) {
            return Collections.emptyList();
        }
        List<BPCategory> updatedCategories = new ArrayList<>();
        List<BPColumn> columns = detail.getLayoutGrid().columns();
        Map<FuturePeriodCategories, List<BPCategory>> futureCategoryByBPCategoryMap = getFutureCategoryByBPCategoryMap(bpCategories, categories, dateRange);
        log.info("futureCategoryByBPCategoryMap size: {}", futureCategoryByBPCategoryMap.size());
        List<BPCategory> updatedFuturePeriodCategories = updateExistingFuturePeriodBPCategories(futureCategoryByBPCategoryMap);
        List<BPCategory> createdFuturePeriodCategories = createMissingFuturePeriodBPCategories(findUnmatchedFuturePeriodCategories(categories, findMatchingFutureCategories(futureCategoryByBPCategoryMap)), dateRange, columns, templateDetailId);
        updatedCategories.addAll(updatedFuturePeriodCategories);
        updatedCategories.addAll(createdFuturePeriodCategories);
        return updatedCategories;
    }

    List<BPCategory> updateExistingFuturePeriodBPCategories(Map<FuturePeriodCategories, List<BPCategory>> futurePeriodCategoriesMap)
    {
        List<BPCategory> updatedCategories = new ArrayList<>();
        for (Map.Entry<FuturePeriodCategories, List<BPCategory>> entry : futurePeriodCategoriesMap.entrySet()) {
            FuturePeriodCategories futurePeriodCategories = entry.getKey();
            BigDecimal planned = BigDecimal.valueOf(futurePeriodCategories.planned());
            List<BPCategory> bpCategories = entry.getValue();
            for (BPCategory bpCategory : bpCategories) {
                BigDecimal existingPlanned = bpCategory.getPlannedAmount();
                if (planned.compareTo(BigDecimal.ZERO) != 0 && (existingPlanned == null || existingPlanned.stripTrailingZeros().compareTo(planned.stripTrailingZeros()) != 0)) {
                    bpCategory.setPlannedAmount(planned);
                    updatedCategories.add(bpCategory);
                }
            }
        }
        if (!updatedCategories.isEmpty()) {
            categoryService.updateCategoryPlannedAmounts(updatedCategories);
        }
        return updatedCategories;
    }

    List<BPCategory> createMissingFuturePeriodBPCategories(List<FuturePeriodCategories> unmatched, DateRange dateRange, List<BPColumn> columns, Long templateDetailId)
    {
        if (unmatched.isEmpty()) return Collections.emptyList();
        BPColumn matchingColumn = columns.stream()
                .filter(col -> col.getDateRange().getStartDate().isEqual(dateRange.getStartDate())
                        && col.getDateRange().getEndDate().isEqual(dateRange.getEndDate()))
                .findFirst()
                .orElse(null);
        if (matchingColumn == null) {
            log.warn("No matching column found for date range: {}", dateRange);
            return Collections.emptyList();
        }
        List<BPCategory> newCategories = unmatched.stream()
                .map(fc -> buildNewBPCategory(fc, dateRange, matchingColumn, templateDetailId))
                .toList();
        categoryService.saveNewTemplateCategories(newCategories, templateDetailId);
        return newCategories;
    }

    public List<BPCategory> updateBPCategories(BPTemplateDetail detail, Long userID, boolean isIncomeTemplate)
    {
        log.info("Updating BPCategories for TemplateDetail: {}", detail);
        try
        {
            if(detail == null)
            {
                throw new TemplateDetailException("TemplateDetail cannot be null");
            }
            Long templateDetailId = detail.getId();
            List<BPCategory> bpCategories = categoryService.getCategoriesByTemplateDetailId(templateDetailId);
            List<BPCategory> updatedCategories = new ArrayList<>();
            if(bpCategories.isEmpty())
            {
                return Collections.emptyList();
            }
            long start = System.currentTimeMillis();
            log.info("Start Time: {} | BP Categories: {}", start, bpCategories);
            for(BPCategory bpCategory : bpCategories)
            {
                if(bpCategory == null)
                {
                    log.info("Found null BPCategory");
                    continue;
                }
                DateRange range = bpCategory.getRange();
                if(range == null)
                {
                    log.info("Found null DateRange for BPCategory: {}", bpCategory.getName());
                    continue;
                }
                List<BudgetCategory> budgetCategories = isIncomeTemplate ? budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(range.getStartDate(), range.getEndDate(), userID) : budgetCategoryService.getBudgetCategoriesByDateRange(range.getStartDate(), range.getEndDate(), userID);
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
            long end = System.currentTimeMillis();
            log.info("End Time: {} | Total Time: {}ms", end, end - start);
            return updatedCategories;

        }catch(TemplateDetailException e){
            return Collections.emptyList();
        }
    }

}

