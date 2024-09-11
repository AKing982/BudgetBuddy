package com.app.budgetbuddy.services;

import jakarta.persistence.EntityManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class SpendingQueryService
{
    private EntityManager entityManager;

    @Autowired
    public SpendingQueryService(EntityManager entityManager){
        this.entityManager = entityManager;
    }

    public BigDecimal getDailySpendingCalculation(LocalDate today){
        return null;
    }

    public BigDecimal getSpendingCalculationForPeriod(LocalDate today, LocalDate nextDate){
        return null;
    }

    public BigDecimal getAverageMonthlySpendingCalculation(int year){
        return null;
    }

    public BigDecimal getRecurringSpendingTotalCalculation(LocalDate today, LocalDate nextDate){
        return null;
    }

    public BigDecimal getWeeklySpendingTotalCalculation(LocalDate date){
        return null;
    }

    public BigDecimal getBiWeeklySpendingTotalCalculation(LocalDate date){
        return null;
    }
}
