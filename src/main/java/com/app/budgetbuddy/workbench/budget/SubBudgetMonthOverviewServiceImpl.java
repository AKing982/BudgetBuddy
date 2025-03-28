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
        SELECT tc
        FROM BudgetCategoryEntity tc
        JOIN tc.category c
        WHERE (c.id = '21009000' OR c.name LIKE :payrollPattern)
        AND tc.subBudget.id = :subBudgetId
        AND tc.startDate >= :startDate
        AND tc.endDate <= :endDate
        AND tc.isactive = true
        """;
        try
        {
            List<Object[]> incomeCategories = entityManager.createQuery(incomeQuery, Object[].class)
                    .setParameter("payrollPattern", "%Payroll%")
                    .setParameter("subBudgetId", subBudgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();

            IncomeCategory incomeCategory = mapToIncomeCategory(incomeCategories);
            return Optional.of(incomeCategory);
        }catch(Exception e)
        {
            log.error("Error loading income categories for subBudgetId {} between {} and {}: {}",
                    subBudgetId, startDate, endDate, e.getMessage(), e);
            return Optional.empty();
        }
    }

    private IncomeCategory mapToIncomeCategory(List<Object[]> results) {
        BigDecimal totalBudgeted = BigDecimal.ZERO;
        BigDecimal totalActual = BigDecimal.ZERO;

        // Aggregate totals
        for (Object[] result : results) {
            BudgetCategoryEntity tc = (BudgetCategoryEntity) result[0];
            totalBudgeted = totalBudgeted.add(BigDecimal.valueOf(tc.getBudgetedAmount()));
            totalActual = totalActual.add(BigDecimal.valueOf(tc.getActual()));
        }

        // Get first record for date range (assuming all records are in same month)
        BudgetCategoryEntity firstTc = (BudgetCategoryEntity) results.get(0)[0];

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
                            SELECT SUM(tc.budgetedAmount) as totalBudgeted,
                            SUM(tc.actual) as totalSpent,
                            (SUM(tc.budgetedAmount) - SUM(tc.actual)) as remaining
                            FROM BudgetCategoryEntity tc
                            JOIN tc.category c
                            WHERE (c.id <> '21009000' AND c.name NOT LIKE :payrollPattern)
                                AND tc.subBudget.id = :subBudgetId
                                AND tc.startDate >= :startDate
                                AND tc.endDate <= :endDate
                                AND tc.isactive = true""";
        try
        {
            Object[] expenseCategories = entityManager.createQuery(expenseCategoryQuery, Object[].class)
                    .setParameter("payrollPattern", "%Payroll%")
                    .setParameter("subBudgetId", subBudgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getSingleResult();

            if(expenseCategories[0] == null)
            {
                return Optional.empty();
            }


            BigDecimal budgeted = BigDecimal.valueOf((Double) expenseCategories[0]);
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
    SELECT bg.targetAmount,
        SUM(tc.budgetedAmount - tc.actual) as totalSaved 
    FROM BudgetCategoryEntity tc
    JOIN tc.subBudget sb
    JOIN sb.budget b
    LEFT JOIN b.budgetGoals bg
    WHERE tc.subBudget.id = :subBudgetId
    AND tc.startDate >= :startDate
    AND tc.endDate <= :endDate
    AND tc.isactive = true
    GROUP BY bg.targetAmount
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
        SELECT tc.category.id,
               tc.category.name,
               tc.budgetedAmount,
               tc.actual,
               (tc.budgetedAmount - tc.actual) as remaining
        FROM BudgetCategoryEntity tc
        JOIN tc.category c
        WHERE tc.subBudget.id = :budgetId
            AND tc.startDate >= :startDate
            AND tc.endDate <= :endDate
            AND tc.isactive = true
            AND (c.id <> '21009000' AND c.name NOT LIKE :payrollPattern)
        ORDER BY tc.actual DESC
        """;

        try
        {
            List<Object[]> results = entityManager.createQuery(topExpensesQuery, Object[].class)
                    .setParameter("budgetId", budgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("payrollPattern", "%Payroll%")
                    .setMaxResults(5)
                    .getResultList();


            return results.stream()
                    .map(result -> new ExpenseCategory(
                            (String) result[1],
                            BigDecimal.valueOf((Double) result[2]),  // budgetedAmount
                            BigDecimal.valueOf((Double) result[3]),  // actual
                            BigDecimal.valueOf((Double) result[4]),  // remaining
                            true,                                    // isActive
                            startDate,
                            endDate
                    ))
                    .collect(Collectors.toList());
        } catch (Exception e)
        {
            log.error("Error loading top expense categories for budgetId {} between {} and {}: {}",
                    budgetId, startDate, endDate, e.getMessage(), e);
            return Collections.emptyList();
        }
    }

}
