package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.domain.math.AbstractMathModel;
import com.app.budgetbuddy.services.PreCalculationCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
public class BPForecastingService
{
    private final PreCalculationCategoryService preCalculationCategoryService;
    private final WeekNumberBuilderService weekNumberBuilderService;
    private final PreCalculationEngine preCalculationEngine;

    @Autowired
    public BPForecastingService(PreCalculationCategoryService preCalculationCategoryService,
                                WeekNumberBuilderService weekNumberBuilderService,
                                PreCalculationEngine preCalculationEngine)
    {
        this.preCalculationCategoryService = preCalculationCategoryService;
        this.weekNumberBuilderService = weekNumberBuilderService;
        this.preCalculationEngine = preCalculationEngine;
    }

    private int calculateNumberOfMonthsSinceCurrentDate(LocalDate currentDate)
    {
        if(currentDate == null)
        {
            return 0;
        }
        final int currentYear = currentDate.getYear();
        final LocalDate budgetStartDate = LocalDate.of(currentYear, 1, 1);
        return (int) budgetStartDate.until(currentDate).toTotalMonths();
    }

    public Map<String, PreCalculationCategory> loadCategoryModels(final Long subBudgetId)
    {
        return null;
    }

    public Map<WeekNumber, List<BPDateRangeAmount>> forecastCategorySpendingByWeek(final Map<String, PreCalculationCategory> categoryModels, final List<WeekNumber> weekNumbers)
    {
        return null;
    }

    public Map<WeekNumber, BPDateRangeAmount> forecastSavingsByWeek(final Map<String, PreCalculationCategory> categoryModels, final List<WeekNumber> weekNumbers)
    {
        return null;
    }

    public Map<WeekNumber, Boolean> forecastGoalsMetByWeek(final Map<String, PreCalculationCategory> categoryModels,
                                                           final List<WeekNumber> weekNumbers)
    {
        return null;
    }

    public BigDecimal forecastIncome(String acctId, DateRange dateRange)
    {
        // load income category models and project forward over dateRange
        return BigDecimal.ZERO;
    }

    public BigDecimal forecastExpenses(String acctId, DateRange dateRange)
    {
        // load expense category models and project forward over dateRange
        return BigDecimal.ZERO;
    }

    public List<BPDateRangeAmount> calculateBalanceTrajectory(final double startingBalance,
                                                              final List<BPDateRangeAmount> periodIncomes,
                                                              final List<BPDateRangeAmount> periodSpending)
    {
        return null;
    }

}
