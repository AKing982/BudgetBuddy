package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetEntity;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.BudgetStatisticsEntity;
import com.app.budgetbuddy.entities.SubBudgetGoalsEntity;
import com.app.budgetbuddy.exceptions.BudgetBuildException;
import com.app.budgetbuddy.workbench.BudgetCategoryThreadService;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.task.TaskExecutor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;

@Component
@Slf4j
public class BudgetSetupEngine
{
    private final BudgetBuilderService budgetBuilderService;
    private final SubBudgetBuilderService subBudgetBuilderService;
    private final MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder;
    private final AbstractBudgetStatisticsService<SubBudget> subBudgetStatisticsService;
    private final BudgetCategoryThreadService budgetCategoryThreadService;

    @Autowired
    public BudgetSetupEngine(BudgetBuilderService budgetBuilderService,
                             SubBudgetBuilderService subBudgetBuilderService,
                             MonthlyBudgetGoalsBuilder monthlyBudgetGoalsBuilder,
                             AbstractBudgetStatisticsService<SubBudget> subBudgetStatisticsService,
                             BudgetCategoryThreadService budgetCategoryThreadService)
    {
        this.budgetBuilderService = budgetBuilderService;
        this.subBudgetBuilderService = subBudgetBuilderService;
        this.monthlyBudgetGoalsBuilder = monthlyBudgetGoalsBuilder;
        this.subBudgetStatisticsService = subBudgetStatisticsService;
        this.budgetCategoryThreadService = budgetCategoryThreadService;
    }

    private int getPreviousBudgetYear(int currentBudgetYear)
    {
        return currentBudgetYear - 1;
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

        try
        {
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
            previousYearBudget.setActual(BigDecimal.ZERO);
            // Set a distinct budget description for the previous year
            previousYearBudget.setBudgetDescription("Budget for " + previousBudgetName + " - Previous year savings plan");

            // Initialize other values
            previousYearBudget.setSavingsAmountAllocated(BigDecimal.ZERO);
            previousYearBudget.setSavingsProgress(BigDecimal.ZERO);
            previousYearBudget.setSubBudgets(new ArrayList<>());

            Optional<BudgetEntity> savedBudgetEntity = budgetBuilderService.saveBudget(previousYearBudget);
            if(savedBudgetEntity.isEmpty()){
                log.warn("Couldn't save previous year budget");
            }
            BudgetEntity budgetEntity = savedBudgetEntity.get();
            log.info("Saved BudgetEntity with ID: {}", budgetEntity.getId());

            // Step 3: Create BudgetGoals for the previous year budget
            BudgetGoals previousGoals = BudgetGoals.builder()
                    .budgetId(budgetEntity.getId())
                    .targetAmount(0.0) // Placeholder; adjust if historical data exists
                    .monthlyAllocation(0.0)
                    .currentSavings(0.0)
                    .goalName("Previous Year Savings Placeholder")
                    .goalDescription("Placeholder goal for " + previousBudgetName)
                    .goalType("SAVINGS")
                    .savingsFrequency("monthly")
                    .status("INACTIVE")
                    .build();

            // Step 4: Save BudgetGoals and extract BudgetGoalsEntity
            Optional<BudgetGoalsEntity> savedGoalsEntityOpt = budgetBuilderService.saveBudgetGoals(previousGoals);
            if (savedGoalsEntityOpt.isEmpty()) {
                log.warn("Couldn't save BudgetGoals for previous year budget ID: {}", budgetEntity.getId());
                // Proceed without goals; adjust if goals are mandatory
            }

            Budget savedBudget = budgetBuilderService.convertBudgetEntity(budgetEntity);
            return Optional.of(savedBudget);

        }catch(BudgetBuildException e){
            log.error("There was an error building the previous year budget: ", e);
            return Optional.empty();
        }
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

    public List<BudgetStatisticsEntity> saveBudgetStats(final List<BudgetStats> budgetStatsList)
    {
        if(budgetStatsList == null || budgetStatsList.isEmpty())
        {
            return Collections.emptyList();
        }
        return subBudgetStatisticsService.saveBudgetStats(budgetStatsList);
    }

    public List<BudgetStats> createBudgetStatistics(final List<SubBudget> subBudgets)
    {
        if (subBudgets == null || subBudgets.isEmpty())
        {
            log.warn("SubBudgets list is null or empty—returning empty list");
            return Collections.emptyList();
        }

        List<BudgetStats> budgetStatsList = new ArrayList<>();
        try
        {
            for (SubBudget subBudget : subBudgets)
            {
                // Create a stats template for each sub-budget, regardless of year or date
                BigDecimal budgetAmount = subBudget.getAllocatedAmount() != null ? subBudget.getAllocatedAmount() : BigDecimal.ZERO;
                BudgetStats statsTemplate = new BudgetStats(
                        subBudget.getId(),
                        budgetAmount,              // totalBudget from allocatedAmount
                        BigDecimal.ZERO,           // totalSpent (no transactions yet)
                        budgetAmount,              // remaining (all budget remains)
                        BigDecimal.ZERO,           // totalSaved (no savings yet)
                        BigDecimal.ZERO,           // averageSpendingPerDay (no spending)
                        BigDecimal.ZERO,           // healthScore (initially 0)
                        new DateRange(subBudget.getStartDate(), subBudget.getEndDate())
                );
                Optional<BudgetStatisticsEntity> budgetStatisticsEntityOptional = subBudgetStatisticsService.saveBudgetStatistic(statsTemplate);
                if(budgetStatisticsEntityOptional.isEmpty())
                {
                    return Collections.emptyList();
                }
                BudgetStatisticsEntity budgetStatisticsEntity = budgetStatisticsEntityOptional.get();
                log.info("Saved Budget Statistics: {}", budgetStatisticsEntity);
                budgetStatsList.add(statsTemplate);
                log.info("Created stats template for subBudget ID {}: {}", subBudget.getId(), statsTemplate);
            }
            return budgetStatsList;
        } catch (Exception e) { // Broader catch since no BudgetBuildException expected
            log.error("Error creating budget statistics templates from sub-budgets: ", e);
            return Collections.emptyList();
        }
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
            List<SubBudget> subBudgets = subBudgetBuilderService.createSubBudgetTemplates(year, budget, budgetGoals);
            log.info("Created sub-Budget templates: {}", subBudgets);
            return subBudgets;
        }catch(BudgetBuildException e)
        {
            log.error("There was an error building the subBudget templates: ", e);
            return Collections.emptyList();
        }
    }

    public List<SubBudget> createNewMonthlySubBudgetsForUser(final Budget budget, final BudgetGoals budgetGoals)
    {
        if (budget == null || budgetGoals == null)
        {
            log.warn("Missing Budget or BudgetGoals... returning empty subBudgets");
            return Collections.emptyList();
        }
        try
        {
            int budgetYear = budget.getBudgetYear();
            List<SubBudget> allSubBudgets = subBudgetBuilderService.createSubBudgetTemplates(budgetYear, budget, budgetGoals);
            if(allSubBudgets.isEmpty())
            {
                log.warn("No subBudgets created for budgetID: {} in year {}", budget.getId(), budgetYear);
                return Collections.emptyList();
            }
            log.info("Created and saved subBudgets for user: {}", allSubBudgets);
            log.info("Successfully saved subBudgets for budget ID: {}", budget.getId());
            return allSubBudgets;
        } catch (BudgetBuildException e) {
            log.error("Error building monthly subBudgets from budget ID {}: ", budget.getId(), e);
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Unexpected error in subBudget creation for budget ID {}: ", budget.getId(), e);
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
