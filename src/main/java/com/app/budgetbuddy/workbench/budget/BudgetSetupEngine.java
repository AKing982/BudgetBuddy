package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Component
@Slf4j
public class BudgetSetupEngine
{
    private final BudgetBuilderService budgetBuilderService;
    private final SubBudgetBuilderService subBudgetBuilderService;
    private final SubBudgetOverviewService subBudgetOverviewService;
    private final BudgetHealthService<SubBudget> subBudgetHealthService;
    private final AbstractBudgetStatisticsService<SubBudget> subBudgetStatisticsService;
    private final MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder;
    private final BudgetPeriodCategoryService budgetPeriodCategoryService;

    @Autowired
    public BudgetSetupEngine(BudgetBuilderService budgetBuilderService,
                             SubBudgetBuilderService subBudgetBuilderService,
                             SubBudgetOverviewService subBudgetOverviewService,
                             BudgetHealthService<SubBudget> subBudgetHealthService,
                             @Qualifier("subBudgetStatisticsServiceImpl") AbstractBudgetStatisticsService<SubBudget> subBudgetStatisticsService,
                             BudgetPeriodCategoryService budgetPeriodCategoryService,
                             MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder)
    {
        this.budgetBuilderService = budgetBuilderService;
        this.subBudgetBuilderService = subBudgetBuilderService;
        this.subBudgetOverviewService = subBudgetOverviewService;
        this.subBudgetHealthService = subBudgetHealthService;
        this.subBudgetStatisticsService = subBudgetStatisticsService;
        this.budgetPeriodCategoryService = budgetPeriodCategoryService;
        this.monthlyBudgetGoalsBuilder = monthlyBudgetGoalsBuilder;
    }


