package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPSavings;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
@Slf4j
public class BPSavingsService
{
    private final BPForecastingService forecastingService;

    @Autowired
    public BPSavingsService(BPForecastingService forecastingService)
    {
        this.forecastingService = forecastingService;
    }

    public List<BPSavings> getHistoricalSavings(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return null;
    }

    public List<BPSavings> getPredictedSavings(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return null;
    }
}
