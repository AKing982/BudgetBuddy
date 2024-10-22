package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetPeriod;
import com.app.budgetbuddy.domain.BudgetPeriodParams;
import com.app.budgetbuddy.domain.Period;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

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

    public String createBudgetQueryFromPeriod(final Period period){
        return null;
    }

    public List<BudgetPeriodParams> getMonthlyBudgetPeriodQuery(BudgetPeriod budgetPeriod){
//        Period monthlyPeriod = budgetPeriod.period();
//        if(monthlyPeriod == Period.MONTHLY){
//            String jpql = "SELECT c.name "
//        }
        return null;
    }


    public List<BudgetPeriodParams> getWeeklyBudgetPeriodData(BudgetPeriod budgetPeriod){
        return null;
    }

    public List<BudgetPeriodParams> getBiWeeklyBudgetPeriodData(BudgetPeriod budgetPeriod){
        return null;
    }

    public List<BudgetPeriodParams> getDailyBudgetPeriodData(BudgetPeriod budgetPeriod){
        return null;
    }
}
