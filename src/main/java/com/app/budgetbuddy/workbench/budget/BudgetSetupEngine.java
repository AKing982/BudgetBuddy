package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetStatisticsEntity;
import com.app.budgetbuddy.entities.SubBudgetGoalsEntity;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Component
@Slf4j
public class BudgetSetupEngine
{
    private final BudgetBuilderService budgetBuilderService;
    private final SubBudgetBuilderService subBudgetBuilderService;
    private final MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder;
    private final AbstractBudgetStatisticsService<SubBudget> subBudgetStatisticsService;

    @Autowired
    public BudgetSetupEngine(BudgetBuilderService budgetBuilderService,
                             SubBudgetBuilderService subBudgetBuilderService,
                             MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder,
                             AbstractBudgetStatisticsService<SubBudget> subBudgetStatisticsService)
    {
        this.budgetBuilderService = budgetBuilderService;
        this.subBudgetBuilderService = subBudgetBuilderService;
        this.monthlyBudgetGoalsBuilder = monthlyBudgetGoalsBuilder;
        this.subBudgetStatisticsService = subBudgetStatisticsService;
    }

    private int getPreviousBudgetYear(int currentBudgetYear)
    {
        return currentBudgetYear - 1;
    }

    public Optional<BudgetGoals> createBudgetGoals(final BudgetRegistration budgetRegistration)
    {
        return null;
    }

    public Optional<Budget> createPreviousYearBudget(final BigDecimal previousIncomeAmount, final String previousBudgetName, final Budget budget)
    {
        if(previousIncomeAmount == null || previousBudgetName == null || budget == null)
        {
            return Optional.empty();
        }
        Long userId = budget.getUserId();
        int currentBudgetYear = budget.getBudgetYear();
        int previousBudgetYear = getPreviousBudgetYear(currentBudgetYear);

        // Return empty if the previous year calculation resulted in a negative or invalid year
        if(previousBudgetYear <= 0)
        {
            return Optional.empty();
        }

        Budget previousYearBudget = new Budget();
        // Set basic information
        previousYearBudget.setBudgetYear(previousBudgetYear);
        previousYearBudget.setBudgetName(previousBudgetName);
        previousYearBudget.setUserId(userId);

        // Set date range for the previous year
        LocalDate startDate = LocalDate.of(previousBudgetYear, 1, 1);
        LocalDate endDate = LocalDate.of(previousBudgetYear, 12, 31);
        previousYearBudget.setStartDate(startDate);
        previousYearBudget.setEndDate(endDate);

        // Set financial information
        previousYearBudget.setIncome(previousIncomeAmount);
        previousYearBudget.setBudgetAmount(previousIncomeAmount);

        // Copy settings from current budget
        previousYearBudget.setBudgetMode(budget.getBudgetMode());
        previousYearBudget.setBudgetPeriod(budget.getBudgetPeriod());
        previousYearBudget.setTotalMonthsToSave(budget.getTotalMonthsToSave());

        // Initialize other values
        previousYearBudget.setSavingsAmountAllocated(BigDecimal.ZERO);
        previousYearBudget.setSavingsProgress(BigDecimal.ZERO);
        previousYearBudget.setSubBudgets(new ArrayList<>());

        return Optional.of(previousYearBudget);
    }

    public Optional<Budget> createNewBudget(final BudgetRegistration budgetRegistration)
    {
        if(budgetRegistration == null)
        {
            log.warn("Missing Budget Registration... Returning empty budget");
            return Optional.empty();
        }
        try
        {
            return budgetBuilderService.buildBudgetFromRegistration(budgetRegistration);

        }catch(BudgetBuildException e)
        {
            log.error("There was an error building the budget from the registration: ", e);
            return Optional.empty();
        }
    }

    private boolean isSubBudgetInCurrentYear(final SubBudget subBudget, final int currentYear)
    {
        if(subBudget.getStartDate() == null)
        {
            return false;
        }
        return subBudget.getStartDate().getYear() == currentYear;
    }

    public List<BudgetStatisticsEntity> saveBudgetStats(final List<BudgetStats> budgetStatsList, final Long subBudgetId)
    {
        if(budgetStatsList == null || budgetStatsList.isEmpty())
        {
            return Collections.emptyList();
        }
        return subBudgetStatisticsService.saveBudgetStats(budgetStatsList, subBudgetId);
    }

    private int getCurrentYear()
    {
        return LocalDate.now().getYear();
    }

