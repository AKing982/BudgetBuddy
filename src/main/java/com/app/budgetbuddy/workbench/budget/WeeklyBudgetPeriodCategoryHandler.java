package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.repositories.BudgetCategoryRepository;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.workbench.runner.BudgetCategoryRunner;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

@Service
@Slf4j
public class WeeklyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    @PersistenceContext
    private final EntityManager entityManager;
    private final BudgetCategoryRunner budgetCategoryRunner;
    private final BudgetScheduleRangeBuilderService budgetScheduleRangeBuilderService;
    private final Executor taskExecutor;

    @Autowired
    public WeeklyBudgetPeriodCategoryHandler(EntityManager entityManager,
                                             BudgetCategoryRunner budgetCategoryRunner,
                                             BudgetScheduleRangeBuilderService budgetScheduleRangeBuilderService, Executor taskExecutor)
    {
        this.entityManager = entityManager;
        this.budgetCategoryRunner = budgetCategoryRunner;
        this.budgetScheduleRangeBuilderService = budgetScheduleRangeBuilderService;
        this.taskExecutor = taskExecutor;
    }

    @Override
    public List<BudgetPeriodCategory> getBudgetPeriodCategories(final SubBudget subBudget)
    {
        List<BudgetSchedule> budgetScheduleList = subBudget.getBudgetSchedule();
        BudgetSchedule budgetSchedule = budgetScheduleList.get(0);
        if(budgetSchedule == null)
        {
            return Collections.emptyList();
        }
        Long userId = subBudget.getBudget().getUserId();
        log.info("BudgetScheduleId: {}", budgetSchedule.getBudgetScheduleId());
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        Long subBudgetId = budgetSchedule.getSubBudgetId();
        log.info("SubBudgetId: {}", subBudgetId);
        List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
        if(budgetScheduleRanges.isEmpty())
        {
            log.warn("No Budget Schedule Ranges found for budget schedule: {}", budgetSchedule.getBudgetScheduleId());
            try
            {
                // If no Budget Schedule Ranges are found, then create budget schedule ranges for this period
                List<BudgetScheduleRange> budgetScheduleRangeList = budgetScheduleRangeBuilderService.createBudgetScheduleRangesBySubBudget(subBudget);
                log.info("Created Budget Schedule Ranges: {}", budgetScheduleRangeList);
                budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
            }catch(BudgetScheduleException e){
                log.error("There was an error creating budget schedule ranges for budget schedule: ", e);
                return Collections.emptyList();
            }
        }
        try
        {
            long startTime = System.currentTimeMillis();
            List<CompletableFuture<List<BudgetPeriodCategory>>> futures = budgetScheduleRanges.stream()
                    .map(budgetScheduleWeek -> CompletableFuture.supplyAsync(() ->
                            processSingleWeek(budgetScheduleWeek, subBudget),
                            taskExecutor))
                    .toList();
            List<BudgetPeriodCategory> budgetPeriodCategoryList = futures.stream()
                    .map(CompletableFuture::join)
                    .flatMap(List::stream)
                    .toList();
//            for(BudgetScheduleRange budgetScheduleWeek : budgetScheduleRanges)
//            {
//                LocalDate budgetScheduleWeekStart = budgetScheduleWeek.getStartRange();
//                log.info("Budget Schedule Week Start: {}", budgetScheduleWeekStart);
//                LocalDate budgetScheduleWeekEnd = budgetScheduleWeek.getEndRange();
//                log.info("Budget Schedule Week End: {}", budgetScheduleWeekEnd);
//                budgetCategoryRunner.runBudgetCategoryCreateProcessForWeek(subBudget, budgetScheduleWeek);
//                log.info("Running Budget Category Update for week {}", budgetScheduleWeek);
//                budgetCategoryRunner.runBudgetCategoryUpdateProcessForBudgetScheduleRange(budgetScheduleWeek, subBudget, userId);
//                log.info("Successfully run Budget Category Update for week {}", budgetScheduleWeek);
//                log.info("Getting to Weekly Budget Query");
//                final String weeklyBudgetQuery = """
//                SELECT DISTINCT bc.categoryName,
//                       bc.budgetedAmount,
//                       COALESCE(bc.actual, 0) as actualSpent,
//                       bc.budgetedAmount - COALESCE(bc.actual, 0) as remainingAmount
//                FROM BudgetCategoryEntity bc
//                JOIN bc.subBudget b
//                WHERE bc.startDate >= :startDate
//                AND bc.endDate <= :endDate
//                AND bc.subBudget.id = :budgetId
//                AND bc.active = true
//                """;
//                List<Object[]> results = entityManager.createQuery(weeklyBudgetQuery, Object[].class)
//                        .setParameter("startDate", budgetScheduleWeekStart)
//                        .setParameter("endDate", budgetScheduleWeekEnd)
//                        .setParameter("budgetId", subBudgetId)
//                        .getResultList();
//                log.info("Running Weekly Budget Query: {}", weeklyBudgetQuery);
//                log.info("Results size: {}", results.size());
//                DateRange weekRange = budgetScheduleWeek.getBudgetDateRange();
//                // Simplified mapping using entity properties directly
//                results.stream()
//                        .map(row -> {
//                            // Use proper indices and add safe conversion
//                            String categoryName = getCategoryDisplayName(String.valueOf(row[0]));
//                            BigDecimal budgeted = (row[1] instanceof Number) ?
//                                    BigDecimal.valueOf(((Number) row[1]).doubleValue()) : BigDecimal.ZERO;
//                            BigDecimal actual = (row[2] instanceof Number) ?
//                                    BigDecimal.valueOf(((Number) row[2]).doubleValue()) : BigDecimal.ZERO;
//                            BigDecimal remaining = (row[3] instanceof Number) ?
//                                    BigDecimal.valueOf(((Number) row[3]).doubleValue()) : BigDecimal.ZERO;
//
//                            return BudgetPeriodCategory.builder()
//                                    .remaining(remaining)
//                                    .budgetStatus(determineCategoryStatus(budgeted, actual))
//                                    .actual(actual)
//                                    .budgeted(budgeted)
//                                    .category(categoryName)
//                                    .dateRange(weekRange)
//                                    .build();
//                        })
//                        .forEach(budgetPeriodCategories::add);
//            }
            long endTime = System.currentTimeMillis();
            long elapsed = endTime - startTime;
            log.info("Total time: {} ms", elapsed);
            log.info("Budget Period Categories Size: {}", budgetPeriodCategoryList);
            return budgetPeriodCategoryList;
        }catch(BudgetScheduleException e)
        {
            log.error("There was an error with the budget schedule ranges: ", e);
            return Collections.emptyList();
        }
    }

    private List<BudgetPeriodCategory> processSingleWeek(BudgetScheduleRange budgetScheduleRange,
                                                         SubBudget subBudget)
    {
        Long subBudgetId = subBudget.getId();
        Long userId = subBudget.getBudget().getUserId();
        LocalDate startDate = budgetScheduleRange.getStartRange();
        LocalDate endDate = budgetScheduleRange.getEndRange();
        budgetCategoryRunner.runBudgetCategoryCreateProcessForWeek(subBudget, budgetScheduleRange);
        budgetCategoryRunner.runBudgetCategoryUpdateProcessForBudgetScheduleRange(budgetScheduleRange, subBudget, userId);
        final String weeklyBudgetQuery = """
                SELECT DISTINCT bc.categoryName,
                       bc.budgetedAmount,
                       COALESCE(bc.actual, 0) as actualSpent,
                       bc.budgetedAmount - COALESCE(bc.actual, 0) as remainingAmount
                FROM BudgetCategoryEntity bc
                JOIN bc.subBudget b
                WHERE bc.startDate >= :startDate
                AND bc.endDate <= :endDate
                AND bc.subBudget.id = :budgetId
                AND bc.active = true
                """;
        List<Object[]> results = entityManager.createQuery(weeklyBudgetQuery, Object[].class)
                .setParameter("startDate", startDate)
                .setParameter("endDate", endDate)
                .setParameter("budgetId", subBudgetId)
                .getResultList();
        DateRange weekRange = budgetScheduleRange.getBudgetDateRange();
        return results.stream()
                .map(row -> {
                    // Use proper indices and add safe conversion
                    String categoryName = getCategoryDisplayName(String.valueOf(row[0]));
                    BigDecimal budgeted = (row[1] instanceof Number) ?
                            BigDecimal.valueOf(((Number) row[1]).doubleValue()) : BigDecimal.ZERO;
                    BigDecimal actual = (row[2] instanceof Number) ?
                            BigDecimal.valueOf(((Number) row[2]).doubleValue()) : BigDecimal.ZERO;
                    BigDecimal remaining = (row[3] instanceof Number) ?
                            BigDecimal.valueOf(((Number) row[3]).doubleValue()) : BigDecimal.ZERO;

                    return BudgetPeriodCategory.builder()
                            .remaining(remaining)
                            .budgetStatus(determineCategoryStatus(budgeted, actual))
                            .actual(actual)
                            .budgeted(budgeted)
                            .category(categoryName)
                            .dateRange(weekRange)
                            .build();
                })
                .toList();
    }

    /**
     * Converts a category string to its proper display name using the CategoryType enum
     *
     * @param categoryStr The category string to convert
     * @return The formatted category name from the enum, or the original string if not found
     */
    private String getCategoryDisplayName(String categoryStr) {
        if (categoryStr == null || categoryStr.isEmpty()) {
            return "";
        }

        try {
            // Try to parse the string as a CategoryType enum
            CategoryType categoryType = CategoryType.valueOf(categoryStr.toUpperCase());
            return categoryType.getType(); // Assuming you have a getter for the 'type' field
        } catch (IllegalArgumentException e) {
            // If the string is not a valid enum value, format it as title case instead
            return formatCategoryName(categoryStr);
        }
    }

    /**
     * Formats a category string with proper title case (as a fallback)
     */
    private String formatCategoryName(String category) {
        if (category == null || category.isEmpty()) {
            return "";
        }

        // Replace underscores with spaces
        String spacedCategory = category.replace('_', ' ');

        // Split into words
        String[] words = spacedCategory.split("\\s+");
        StringBuilder result = new StringBuilder();

        for (String word : words) {
            if (!word.isEmpty()) {
                // Capitalize first letter, lowercase the rest
                result.append(word.substring(0, 1).toUpperCase())
                        .append(word.substring(1).toLowerCase())
                        .append(" ");
            }
        }

        // Trim trailing space and return
        return result.toString().trim();
    }
    private BudgetStatus determineCategoryStatus(BigDecimal budgeted, BigDecimal actual) {
        if (actual.compareTo(budgeted) > 0) {
            return BudgetStatus.OVER_BUDGET;
        } else if (actual.compareTo(budgeted.multiply(new BigDecimal("0.8"))) < 0) {
            return BudgetStatus.UNDER_UTILIZED;
        } else {
            return BudgetStatus.GOOD;
        }
    }
}
