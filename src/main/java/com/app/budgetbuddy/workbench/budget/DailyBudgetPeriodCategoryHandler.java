package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
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
import java.util.stream.Collectors;

@Service
@Slf4j
public class DailyBudgetPeriodCategoryHandler implements BudgetPeriodCategoryHandler
{
    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public DailyBudgetPeriodCategoryHandler(EntityManager entityManager)
    {
        this.entityManager = entityManager;
    }

    @Override
    public List<BudgetPeriodCategory> getBudgetPeriodCategories(SubBudget subBudget)
    {
        List<BudgetSchedule> budgetScheduleList = subBudget.getBudgetSchedule();
        BudgetSchedule budgetSchedule = budgetScheduleList.get(0);
        if(budgetSchedule == null)
        {
            return Collections.emptyList();
        }
        List<BudgetPeriodCategory> budgetPeriodCategories = new ArrayList<>();
        try
        {
            LocalDate subBudgetStartDate = budgetSchedule.getStartDate();
            LocalDate subBudgetEndDate = budgetSchedule.getEndDate();
            Long subBudgetId = budgetSchedule.getSubBudgetId();
            // Generate daily date ranges
//            DateRange dailyDateRange = new DateRange(subBudgetStartDate, subBudgetEndDate);
//            List<LocalDate> dailyDates = dailyDateRange.splitIntoDays().stream()
//                    .map(DateRange::getStartDate)
//                    .toList();
//
//            for(LocalDate date : dailyDates)
//            {
//                List<Object[]> results = entityManager.createQuery("""
//                    SELECT DISTINCT categoryName,
//                           bc.budgetedAmount,
//                           COALESCE(bc.actual, 0) AS actualSpent,
//                           (bc.budgetedAmount - COALESCE(bc.actual, 0)) AS remainingAmount
//                    FROM BudgetCategoryEntity bc
//                    WHERE bc.startDate <= :date
//                      AND bc.endDate >= :date
//                      AND bc.subBudget.id = :budgetId
//                      AND bc.active = true
//                """, Object[].class)
//                        .setParameter("date", date)
//                        .setParameter("budgetId", subBudgetId)
//                        .getResultList();
//
//                results.stream()
//                        .map(row -> {
//                            String categoryName = getCategoryDisplayName((String) row[0]);
//                            BigDecimal budgeted = BigDecimal.valueOf((Double) row[1]);
//                            BigDecimal actual = BigDecimal.valueOf((Double) row[2]);
//
//                            return new BudgetPeriodCategory(
//                                    categoryName,
//                                    budgeted,
//                                    actual,
//                                    new DateRange(date, date),
//                                    determineCategoryStatus(budgeted, actual)
//                            );
//                        })
//                        .forEach(budgetPeriodCategories::add);
//            }

            return budgetPeriodCategories;

        } catch (Exception e) {
            log.error("Error retrieving daily budget period categories for SubBudget ID: {}", budgetSchedule.getBudgetScheduleId(), e);
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
