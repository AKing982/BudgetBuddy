package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DateRangeException;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import static com.app.budgetbuddy.workbench.budget.BudgetScheduleRangeUtil.buildBiWeeklyBudgetScheduleRanges;

@Service
@Slf4j
public class BiWeeklyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public BiWeeklyBudgetPeriodCategoryHandler(EntityManager entityManager)
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
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        List<BudgetScheduleRange> budgetScheduleRanges = budgetSchedule.getBudgetScheduleRanges();
        budgetScheduleRanges.forEach((bs) -> {
            log.info("Budget Schedule Range: {}", bs);
        });
        List<BudgetScheduleRange> biWeeklyRanges = buildBiWeeklyBudgetScheduleRanges(budgetScheduleRanges);
        if(biWeeklyRanges.isEmpty())
        {
            log.warn("No Bi Weekly BudgetScheduleRanges found for budgetScheduleId: {}", budgetSchedule.getBudgetScheduleId());
            return Collections.emptyList();
        }
        Long subBudgetId = budgetSchedule.getSubBudgetId();
        try
        {

            log.info("Getting to BiWeekly Budget Query");
            final String biWeeklyBudgetQuery = """
            SELECT DISTINCT bc.categoryName,
                   SUM(bc.budgetedAmount) as totalBudgeted,
                   SUM(COALESCE(bc.actual, 0)) as actualSpent,
                   SUM(bc.budgetedAmount - COALESCE(bc.actual, 0)) as remainingAmount
            FROM BudgetCategoryEntity bc
            WHERE bc.subBudget.id = :budgetId
            AND bc.active = true
            AND (
                (bc.startDate >= :firstPeriodStart AND bc.endDate <= :firstPeriodEnd)
                OR
                (bc.startDate >= :secondPeriodStart AND bc.endDate <= :secondPeriodEnd)
            )
            GROUP BY categoryName
            """;
            BudgetScheduleRange firstBiWeekRange = biWeeklyRanges.get(0);
            log.info("First BiWeek Range: start={}, end={}", firstBiWeekRange.getStartRange(), firstBiWeekRange.getEndRange());
            BudgetScheduleRange secondBiWeekRange = biWeeklyRanges.get(1);
            log.info("Second BiWeek Range: start={}, end={}", secondBiWeekRange.getStartRange(), secondBiWeekRange.getEndRange());
            List<Object[]> results = entityManager.createQuery(biWeeklyBudgetQuery, Object[].class)
                    .setParameter("budgetId", subBudgetId)
                    .setParameter("firstPeriodStart", firstBiWeekRange.getStartRange())
                    .setParameter("firstPeriodEnd", firstBiWeekRange.getEndRange())
                    .setParameter("secondPeriodStart", secondBiWeekRange.getStartRange())
                    .setParameter("secondPeriodEnd", secondBiWeekRange.getEndRange())
                    .getResultList();
                    results.stream()
                        .map(row -> {
                            String categoryName = getCategoryDisplayName((String) row[0]);  // First column: category.name
                            BigDecimal budgeted = BigDecimal.valueOf((Double) row[1]);  // Second column: totalBudgeted
                            BigDecimal actual = BigDecimal.valueOf((Double) row[2]);    // Third column: actualSpent
                            BigDecimal remaining = BigDecimal.valueOf((Double) row[3]); // Fourth column: remainingAmount
                            return BudgetPeriodCategory.builder()
                                    .category(categoryName)
                                    .budgeted(budgeted)
                                    .remaining(remaining)
                                    .actual(actual)
                                    .budgetStatus(determineCategoryStatus(budgeted, actual))
                                    .biWeekRanges(buildBiWeeklyDateRanges(firstBiWeekRange, secondBiWeekRange))
                                    .build();

                        })
                        .forEach(budgetPeriodCategories::add);
                    log.info("Budget Period Categories Size: {}", budgetPeriodCategories.size());

            return budgetPeriodCategories;
        }catch(BudgetScheduleException e)
        {
            log.error("There was an error with the bi-weekly ranges: ", e);
            return Collections.emptyList();
        }
    }

     /**
 * Determines the budget category status based on spending.
 */
    private BudgetStatus determineCategoryStatus(BigDecimal budgeted, BigDecimal actual)
    {
        if (actual.compareTo(budgeted) > 0)
        {
            return BudgetStatus.OVER_BUDGET;
        }
        else if(actual.compareTo(budgeted.multiply(new BigDecimal("0.8"))) < 0)
        {
            return BudgetStatus.UNDER_UTILIZED;
        }
        else
        {
            return BudgetStatus.GOOD;
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

    private List<DateRange> buildBiWeeklyDateRanges(BudgetScheduleRange biWeekRange1, BudgetScheduleRange biWeekRange2)
    {
        List<DateRange> biWeekRanges = new ArrayList<>();
        DateRange biWeek1 = biWeekRange1.getBudgetDateRange();
        DateRange biWeek2 = biWeekRange2.getBudgetDateRange();
        biWeekRanges.add(biWeek1);
        biWeekRanges.add(biWeek2);
        return biWeekRanges;
    }
}
