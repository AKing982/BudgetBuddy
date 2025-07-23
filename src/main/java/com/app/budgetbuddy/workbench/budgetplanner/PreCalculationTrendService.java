package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.EntryType;
import com.app.budgetbuddy.domain.PreCalculationEntry;
import com.app.budgetbuddy.domain.SubBudgetTrend;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class PreCalculationTrendService
{
    private Map<String, SubBudgetTrend> budgetTrendsByMonth = new HashMap<>();
    private Map<String, Map<String, BigDecimal>> fixedMonthlySpendingTrendsByCategory = new HashMap<>();
    private Map<String, Map<String, BigDecimal>> monthlyVariableExpensesTrendsByCategory = new HashMap<>();
    private Map<String, Map<String, BigDecimal>> monthlySavingsTrendsByCategory = new HashMap<>();
    private Map<String, BigDecimal> monthlyGoalsTrends = new HashMap<>();

    public double calculateTrendPercentageFormulaForNthMonth(double monthStartAmount, double monthEndAmount, int numberOfMonths)
    {
        return 0.0;
    }

    public double calculateTrendPercentageFormula(double monthStartAmount, double monthEndAmount)
    {
        return 0.0;
    }

    public Optional<SubBudgetTrend> calculateTrendForNthMonths(int numberOfMonths, EntryType entryType)
    {
        return Optional.empty();
    }

    public Map<String, SubBudgetTrend> createSubBudgetTrendsByMonth(final DateRange monthRange, final BigDecimal totalSpendingTrend, final BigDecimal totalSavingsTrend, final BigDecimal totalGoalTrend)
    {
        return null;
    }

    public Map<String, Map<String, BigDecimal>> calculateFixedMonthlySpendingTotalByCategory(DateRange dateRange, List<PreCalculationEntry> precalculationEntries)
    {
        return null;
    }

    public Map<String, Map<String, BigDecimal>> calculateMonthlyIncomeTotalByCategory(DateRange dateRange, List<PreCalculationEntry> preCalculationEntries)
    {
        return null;
    }

    public Map<String, Map<String, BigDecimal>> calculateMonthlyVariableExpensesTotalByCategory(DateRange dateRange, List<PreCalculationEntry> preCalculationEntries)
    {
        return null;
    }

}