    public List<BudgetStats> createBudgetStatistics(final List<SubBudget> subBudgets)
    {
        if(subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BudgetStats> budgetStatsList = new ArrayList<>();
        int currentYear = getCurrentYear();
        try
        {
            for(SubBudget subBudget : subBudgets)
            {
                if(isSubBudgetInCurrentYear(subBudget, currentYear))
                {
                    List<BudgetStats> budgetStats = subBudgetStatisticsService.getBudgetStats(subBudget);
                    budgetStatsList.addAll(budgetStats);
                }
                else
                {
                    BudgetStats zeroedStats = createZeroValueBudgetStats(subBudget);
                    budgetStatsList.add(zeroedStats);
                }
            }
            return budgetStatsList;
        }catch(BudgetBuildException e)
        {
            log.error("There was an error building the budget statistics from the sub budgets: ", e);
            return Collections.emptyList();
        }
    }

    /**
     * Creates a BudgetStats object with zero values for financial metrics
     * @param subBudget The SubBudget to create stats for
     * @return A BudgetStats object with zero values
     */
    private BudgetStats createZeroValueBudgetStats(SubBudget subBudget)
    {
        DateRange dateRange = new DateRange(
                subBudget.getStartDate(),
                subBudget.getEndDate()
        );

        // Create stats with basic info but zero financial values
        return new BudgetStats(
                subBudget.getId(),
                subBudget.getAllocatedAmount() != null ? subBudget.getAllocatedAmount() : BigDecimal.ZERO,  // totalBudget
                BigDecimal.ZERO,  // totalSpent
                subBudget.getAllocatedAmount() != null ? subBudget.getAllocatedAmount() : BigDecimal.ZERO,  // remaining (full budget)
                BigDecimal.ZERO,  // totalSaved
                BigDecimal.ZERO,  // averageSpendingPerDay
                BigDecimal.ZERO,  // healthScore
                dateRange
        );
    }

    /**
     * This will create Monthly Budget Goals for previous subBudgets (e.g. months) up to the current date
     * @param budgetGoals
     * @param subBudgets
     * @return
     */
    public List<MonthlyBudgetGoals> createMonthlyBudgetGoalsForSubBudgets(final BudgetGoals budgetGoals, final List<SubBudget> subBudgets)
    {
        if(budgetGoals == null || subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        List<MonthlyBudgetGoals> monthlyBudgetGoals = new ArrayList<>();
        for(SubBudget subBudget : subBudgets)
        {
            Long subBudgetId = subBudget.getId();
            log.info("Creating monthly budget goal for subBudgetId: {}", subBudgetId);
            Optional<MonthlyBudgetGoals> monthlyBudgetGoalsOptional = monthlyBudgetGoalsBuilder.createBudgetGoal(budgetGoals, subBudgetId);
            if(monthlyBudgetGoalsOptional.isEmpty())
            {
                return Collections.emptyList();
            }
            MonthlyBudgetGoals monthlyBudgetGoal = monthlyBudgetGoalsOptional.get();
            monthlyBudgetGoals.add(monthlyBudgetGoal);
        }
        return monthlyBudgetGoals;
    }

    public List<SubBudget> createSubBudgetTemplatesForYear(int year, Budget budget, BudgetGoals budgetGoals)
    {
        if(year < 1 || budgetGoals == null || budget == null)
        {
            return Collections.emptyList();
        }
        try
        {
            return subBudgetBuilderService.createSubBudgetTemplates(year, budget, budgetGoals);
        }catch(BudgetBuildException e)
        {
            log.error("There was an error building the subBudget templates: ", e);
            return Collections.emptyList();
        }
    }


    /**
     * This will create the SubBudgets for a particular budget up to the current date
     * @param budget
     * @param budgetGoals
     * @return
     */
    public List<SubBudget> createNewMonthlySubBudgetsForUser(final Budget budget, final BudgetGoals budgetGoals)
    {
        if(budget == null)
        {
            log.warn("Missing Budget... return empty subBudgets");
            return Collections.emptyList();
        }
        try
        {
            List<SubBudget> subBudgets = subBudgetBuilderService.createMonthlySubBudgetsToDate(budget, budgetGoals);
            log.info("Created subBudgets for user: {}", subBudgets.toString());
            return subBudgets;
        }catch(BudgetBuildException e)
        {
            log.error("There was an error build the monthly subbudgets from the budget: ", e);
            return Collections.emptyList();
        }
    }

    public List<SubBudgetGoalsEntity> saveMonthlyBudgetGoals(List<MonthlyBudgetGoals> monthlyBudgetGoals)
    {
        if(monthlyBudgetGoals == null || monthlyBudgetGoals.isEmpty())
        {
            return Collections.emptyList();
        }
        return monthlyBudgetGoalsBuilder.saveBudgetGoals(monthlyBudgetGoals);
    }

}
