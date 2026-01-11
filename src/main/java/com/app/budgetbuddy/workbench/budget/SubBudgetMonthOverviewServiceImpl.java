package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetCategoryEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.swing.text.html.parser.Entity;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class SubBudgetMonthOverviewServiceImpl implements SubBudgetOverviewService
{
    private final BudgetCategoryService transactionCategoryService;
    private final SubBudgetService subBudgetService;

    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public SubBudgetMonthOverviewServiceImpl(BudgetCategoryService transactionCategoryService,
                                             SubBudgetService subBudgetService,
                                             EntityManager entityManager)
    {
        this.transactionCategoryService = transactionCategoryService;
        this.subBudgetService = subBudgetService;
        this.entityManager = entityManager;
    }

    @Override
    public Optional<IncomeCategory> loadIncomeCategory(final Long subBudgetId, final LocalDate startDate, final LocalDate endDate)
    {
        if(subBudgetId == null || startDate == null || endDate == null)
        {
            log.warn("Invalid parameters provided to loadIncomeCategories");
            return Optional.empty();
        }
        final String incomeQuery = """
        SELECT b.monthlyIncome / 12 as budgetedIncome,
        SUM(tc.actual) as actualIncome,
        (b.monthlyIncome / 12 - SUM(tc.actual)) as remainingIncome
        FROM BudgetCategoryEntity tc
        INNER JOIN SubBudgetEntity sb
            ON tc.subBudget.id = sb.id
        INNER JOIN BudgetEntity b
            ON sb.budget.id = b.id
        WHERE (tc.categoryName =:catName OR tc.categoryName = "PAYROLL")
        AND tc.subBudget.id = :subBudgetId
        AND tc.startDate >= :startDate
        AND tc.endDate < :endDate
        AND tc.active = true
        group by b.monthlyIncome
        """;
        try
        {
            List<Object[]> results = entityManager.createQuery(incomeQuery, Object[].class)
                    .setParameter("catName", "Income")
                    .setParameter("subBudgetId", subBudgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();

            if(results == null || results.isEmpty())
            {
                log.info("No income categories found for subBudgetId {} between {} and {}",
                        subBudgetId, startDate, endDate);
                return Optional.empty();
            }

            Object[] row = results.get(0);
            BigDecimal budgetedIncome = (BigDecimal) row[0];
            BigDecimal actualIncome = BigDecimal.valueOf((Double) row[1]);
            BigDecimal remainingIncome = BigDecimal.valueOf((Double) row[2]);

            IncomeCategory incomeCategory = IncomeCategory.builder()
                    .budgetedIncome(budgetedIncome)
                    .actualBudgetedIncome(actualIncome)
                    .remainingIncome(remainingIncome)
                    .build();
            return Optional.of(incomeCategory);
        }catch(Exception e)
        {
            log.error("Error loading income categories for subBudgetId {} between {} and {}: {}",
                    subBudgetId, startDate, endDate, e.getMessage(), e);
            return Optional.empty();
        }
    }

    // Updated mapping method to work with entity list directly
    private IncomeCategory mapToIncomeCategory(List<BudgetCategoryEntity> results) {
        BigDecimal totalBudgeted = BigDecimal.ZERO;
        BigDecimal totalActual = BigDecimal.ZERO;

        // Aggregate totals
        for (BudgetCategoryEntity tc : results) {
            totalBudgeted = totalBudgeted.add(BigDecimal.valueOf(tc.getBudgetedAmount()));
            totalActual = totalActual.add(BigDecimal.valueOf(tc.getActual()));
        }

        // Get first record for date range (assuming all records are in same month)
        BudgetCategoryEntity firstTc = results.get(0);

        return new IncomeCategory(
                totalBudgeted,
                totalActual,
                totalBudgeted.subtract(totalActual),
                firstTc.getStartDate(),
                firstTc.getEndDate(),
                true
        );
    }

    private IncomeFrequency determineIncomeFrequency(LocalDate startDate, LocalDate endDate)
    {
        long daysBetween = ChronoUnit.DAYS.between(startDate, endDate);
        if (daysBetween <= 7)
        {
            return IncomeFrequency.WEEKLY;
        }
        else if (daysBetween <= 14)
        {
            return IncomeFrequency.BIWEEKLY;
        }
        else if (daysBetween <= 31)
        {
            return IncomeFrequency.MONTHLY;
        }
        return IncomeFrequency.YEARLY;
    }

    @Override
    public Optional<ExpenseCategory> loadExpenseCategory(Long subBudgetId, LocalDate startDate, LocalDate endDate)
    {
        if (subBudgetId == null || startDate == null || endDate == null)
        {
            log.warn("Invalid parameters provided to loadExpenseCategories");
            return Optional.empty();
        }
        final String expenseCategoryQuery = """
                            SELECT b.budgetAmount / 12 as budgetedAmount,
                            SUM(tc.actual) as totalSpent,
                            (SUM(tc.budgetedAmount) - SUM(tc.actual)) as remaining
                            FROM BudgetCategoryEntity tc
                            INNER JOIN SubBudgetEntity sb
                                ON tc.subBudget.id = sb.id
                            INNER JOIN BudgetEntity b
                                ON sb.budget.id = b.id
                            WHERE (tc.categoryName <> :catName)
                                AND tc.subBudget.id = :subBudgetId
                                AND tc.startDate >= :startDate
                                AND tc.endDate <= :endDate
                                AND tc.active = true
                                group by b.budgetAmount
                                """;
        try
        {
            Object[] expenseCategories = entityManager.createQuery(expenseCategoryQuery, Object[].class)
                    .setParameter("catName", "Income")
                    .setParameter("subBudgetId", subBudgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getSingleResult();
            if(expenseCategories[0] == null)
            {
                return Optional.empty();
            }
            BigDecimal budgeted = (BigDecimal) expenseCategories[0];
            BigDecimal actual = BigDecimal.valueOf((Double) expenseCategories[1]);

            return Optional.of(new ExpenseCategory(
                    "Expense",
                    budgeted,
                    actual,
                    budgeted.subtract(actual),
                    true,
                    startDate,
                    endDate
            ));
        }catch(Exception e)
        {
            log.error("There was an error fetching the expense budget categories: ", e);
            return Optional.empty();
        }
    }

    @Override
    public Optional<SavingsCategory> loadSavingsCategory(Long subBudgetId, LocalDate startDate, LocalDate endDate)
    {
        if(subBudgetId == null || startDate == null || endDate == null)
        {
            return Optional.empty();
        }
        final String savingsCategoryQuery = """
        SELECT bg.targetAmount / b.totalMonthsToSave as targetAmount,
        CASE
          WHEN (SUM(tc.budgetedAmount) - SUM(tc.actual)) < 0 THEN 0
          ELSE (SUM(tc.budgetedAmount) - SUM(tc.actual))
          END as totalSaved,
          (bg.targetAmount / b.totalMonthsToSave) - 
          CASE WHEN (SUM(tc.budgetedAmount) - SUM(tc.actual)) < 0 THEN 0 ELSE (SUM(tc.budgetedAmount) - SUM(tc.actual)) END
          as remainingToSave
        FROM BudgetCategoryEntity tc
        JOIN tc.subBudget sb
        JOIN sb.budget b
        LEFT JOIN b.budgetGoals bg
        WHERE tc.subBudget.id = :subBudgetId
        AND tc.startDate >= :startDate
        AND tc.endDate <= :endDate
        AND tc.active = true
        GROUP BY bg.targetAmount / b.totalMonthsToSave
        """;

        try {
            Object[] result = entityManager.createQuery(savingsCategoryQuery, Object[].class)
                    .setParameter("subBudgetId", subBudgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getSingleResult();

            if (result[0] == null) {
                return Optional.empty();
            }

            BigDecimal targetAmount = BigDecimal.valueOf((Double) result[0]);
            BigDecimal totalSaved = BigDecimal.valueOf((Double) result[1]);
            BigDecimal remainingToSave = targetAmount.subtract(totalSaved);

            SavingsCategory savingsCategory = new SavingsCategory(
                    targetAmount,
                    totalSaved,
                    remainingToSave,
                    true,
                    startDate,
                    endDate
            );

            return Optional.of(savingsCategory);
        } catch (Exception e) {
            log.error("Error loading savings category for subBudgetId {} between {} and {}: {}",
                    subBudgetId, startDate, endDate, e.getMessage(), e);
            return Optional.empty();
        }
    }

    @Override
    public List<ExpenseCategory> loadTopExpenseCategories(Long budgetId, LocalDate startDate, LocalDate endDate)
    {
        if(budgetId == null || startDate == null || endDate == null)
        {
            log.warn("Invalid parameters provided to loadTopExpenseCategories");
            return Collections.emptyList();
        }
        final String topExpensesQuery = """
        SELECT DISTINCT tc.categoryName,
               tc.budgetedAmount,
               SUM(tc.actual) as actualSpent,
               (tc.budgetedAmount - SUM(tc.actual)) as remaining
        FROM BudgetCategoryEntity tc
        WHERE tc.subBudget.id = :budgetId
            AND tc.startDate >= :startDate
            AND tc.endDate <= :endDate
            AND tc.active = true
            AND (tc.categoryName NOT IN ('Income', 'Uncategorized'))
        GROUP BY categoryName, budgetedAmount
        ORDER BY SUM(tc.actual) DESC
        LIMIT 5
        """;
        try
        {
            List<Object[]> results = entityManager.createQuery(topExpensesQuery, Object[].class)
                    .setParameter("budgetId", budgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setMaxResults(5)
                    .getResultList();


            return results.stream()
                    .map(result -> {
                        // Add proper null checks and conversions
                        String categoryName = getCategoryDisplayName(String.valueOf(result[0]));
                        Double budgetedAmount = (result[1] instanceof Number) ? ((Number) result[1]).doubleValue() : 0.0;
                        Double actual = (result[2] instanceof Number) ? ((Number) result[2]).doubleValue() : 0.0;
                        Double remaining = (result[3] instanceof Number) ? ((Number) result[3]).doubleValue() : 0.0;

                        return new ExpenseCategory(
                                categoryName,
                                BigDecimal.valueOf(budgetedAmount),
                                BigDecimal.valueOf(actual),
                                BigDecimal.valueOf(remaining),
                                true,
                                startDate,
                                endDate
                        );
                    })
                    .collect(Collectors.toList());

        } catch (Exception e)
        {
            log.error("Error loading top expense categories for budgetId {} between {} and {}: {}",
                    budgetId, startDate, endDate, e.getMessage(), e);
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

}
