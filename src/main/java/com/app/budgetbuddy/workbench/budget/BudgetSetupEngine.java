package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.repositories.RecurringTransactionsRepository;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.TransactionDataLoaderImpl;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.jdbc.core.support.AbstractLobCreatingPreparedStatementCallback;
import org.springframework.security.core.parameters.P;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
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
    private final MonthlyBudgetGoalService monthlyBudgetGoalService;
    private final BudgetPeriodCategoryService budgetPeriodCategoryService;

    @Autowired
    public BudgetSetupEngine(BudgetBuilderService budgetBuilderService,
                             SubBudgetBuilderService subBudgetBuilderService,
                             SubBudgetOverviewService subBudgetOverviewService,
                             BudgetHealthService<SubBudget> subBudgetHealthService,
                             @Qualifier("subBudgetStatisticsServiceImpl") AbstractBudgetStatisticsService<SubBudget> subBudgetStatisticsService,
                             BudgetPeriodCategoryService budgetPeriodCategoryService,
                             MonthlyBudgetGoalService monthlyBudgetGoalService)
    {
        this.budgetBuilderService = budgetBuilderService;
        this.subBudgetBuilderService = subBudgetBuilderService;
        this.subBudgetOverviewService = subBudgetOverviewService;
        this.subBudgetHealthService = subBudgetHealthService;
        this.subBudgetStatisticsService = subBudgetStatisticsService;
        this.budgetPeriodCategoryService = budgetPeriodCategoryService;
        this.monthlyBudgetGoalService = monthlyBudgetGoalService;
    }


    public Map<Long, BudgetHealthScore> createBudgetHealthScoresForSubBudget(final Long subBudgetId, LocalDate startDate, LocalDate endDate)
    {
        return null;
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

    public List<BudgetStats> createMonthlyBudgetStats(final List<SubBudget> subBudgets)
    {
        return Optional.ofNullable(subBudgets)
                .map(budgets -> budgets.stream()
                        .flatMap(subBudget -> subBudgetStatisticsService.getBudgetStats(subBudget).stream())
                        .collect(Collectors.toList()))
                .orElseGet(Collections::emptyList);
    }

    /**
     * Creates a list of IncomeCategory's corresponding to each SubBudget
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
