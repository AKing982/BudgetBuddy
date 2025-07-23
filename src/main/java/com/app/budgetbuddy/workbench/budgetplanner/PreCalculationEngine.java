package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.domain.math.FourierSeries;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import com.app.budgetbuddy.services.SubBudgetService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class PreCalculationEngine
{
    private final PreCalculationThreadService preCalculationThreadService;
    private final FourierSeriesEngine fourierSeriesEngine;
    private final PreCalculationTrendService preCalculationTrendService;
    private final CategoryTypeProcessor categoryTypeProcessor;
    private final MathematicalModelBuilder mathematicalModelBuilder;

    @Autowired
    public PreCalculationEngine(PreCalculationThreadService preCalculationThreadService,
                                FourierSeriesEngine fourierSeriesEngine,
                                PreCalculationTrendService preCalculationTrendService,
                                CategoryTypeProcessor categoryTypeProcessor,
                                MathematicalModelBuilder mathematicalModelBuilder)
    {
       this.preCalculationThreadService = preCalculationThreadService;
       this.fourierSeriesEngine = fourierSeriesEngine;
       this.preCalculationTrendService = preCalculationTrendService;
       this.categoryTypeProcessor = categoryTypeProcessor;
       this.mathematicalModelBuilder = mathematicalModelBuilder;
    }

    public Map<String, Map<String, FourierSeries>> createFourierSeriesModelForWeek(final BudgetScheduleRange budgetWeek, final List<PreCalculationEntry> preCalculationEntries)
    {
        return null;
    }

    public Map<String, List<PreCalculationGoalEntry>> getPrecalculationGoalEntriesByMonth(final List<BudgetCategory> budgetCategories, final SubBudgetGoals subBudgetGoals, final SubBudget subBudget)
    {
        return null;
    }

    public Map<String, List<PreCalculationEntry>> getPrecalculationEntriesByMonth(final List<BudgetCategory> budgetCategories, final SubBudget subBudget)
    {
        return null;
    }

    public Map<String, List<SubBudgetGoals>> getSubBudgetGoalsByWeek(final BudgetScheduleRange budgetWeek, final SubBudgetGoals subBudgetGoals)
    {
        return null;
    }

    public Map<String, List<BudgetCategory>> getBudgetCategoriesByWeek(final BudgetScheduleRange budgetScheduleRange, final SubBudget subBudget)
    {
        return null;
    }
}
