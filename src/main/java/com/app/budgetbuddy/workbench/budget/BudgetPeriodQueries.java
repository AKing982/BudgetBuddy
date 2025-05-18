package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;

import com.app.budgetbuddy.exceptions.BudgetScheduleException;
import com.app.budgetbuddy.exceptions.DateRangeException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.services.BudgetScheduleRangeService;
import com.app.budgetbuddy.services.BudgetScheduleService;
import com.app.budgetbuddy.services.SubBudgetService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.Month;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetPeriodQueries
{
    @PersistenceContext
    private final EntityManager entityManager;
    private final BudgetPeriodCategoryService budgetPeriodCategoryService;
    private final SubBudgetService subBudgetService;

    @Autowired
    public BudgetPeriodQueries(EntityManager entityManager,
                               BudgetPeriodCategoryService budgetPeriodCategoryService,
                               SubBudgetService subBudgetService)
    {
        this.entityManager = entityManager;
        this.budgetPeriodCategoryService = budgetPeriodCategoryService;
        this.subBudgetService = subBudgetService;
    }

    public List<BudgetPeriodCategory> getBudgetPeriodQueryData(Long userId, LocalDate startMonth, LocalDate endMonth, Period period)
    {
        if(userId <= 0 || startMonth == null || endMonth == null)
        {
            return Collections.emptyList();
        }
        Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, startMonth, endMonth);
        if(subBudgetOptional.isEmpty())
        {
            log.warn("No SubBudget was found for user {} and startMonth {} and endMonth {}", userId, startMonth, endMonth);
            return Collections.emptyList();
        }
        try
        {
            log.info("Getting budget period query data for userId: {}", userId);
            SubBudget subBudget = subBudgetOptional.get();
            List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
            BudgetSchedule budgetSchedule = budgetSchedules.get(0);
            return budgetPeriodCategoryService.getBudgetPeriodCategoriesByPeriod(budgetSchedule, period);
        }catch(Exception e)
        {
            log.error("There was an error retrieving the budget period query data from the server: ", e);
            return Collections.emptyList();
        }
    }


    public List<BudgetPeriodCategory> getBudgetPeriodQueryForDate(final LocalDate date, final Long userId)
    {
        if(userId == null || userId <= 0)
        {
            log.warn("Found null or invalid user id");
            return Collections.emptyList();
        }
        LocalDate monthStart = date.withDayOfMonth(1);
        LocalDate monthEnd = date.withDayOfMonth(date.lengthOfMonth());
        Optional<SubBudget> subBudgetOptional = subBudgetService.getSubBudgetsByUserIdAndDate(userId, monthStart, monthEnd);
        if(subBudgetOptional.isEmpty())
        {
            log.warn("Sub budget not found for user {} and date: {}", userId, date);
            return Collections.emptyList();
        }
        SubBudget subBudget = subBudgetOptional.get();
        Long subBudgetId = subBudget.getId();
        try
        {

            final String dateBudgetQuery = """
                    SELECT DISTINCT bc.categoryName,
                   bc.budgetedAmount,
                   bc.actual as actualSpent,
                   bc.budgetedAmount - bc.actual as remainingAmount
            FROM BudgetCategoryEntity bc
            JOIN bc.subBudget sb
            WHERE bc.startDate <= :date
           AND bc.endDate >= :date
            AND bc.subBudget.id = :budgetId
            AND bc.active = true""";
            List<Object[]> results = entityManager.createQuery(dateBudgetQuery, Object[].class)
                    .setParameter("date", date)
                    .setParameter("budgetId", subBudgetId)
                    .getResultList();

            return results.stream()
                    .map(row -> {
                        // Use proper indices and add safe conversion
                        String categoryName = getCategoryDisplayName((String) row[0]);

                        BigDecimal budgeted = (row[1] instanceof Number) ?
                                BigDecimal.valueOf(((Number) row[1]).doubleValue()) : BigDecimal.ZERO;

                        // Handle potential null in actual amount
                        BigDecimal actual = (row[2] != null && row[2] instanceof Number) ?
                                BigDecimal.valueOf(((Number) row[2]).doubleValue()) : BigDecimal.ZERO;

                        // Calculate remaining if you need it
                        BigDecimal remaining = (row[3] instanceof Number) ?
                                BigDecimal.valueOf(((Number) row[3]).doubleValue()) : budgeted.subtract(actual);

                        return new BudgetPeriodCategory(
                                categoryName,
                                budgeted,
                                actual,
                                new DateRange(date, date),
                                determineBudgetStatus(budgeted, actual) // You might have a method like this
                        );
                    })
                    .collect(Collectors.toList());


        }catch(BudgetScheduleException e)
        {
            log.error("Error getting daily budget data for date: {} and budget: {}",
                    date,subBudget.getId(), e);
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

    // You might have a method like this to determine budget status
    private BudgetStatus determineBudgetStatus(BigDecimal budgeted, BigDecimal actual) {
        if (budgeted.compareTo(BigDecimal.ZERO) <= 0) {
            return BudgetStatus.GOOD; // Default if no budget
        }

        // Calculate percentage spent
        BigDecimal percentSpent = actual.multiply(new BigDecimal("100")).divide(budgeted, 2, RoundingMode.HALF_UP);

        if (percentSpent.compareTo(new BigDecimal("80")) > 0) {
            return BudgetStatus.OVER_BUDGET;
        } else if (percentSpent.compareTo(new BigDecimal("50")) > 0) {
            return BudgetStatus.WARNING;
        } else {
            return BudgetStatus.GOOD;
        }
    }
}
