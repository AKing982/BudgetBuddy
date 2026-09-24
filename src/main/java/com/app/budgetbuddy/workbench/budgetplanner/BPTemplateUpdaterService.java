package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.workbench.budgetplanner.util.BPTemplateUpdaterUtil;
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

    List<BPCategory> updateFuturePeriodBPCategories(BPTemplateDetail detail, List<FuturePeriodCategories> categories)
    {
//        Long templateDetailId = detail.getId();
//        List<BPCategory> bpCategories = categoryService.getCategoriesByTemplateDetailId(templateDetailId);
//        if (bpCategories.isEmpty()) {
//            return Collections.emptyList();
//        }
//        List<BPCategory> updatedCategories = new ArrayList<>();
//        List<BPColumn> columns = detail.getLayoutGrid().columns();
//        Map<FuturePeriodCategories, List<BPCategory>> futureCategoryByBPCategoryMap = getFutureCategoryByBPCategoryMap(bpCategories, categories, dateRange);
//        log.info("futureCategoryByBPCategoryMap size: {}", futureCategoryByBPCategoryMap.size());
//        List<BPCategory> updatedFuturePeriodCategories = updateExistingFuturePeriodBPCategories(futureCategoryByBPCategoryMap);
//        List<BPCategory> createdFuturePeriodCategories = createMissingFuturePeriodBPCategories(findUnmatchedFuturePeriodCategories(categories, findMatchingFutureCategories(futureCategoryByBPCategoryMap)), dateRange, columns, templateDetailId);
//        updatedCategories.addAll(updatedFuturePeriodCategories);
//        updatedCategories.addAll(createdFuturePeriodCategories);
//        return updatedCategories;
        return null;
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

    public List<BPCategory> createUnmatchedBPCategories(final BPTemplateDetail templateDetail, boolean isIncomeTemplate, Long userID)
    {
        if(templateDetail == null)
        {
            return Collections.emptyList();
        }
        try
        {
            Long templateDetailId = templateDetail.getId();
            List<BPCategory> bpCategories = categoryService.getCategoriesByTemplateDetailId(templateDetailId);
            List<BudgetCategory> budgetCategories = new ArrayList<>();
            if(bpCategories.isEmpty())
            {
                return Collections.emptyList();
            }
            for(BPCategory bpCategory : bpCategories)
            {
                if(bpCategory == null)
                {
                    continue;
                }
                DateRange range = bpCategory.getRange();
                budgetCategories = isIncomeTemplate ? budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(range.getStartDate(), range.getEndDate(), userID, false) : budgetCategoryService.getBudgetCategoriesByDateRange(range.getStartDate(), range.getEndDate(), userID);
            }
            return BPTemplateUpdaterUtil.createUnmatchedBPCategories(bpCategories, budgetCategories, templateDetailId, templateDetail.getLayoutGrid().columns());

        }catch(DataException e){
            log.error("Error creating new missing BPCategories: ", e);
            return Collections.emptyList();
        }
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
            log.info("BP Categories: {}", bpCategories);
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
                BigDecimal existing = Objects.requireNonNullElse(bpCategory.getActual(), BigDecimal.ZERO);
                // Fetch budget category/transaction category data for standard bp categories
                List<BudgetCategory> budgetCategories = isIncomeTemplate ? budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(range.getStartDate(), range.getEndDate(), userID, false) : budgetCategoryService.getBudgetCategoriesByDateRange(range.getStartDate(), range.getEndDate(), userID);
                log.info("Budget Categories: {}", budgetCategories);
                budgetCategories.stream()
                        .filter(bc -> bc.getCategoryName().equalsIgnoreCase(bpCategory.getName()))
                        .filter(obj -> Objects.nonNull(obj.getBudgetActual()))
                        .findFirst()
                        .ifPresent(bc -> {
                            log.info("Current BP Category: {}", bpCategory);
                            BigDecimal incoming = BigDecimal.valueOf(bc.getBudgetActual());

                            double existingAsDouble = existing.doubleValue();
                            log.info("Existing: {}", existingAsDouble);
                            double incomingAsDouble = incoming.doubleValue();
                            log.info("Incoming: {}", incomingAsDouble);
                            if(existingAsDouble < incomingAsDouble || incomingAsDouble < existingAsDouble)
                            {
                                log.info("Updating category={} range={} to {} | existing={} incoming={}",
                                        bpCategory.getName(),
                                        range.getStartDate(),
                                        range.getEndDate(),
                                        existing,
                                        incoming);
                                bpCategory.setActual(incoming);
                                if(bc.getCategoryName().equalsIgnoreCase("Salary"))
                                {
                                    bpCategory.setType(BPType.INCOME);
                                }
                                updatedCategories.add(bpCategory);
                            }
                        });
            }
            long end = System.currentTimeMillis();
            log.info("End Time: {} | Total Time: {}ms", end, end - start);
            log.info("Updated Categories: {}", updatedCategories);
            return updatedCategories;

        }catch(TemplateDetailException e){
            return Collections.emptyList();
        }
    }

}

