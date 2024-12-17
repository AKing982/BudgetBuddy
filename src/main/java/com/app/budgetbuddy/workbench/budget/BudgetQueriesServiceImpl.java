package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.exceptions.DataAccessException;
import jakarta.persistence.EntityManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetQueriesServiceImpl implements BudgetQueriesService
{
    private EntityManager entityManager;

    @Autowired
    public BudgetQueriesServiceImpl(EntityManager em)
    {
        this.entityManager = em;
    }

    @Override
    public List<BudgetCategory> getTopExpenseBudgetCategories(Long budgetId, LocalDate startDate, LocalDate endDate) {
        final String jpql = """
                   SELECT c.name,
                   SUM(tc.budgetedAmount),
                   SUM(tc.actual), 
                   tc.startDate,
                   tc.endDate
                   FROM TransactionCategoryEntity tc
                   JOIN CategoryEntity c ON tc.category.id = c.id
                   WHERE tc.budget.id = :budgetId
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
                        BigDecimal budgeted = (BigDecimal) row[1];
                        BigDecimal actual = (BigDecimal) row[2];
                        LocalDate categoryStartDate = (LocalDate) row[3];
                        LocalDate categoryEndDate = (LocalDate) row[4];

                        return new BudgetCategory(
                                categoryName,
                                budgeted,
                                actual,
                                budgeted.subtract(actual),
                                new DateRange(categoryStartDate, categoryEndDate)
                        );
                    })
                    .collect(Collectors.toList());

        }catch(DataAccessException e){
            log.error("There was an error retrieving the top expense categories for budget: " + budgetId);
            return Collections.emptyList();
        }
    }

    @Override
    public List<BudgetCategory> getIncomeBudgetCategory(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public List<BudgetCategory> getSavingsBudgetCategory(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public List<BudgetCategory> getExpensesBudgetCategories(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return List.of();
    }

    @Override
    public BigDecimal getTotalBudgeted(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return null;
    }

    @Override
    public BigDecimal getRemainingOnBudget(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return null;
    }

    @Override
    public BigDecimal getTotalSpentOnBudget(Long budgetId, LocalDate startDate, LocalDate endDate) {
        return null;
    }

}
