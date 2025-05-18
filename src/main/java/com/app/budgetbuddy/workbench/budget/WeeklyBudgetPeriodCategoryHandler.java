package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DateRangeException;
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

@Service
@Slf4j
public class WeeklyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public WeeklyBudgetPeriodCategoryHandler(EntityManager entityManager)
    {
        this.entityManager = entityManager;
    }

    @Override
    public List<BudgetPeriodCategory> getBudgetPeriodCategories(final BudgetSchedule budgetSchedule)
    {
        if(budgetSchedule == null)
        {
            return Collections.emptyList();
        }
        log.info("BudgetScheduleId: {}", budgetSchedule.getBudgetScheduleId());
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        Long subBudgetId = budgetSchedule.getSubBudgetId();
        log.info("SubBudgetId: {}", subBudgetId);
        List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
        if(budgetScheduleRanges.isEmpty())
        {
            log.warn("No Budget Schedule Ranges found for budget schedule: {}", budgetSchedule.getBudgetScheduleId());
            return Collections.emptyList();
        }
        try
        {
            for(BudgetScheduleRange budgetScheduleWeek : budgetScheduleRanges)
            {
                LocalDate budgetScheduleWeekStart = budgetScheduleWeek.getStartRange();
                LocalDate budgetScheduleWeekEnd = budgetScheduleWeek.getEndRange();
                log.info("Getting to Weekly Budget Query");
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
                        .setParameter("startDate", budgetScheduleWeekStart)
                        .setParameter("endDate", budgetScheduleWeekEnd)
                        .setParameter("budgetId", subBudgetId)
                        .getResultList();
                log.info("Running Weekly Budget Query: {}", weeklyBudgetQuery);
                log.info("Results size: {}", results.size());
                DateRange weekRange = budgetScheduleWeek.getBudgetDateRange();
                // Simplified mapping using entity properties directly
                results.stream()
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
                        .forEach(budgetPeriodCategories::add);
            }
            log.info("Budget Period Categories Size: {}", budgetPeriodCategories.size());
            return budgetPeriodCategories;
        }catch(BudgetScheduleException e)
        {
            log.error("There was an error with the budget schedule ranges: ", e);
            return Collections.emptyList();
        }
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
