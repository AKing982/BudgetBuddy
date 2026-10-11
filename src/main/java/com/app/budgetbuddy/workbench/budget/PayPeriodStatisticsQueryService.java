package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.PayPeriodStatistics;
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

    public List<PayPeriodStatistics> loadPayPeriodStatistics(Long subBudgetId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            if(subBudgetId == null || startDate == null || endDate == null)
            {
                throw new DataException("subBudgetId or start date cannot be null");
            }
        }catch(DataException e){
            log.error("Error loading pay period statistics: ", e);
            return Collections.emptyList();
        }
        return null;
    }




}
