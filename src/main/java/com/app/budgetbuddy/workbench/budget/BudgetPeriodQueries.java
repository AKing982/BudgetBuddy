package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Service
public class BudgetPeriodQueries
{
    @PersistenceContext
    private EntityManager entityManager;
    private BudgetCalculator budgetCalculator;

    @Autowired
    public BudgetPeriodQueries(EntityManager entityManager,
                               BudgetCalculator budgetCalculator){
        this.entityManager = entityManager;
        this.budgetCalculator = budgetCalculator;
    }

    public List<DateRange> calculatePeriodDateRanges(LocalDate selectedDate, Period period) {
        return null;
    }

    public String createBudgetQueryFromPeriod(final Period period){
        return null;
    }

    private BudgetPeriodParams createBudgetPeriodParams(BigDecimal budgeted, BigDecimal actual, BigDecimal remaining, DateRange dateRange, boolean isOverBudget, BudgetStatus budgetStatus){
        return null;
    }

    public List<BudgetPeriodParams> getMonthlyBudgetPeriodQuery(BudgetPeriod budgetPeriod){
//        Period monthlyPeriod = budgetPeriod.period();
//        if(monthlyPeriod == Period.MONTHLY){
//            String jpql = "SELECT c.name "
//        }
        return null;
    }


    public List<BudgetPeriodParams> getWeeklyBudgetPeriodQuery(BudgetPeriod budgetPeriod){
        return null;
    }

    public List<BudgetPeriodParams> getBiWeeklyBudgetPeriodQuery(BudgetPeriod budgetPeriod){
        return null;
    }

    public List<BudgetPeriodParams> getDailyBudgetPeriodQuery(BudgetPeriod budgetPeriod){
        return null;
    }
}
