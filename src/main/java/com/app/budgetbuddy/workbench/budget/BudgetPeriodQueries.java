package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;

import com.app.budgetbuddy.exceptions.IllegalDateException;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BudgetPeriodQueries
{
    @PersistenceContext
    private EntityManager entityManager;

    @Autowired
    public BudgetPeriodQueries(EntityManager entityManager){
        this.entityManager = entityManager;
    }

    private void validateDailyBudget(final LocalDate date, final Budget monthlyBudget)
    {
        try
        {
            if(date == null){
                throw new IllegalDateException("INVALID DATE ENTERED: " + date);
            }
            if(monthlyBudget == null){
                throw new IllegalArgumentException("Monthly Budget is null");
            }

        }catch(IllegalDateException e){
            log.error("There was an error with the budget date: ", e);
            throw e;
        }catch(IllegalArgumentException e){
            log.error("There was an error with the budget data: ", e);
            throw e;
        }
    }

    public List<BudgetPeriodParams> getDailyBudgetPeriodQuery(LocalDate date, Budget monthlyBudget)
    {
        validateDailyBudget(date, monthlyBudget);
        final String dailyBudgetQuery = """
        SELECT DISTINCT tc.category.id,
               tc.category.name,
               tc.budgetedAmount,
               COALESCE(daily_trans.total, 0) as actualSpent,
               tc.budgetedAmount - COALESCE(daily_trans.total, 0) as remainingAmount
        FROM TransactionCategoryEntity tc
        JOIN tc.category c
        JOIN tc.budget b
        LEFT JOIN (
            SELECT t.category.id as catId, SUM(t.amount) as total
            FROM TransactionsEntity t
            WHERE t.posted =:date
            GROUP BY t.category.id
            UNION ALL
            SELECT rt.category.id as catId, SUM(rt.lastAmount) as total
            FROM RecurringTransactionEntity rt
            WHERE rt.firstDate <=:date
            AND rt.lastDate >=:date
            AND rt.active = true
            GROUP BY rt.category.id
        ) daily_trans ON tc.category.id = daily_trans.catId
        WHERE tc.startDate <= :date
        AND tc.endDate >= :date
        AND tc.budget.id = :budgetId
        AND tc.isactive = true
        """;

        try {
            List<Object[]> results = entityManager.createQuery(dailyBudgetQuery, Object[].class)
                    .setParameter("date", date)
                    .setParameter("budgetId", monthlyBudget.getId())
                    .getResultList();

            return results.stream()
                    .map(row -> {
                        String categoryName = (String) row[1];
                        BigDecimal budgeted = BigDecimal.valueOf((Double) row[2]);
                        BigDecimal actual = BigDecimal.valueOf((Double) row[3]);

                        return new BudgetPeriodParams(
                                categoryName,
                                budgeted,
                                actual,
                                new DateRange(date, date),
                                BudgetStatus.GOOD
                        );
                    })
                    .collect(Collectors.toList());

        } catch(Exception e) {
            log.error("Error getting daily budget data for date: {} and budget: {}",
                    date, monthlyBudget.getId(), e);
            return null;
        }
    }

    public String createBudgetQueryFromPeriod(final Period period){
        return null;
    }

    private BudgetPeriodParams createBudgetPeriodParams(BigDecimal budgeted, BigDecimal actual, BigDecimal remaining, DateRange dateRange, boolean isOverBudget, BudgetStatus budgetStatus){
        return null;
    }

    public List<BudgetPeriodParams> getWeeklyBudgetPeriodQuery(final List<DateRange> budgetWeeks, final Budget monthlyBudget){
        return null;
    }

    public List<BudgetPeriodParams> getMonthlyBudgetPeriodQuery(final DateRange monthRange, final Budget monthlyBudget){
        return null;
    }

    public List<BudgetPeriodParams> getBiWeeklyBudgetPeriodQuery(final List<DateRange> biWeeks, final Budget budget){
        return null;
    }


}
