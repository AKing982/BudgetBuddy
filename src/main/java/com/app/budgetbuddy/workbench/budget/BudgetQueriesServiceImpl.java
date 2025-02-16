package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.BudgetRepository;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetQueriesServiceImpl implements BudgetQueriesService
{
    private EntityManager entityManager;
    private BudgetRepository budgetRepository;

    @Autowired
    public BudgetQueriesServiceImpl(EntityManager em,
                                    BudgetRepository budgetRepository)
    {
        this.entityManager = em;
        this.budgetRepository = budgetRepository;
    }

    @Override
    public List<Category> getTopExpenseBudgetCategories(Long budgetId, LocalDate startDate, LocalDate endDate) {
        final String jpql = """
                   SELECT c.name,
                   SUM(tc.budgetedAmount) as totalBudgetedAmount,
                   SUM(tc.actual) as totalSpent,
                   tc.startDate,
                   tc.endDate
                   FROM TransactionCategoryEntity tc
                   JOIN CategoryEntity c ON tc.category.id = c.id
                   WHERE tc.subBudget.id = :budgetId
                   AND tc.startDate >= :startDate
                   AND tc.endDate <= :endDate
                   AND tc.isactive = true
                   GROUP BY c.id, c.name, tc.startDate, tc.endDate
                   ORDER BY SUM(tc.actual) DESC
                """;
        try
        {

            List<Object[]> results = entityManager.createQuery(jpql, Object[].class)
                    .setParameter("budgetId", budgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setMaxResults(5)
                    .getResultList();

            return results.stream()
                    .map(row -> {
                        String categoryName = (String) row[0];
                        BigDecimal budgeted = toBigDecimal( row[1]);
                        BigDecimal actual = toBigDecimal( row[2]);
                        LocalDate categoryStartDate = (LocalDate) row[3];
                        LocalDate categoryEndDate = (LocalDate) row[4];

                        return Category.builder()
                                .categoryName(categoryName)
                                .budgetedAmount(budgeted)
                                .actual(actual)
                                .categoryStartDate(categoryStartDate)
                                .categoryEndDate(categoryEndDate)
                                .isActive(true)
                                .dateRange(new DateRange(categoryStartDate, categoryEndDate))
                                .build();
                    })
                    .collect(Collectors.toList());

        }catch(DataAccessException e){
            log.error("There was an error retrieving the top expense categories for budget: " + budgetId);
            return Collections.emptyList();
        }
    }



    private BigDecimal toBigDecimal(Object value) {
        if (value == null) {
            return BigDecimal.ZERO;
        }
        if (value instanceof BigDecimal) {
            return (BigDecimal) value;
        }
        if (value instanceof Double) {
            return BigDecimal.valueOf((Double) value);
        }
        return new BigDecimal(value.toString());
    }

    @Override
    public List<Category> getIncomeBudgetCategory(Long userId, LocalDate startDate, LocalDate endDate) {
        final String incomeQuery = """
                        SELECT c.name as incomeCategory,
                            b.monthlyIncome as incomeBudgeted,
                            r.lastAmount as incomeActual,
                            r.firstDate,
                            r.lastDate
                        FROM RecurringTransactionEntity r
                        JOIN CategoryEntity c ON r.category.id = c.id
                        JOIN BudgetEntity b ON r.user.id = b.user.id
                        WHERE c.name LIKE '%Payroll%' AND r.user.id = :userId
                        AND r.active = true AND r.firstDate <= :endDate
                        AND r.lastDate >= :startDate
                        GROUP BY c.name, b.monthlyIncome, r.lastAmount, r.firstDate, r.lastDate
                """;
        try
        {
            List<Object[]> results = entityManager.createQuery(incomeQuery, Object[].class)
                    .setParameter("userId", userId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();

            return results.stream()
                    .map(row -> {
                        String categoryName = (String) row[0];
                        BigDecimal budgeted = (BigDecimal) row[1];
                        BigDecimal actual = (BigDecimal) row[2];
                        LocalDate firstDate = ((java.time.LocalDate) row[3]);
                        LocalDate lastDate = ((java.time.LocalDate) row[4]);

                        return buildCategory(
                                categoryName,
                                budgeted.abs(),
                                actual.abs(),
                                firstDate,
                                lastDate
                        );
                    })
                    .collect(Collectors.toList());

        }catch(DataAccessException e){
            log.error("There was an error retrieving the income category for budget: " + e);
            return Collections.emptyList();
        }
    }

    private Category buildCategory(String categoryName, BigDecimal budgetedAmount, BigDecimal actualSpending, LocalDate categoryStartDate, LocalDate categoryEndDate) {
        return Category.builder()
                .categoryName(categoryName)
                .budgetedAmount(budgetedAmount)
                .actual(actualSpending)
                .categoryStartDate(categoryStartDate)
                .categoryEndDate(categoryEndDate)
                .dateRange(new DateRange(categoryStartDate, categoryEndDate))
                .build();
    }

    @Override
    public List<Category> getSavingsBudgetCategory(Long budgetId, LocalDate startDate, LocalDate endDate) {
        final String savingsQuery = """
           SELECT bg.targetAmount as budgetedSavings,
                  SUM(tc.budgetedAmount - tc.actual) as actualSavings,
                  bg.targetAmount- SUM(tc.budgetedAmount - tc.actual) as remainingSavings,
                  tc.startDate, 
                  tc.endDate
           FROM TransactionCategoryEntity tc
           INNER JOIN BudgetEntity b ON tc.subBudget.id = b.id
           INNER JOIN BudgetGoalsEntity bg ON b.id = bg.budget.id
           WHERE b.id = :budgetId
           AND tc.startDate >= :startDate 
           AND tc.endDate <= :endDate
           GROUP BY bg.targetAmount, tc.startDate, tc.endDate
           """;

        try {
            List<Object[]> results = entityManager.createQuery(savingsQuery, Object[].class)
                    .setParameter("budgetId", budgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();

            return results.stream()
                    .map(row -> {
                        BigDecimal budgeted = toBigDecimal(row[0]);
                        BigDecimal actual = toBigDecimal(row[1]);
                        BigDecimal remaining = toBigDecimal(row[2]);
                        LocalDate categoryStartDate = ((java.time.LocalDate) row[3]);
                        LocalDate categoryEndDate = ((java.time.LocalDate) row[4]);

                        return buildCategory(
                                "Savings",
                                budgeted,
                                actual,
                                categoryStartDate,
                                categoryEndDate
                        );
                    })
                    .collect(Collectors.toList());

        } catch(DataAccessException e) {
            log.error("Error retrieving savings category for budget: " + budgetId, e);
            return Collections.emptyList();
        }
    }

    @Override
    public List<Category> getExpensesBudgetCategories(Long budgetId, LocalDate startDate, LocalDate endDate) {
        final String expensesQuery = """
           SELECT b.budgetAmount as budgetedAmount,
                  SUM(tc.actual) as actualSpent,
                  b.budgetAmount - SUM(tc.actual) as remainingOnBudget,
                  tc.startDate,
                  tc.endDate
           FROM TransactionCategoryEntity tc
           INNER JOIN BudgetEntity b ON tc.subBudget.id = b.id 
           WHERE b.id = :budgetId
           AND tc.startDate >= :startDate
           AND tc.endDate <= :endDate
           GROUP BY b.budgetAmount, tc.startDate, tc.endDate
           """;

        try {
            List<Object[]> results = entityManager.createQuery(expensesQuery, Object[].class)
                    .setParameter("budgetId", budgetId)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .getResultList();

            return results.stream()
                    .map(row -> {
                        BigDecimal budgeted = toBigDecimal(row[0]);
                        BigDecimal actual = toBigDecimal(row[1]);
                        BigDecimal remaining = toBigDecimal(row[2]);
                        LocalDate categoryStartDate = (LocalDate) row[3];
                        LocalDate categoryEndDate = (LocalDate) row[4];

                        return buildCategory(
                                "Expenses",
                                budgeted,
                                actual,
                                categoryStartDate,
                                categoryEndDate
                        );
                    })
                    .collect(Collectors.toList());

        } catch(DataAccessException e) {
            log.error("Error retrieving expenses categories for budget: " + budgetId, e);
            return Collections.emptyList();
        }
    }

    @Override
    public BigDecimal getTotalBudgeted(final Long budgetId, final Long userId, final LocalDate startDate, final LocalDate endDate)
    {
        try {
            BigDecimal totalBudgetAmount = budgetRepository.findBudgetAmountByPeriod(userId, startDate, endDate, budgetId);
            if(totalBudgetAmount == null)
            {
                return BigDecimal.ZERO;
            }
            return totalBudgetAmount;
        }catch(DataAccessException e){
            log.error("Error retrieving budget amount for user: " + userId, e);
            return BigDecimal.ZERO;
        }
    }

    @Override
    public BigDecimal getRemainingOnBudget(Long budgetId, LocalDate startDate, LocalDate endDate) {
        final String remainingBudget = """
                                    SELECT SUM(sb.allocatedAmount - tc.actual) as remainingBudget
                                    FROM TransactionCategoryEntity tc
                                    INNER JOIN SubBudgetEntity sb ON tc.subBudget.id = sb.id
                                    INNER JOIN BudgetScheduleEntity bs ON tc.subBudget.id = bs.subBudget.id
                                    WHERE bs.startDate =:startDate AND tc.endDate =:endDate
                                     AND sb.id =:budgetId AND sb.budget.user.id =:userId
                                     GROUP BY sb.allocatedAmount, tc.startDate, tc.endDate
                """;
        try
        {
            Object result = entityManager.createQuery(remainingBudget)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("budgetId", budgetId)
                    .getSingleResult();

            return result != null ? (BigDecimal) result : BigDecimal.ZERO;
        }catch(DataAccessException e){
            log.error("There was an error retrieving the remaining budget amount: ", e);
            return BigDecimal.ZERO;
        }
    }

    @Override
    public BigDecimal getTotalSpentOnBudget(Long budgetId, LocalDate startDate, LocalDate endDate) {
        final String totalSpentQuery = """
           SELECT SUM(tc.actual) as totalSpent
           FROM TransactionCategoryEntity tc
           JOIN tc.category c
           WHERE tc.startDate >= :startDate
           AND tc.endDate <= :endDate
           AND tc.subBudget.id = :budgetId
           AND tc.isactive = true AND (c.id <> '21009000' AND c.name NOT LIKE '%Payroll')
           """;

        try
        {
            Object result = entityManager.createQuery(totalSpentQuery)
                    .setParameter("startDate", startDate)
                    .setParameter("endDate", endDate)
                    .setParameter("budgetId", budgetId)
                    .getSingleResult();

            if (result == null) {
                return BigDecimal.ZERO;
            }

            return result instanceof BigDecimal ?
                    (BigDecimal) result :
                    BigDecimal.valueOf((Double) result);


        } catch(DataAccessException e) {
            log.error("Error retrieving total spent amount for budget: " + budgetId, e);
            return BigDecimal.ZERO;
        }
    }

}
