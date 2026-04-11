package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPIncome;
import com.app.budgetbuddy.workbench.subBudget.HistoricalDataEngine;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class BPIncomeService
{
    private final BPForecastingService forecastingService;
    private final HistoricalDataEngine historicalDataEngine;

    @Autowired
    public BPIncomeService(BPForecastingService forecastingService,
                           HistoricalDataEngine historicalDataEngine)
    {
        this.forecastingService = forecastingService;
        this.historicalDataEngine = historicalDataEngine;
    }

    public List<BPIncome> fetchHistoricalIncomeByDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return null;
    }

    public List<BPIncome> getPredictedIncome(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return null;
    }
}
