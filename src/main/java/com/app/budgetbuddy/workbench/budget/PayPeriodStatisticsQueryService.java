package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.PayPeriodStatisticsService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class PayPeriodStatisticsQueryService
{
    private final PayPeriodStatisticsService payPeriodStatisticsService;

    @PersistenceContext
    private final EntityManager entityManager;

    @Autowired
    public PayPeriodStatisticsQueryService(PayPeriodStatisticsService payPeriodStatisticsService,
                                            EntityManager entityManager)
    {
        this.payPeriodStatisticsService = payPeriodStatisticsService;
        this.entityManager = entityManager;
    }

    public List<ExpenseCategory> loadExpenses(final Long subBudgetId, final LocalDate startDate, final LocalDate endDate)
    {
        try
        {
            if(subBudgetId == null || startDate == null || endDate == null)
            {
                throw new DataException("Invalid parameters provided to loadExpenses");
            }
        }catch(DataException e){
            log.error("Error loading expenses for subBudgetId {} between {} and {}: {}", subBudgetId, startDate, endDate, e.getMessage(), e);
            return Collections.emptyList();
        }
        return null;
    }

    public List<RecurringCategory> loadRecurring(Long subBudgetId, LocalDate startDate, LocalDate endDate, RecurringType recurringType)
    {
        return null;
    }

    public List<IncomeCategory> loadIncomes(Long subBudgetId, LocalDate startDate, LocalDate endDate)
    {
        return null;
    }

    public Integer loadDaysLeftTillNextIncome(Long subBudgetId, LocalDate startDate, LocalDate endDate)
    {
        return 0;
    }

}