    public Map<Long, BudgetHealthScore> createBudgetHealthScoresForSubBudgets(final List<SubBudget> subBudgets)
    {
        if (subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyMap();
        }
        Map<Long, BudgetHealthScore> healthScores = new HashMap<>();
        for(SubBudget subBudget : subBudgets)
        {
            // Skip if subBudget is null
            if(subBudget == null)
            {
                continue;
            }
            // Get health score from service
            BudgetHealthScore healthScore = subBudgetHealthService.calculateHealthScore(subBudget);
            healthScores.put(subBudget.getId(), healthScore);
        }

        return healthScores;
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

    public List<SubBudget> createNewMonthlySubBudgetsForUser(final Budget budget, final BudgetGoals budgetGoals)
    {
        if(budget == null)
        {
            log.warn("Missing Budget... return empty subBudgets");
            return Collections.emptyList();
        }
        try
        {
            return subBudgetBuilderService.createMonthlySubBudgets(budget, budgetGoals);
        }catch(BudgetBuildException e)
        {
            log.error("There was an error build the monthly subbudgets from the budget: ", e);
            return Collections.emptyList();
        }
    }

    /**
     * Creates Monthly Budget Stats for past budgets
     * @param subBudgets
     * @return
     */
    public List<BudgetStats> createMonthlyBudgetStats(final List<SubBudget> subBudgets)
    {
        return Optional.ofNullable(subBudgets)
                .map(budgets -> budgets.stream()
                        .flatMap(subBudget -> subBudgetStatisticsService.getBudgetStats(subBudget).stream())
                        .collect(Collectors.toList()))
                .orElseGet(Collections::emptyList);
    }

    /**
     * Creates a list of IncomeCategory's corresponding to each past SubBudget
     * @param subBudgets
     * @return
     */
    public List<IncomeCategory> createIncomeCategoryForSubBudgets(final List<SubBudget> subBudgets)
    {
        List<IncomeCategory> incomeCategories = new ArrayList<>();
        if(subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        for(SubBudget subBudget : subBudgets)
        {
            Long subBudgetId = subBudget.getId();
            LocalDate subBudgetStartDate = subBudget.getStartDate();
            LocalDate subBudgetEndDate = subBudget.getEndDate();
            Optional<IncomeCategory> incomeCategoryOptional = subBudgetOverviewService.loadIncomeCategory(subBudgetId, subBudgetStartDate, subBudgetEndDate);
            if(incomeCategoryOptional.isEmpty())
            {
                return Collections.emptyList();
            }
            IncomeCategory incomeCategory = incomeCategoryOptional.get();
            incomeCategories.add(incomeCategory);
        }
        return incomeCategories;
    }

    /**
     * Creates ExpenseCategory overview data for past SubBudget data
     * @param subBudgets
     * @return
     */
    public List<ExpenseCategory> createExpenseOverviewCategory(final List<SubBudget> subBudgets)
    {
        if(subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        List<ExpenseCategory> expenseCategories = new ArrayList<>();
        for(SubBudget subBudget : subBudgets)
        {
            Long subBudgetId = subBudget.getId();
            LocalDate subBudgetStartDate = subBudget.getStartDate();
            LocalDate subBudgetEndDate = subBudget.getEndDate();
            Optional<ExpenseCategory> expenseCategoryOptional = subBudgetOverviewService.loadExpenseCategory(subBudgetId, subBudgetStartDate, subBudgetEndDate);
            if(expenseCategoryOptional.isEmpty())
            {
                return Collections.emptyList();
            }
            ExpenseCategory expenseCategory = expenseCategoryOptional.get();
            expenseCategories.add(expenseCategory);
        }
        return expenseCategories;
    }

    /**
     * Creates Savings Category overview data for past subBudgets
     * @param subBudgets
     * @return
     */
    public List<SavingsCategory> createSavingsOverviewCategory(final List<SubBudget> subBudgets)
    {
        if(subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        List<SavingsCategory> savingsCategories = new ArrayList<>();
        for(SubBudget subBudget : subBudgets)
        {
            Long subBudgetId = subBudget.getId();
            LocalDate startDate = subBudget.getStartDate();
            LocalDate endDate = subBudget.getEndDate();
            Optional<SavingsCategory> savingsCategoryOptional = subBudgetOverviewService.loadSavingsCategory(subBudgetId, startDate, endDate);
            if(savingsCategoryOptional.isEmpty())
            {
                return Collections.emptyList();
            }
            SavingsCategory savingsCategory = savingsCategoryOptional.get();
            savingsCategories.add(savingsCategory);
        }
        return savingsCategories;
    }

    /**
     * Creates Top Expense Categories for past subBudgets
     * @param subBudgets
     * @return
     */
    public List<ExpenseCategory> createTopExpensesCategories(final List<SubBudget> subBudgets)
    {
        if(subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        List<ExpenseCategory> topExpenseCategories = new ArrayList<>();
        for(SubBudget subBudget : subBudgets)
        {
            Long subBudgetId = subBudget.getId();
            LocalDate subBudgetStartDate = subBudget.getStartDate();
            LocalDate subBudgetEndDate = subBudget.getEndDate();
            List<ExpenseCategory> topFiveExpenseCategories = subBudgetOverviewService.loadTopExpenseCategories(subBudgetId, subBudgetStartDate, subBudgetEndDate);
            topExpenseCategories.addAll(topFiveExpenseCategories);
        }
        return topExpenseCategories;
    }

    /**
     * Creates BudgetPeriodCategories for past SubBudgets
     * @param subBudgets
     * @return
     */
    public List<BudgetPeriodCategory> createBudgetPeriodCategories(final List<SubBudget> subBudgets)
    {
        if(subBudgets == null || subBudgets.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BudgetPeriodCategory> budgetPeriodCategoriesList = new ArrayList<>();
        for(SubBudget subBudget : subBudgets)
        {
            List<BudgetSchedule> budgetSchedules = subBudget.getBudgetSchedule();
            if(budgetSchedules.size() == 1)
            {
                BudgetSchedule budgetSchedule = budgetSchedules.get(0);
                List<BudgetPeriodCategory> budgetPeriodCategories = budgetPeriodCategoryService.getBudgetPeriodCategories(subBudget, budgetSchedule);
                budgetPeriodCategoriesList.addAll(budgetPeriodCategories);
            }
        }
        return budgetPeriodCategoriesList;
    }
}
