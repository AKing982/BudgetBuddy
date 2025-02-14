package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.services.TransactionCategoryService;
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
    private final TransactionCategoryService transactionCategoryService;
    private final SubBudgetService subBudgetService;

    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public SubBudgetMonthOverviewServiceImpl(TransactionCategoryService transactionCategoryService,
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
        FROM TransactionCategoryEntity tc
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

            IncomeCategory incomeCategory = mapToIncomeCategory(incomeCategories.get(0));
            return Optional.of(incomeCategory);
        }catch(Exception e)
        {
            log.error("Error loading income categories for subBudgetId {} between {} and {}: {}",
                    subBudgetId, startDate, endDate, e.getMessage(), e);
            return Optional.empty();
        }
    }

    private IncomeCategory mapToIncomeCategory(Object[] result)
    {
        TransactionCategoryEntity tc = (TransactionCategoryEntity) result[0];
        CategoryEntity category = (CategoryEntity) result[1];

        return new IncomeCategory(
                category.getId(),
                category.getName(),
                "Income from " + category.getName(),
                BigDecimal.valueOf(tc.getBudgetedAmount()),
                tc.getStartDate(),
                tc.getEndDate(),
                BigDecimal.valueOf(tc.getActual()),
                tc.getIsactive(),
                CategoryType.INCOME,
                new DateRange(tc.getStartDate(), tc.getEndDate()),
                BigDecimal.valueOf(tc.getBudgetedAmount()),  // incomeGrossAmount
                category.getName(),                          // incomeSource
                determineIncomeFrequency(tc.getStartDate(), tc.getEndDate())  // frequency
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
                            FROM TransactionCategoryEntity tc
                            JOIN tc.category c
                            WHERE (c.id <> '21009000' AND c.name NOT LIKE :payrollPattern)
                                AND tc.subBudget.id = :subBudgetId
                                AND tc.startDate >= :startDate
                                AND tc.endDate <= :endDate
                                AND tc.isactive = true""";
        try
        {
            List<Object[]> expenseCategories = entityManager.createQuery(expenseCategoryQuery, Object[].class)
                    .setParameter("payrollPattern", "%Payroll%")
                    .setParameter("subBudgetId", subBudgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();

            if(expenseCategories.isEmpty())
            {
                return Optional.empty();
            }

            ExpenseCategory expenseCategory = mapToExpenseCategory(expenseCategories.get(0));
            return Optional.of(expenseCategory);
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

        return List.of();
    }

    private ExpenseCategory mapToExpenseCategory(Object[] result) {
        TransactionCategoryEntity tc = (TransactionCategoryEntity) result[0];
        CategoryEntity category = tc.getCategory();

        return new ExpenseCategory(
                category.getId(),
                category.getName(),
                "Expense category",
                BigDecimal.valueOf(tc.getBudgetedAmount()),
                tc.getStartDate(),
                tc.getEndDate(),
                BigDecimal.valueOf(tc.getActual()),
                tc.getIsactive(),
                CategoryType.EXPENSE,
                new DateRange(tc.getStartDate(), tc.getEndDate())
        );
    }

}
