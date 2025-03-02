package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BudgetStatisticsEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.services.BudgetStatisticsService;
import com.app.budgetbuddy.services.SubBudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
public class SubBudgetStatisticsServiceImpl extends AbstractBudgetStatisticsService<SubBudget>
{
    private TreeMap<Integer, List<SubBudget>> yearlySubBudgets = new TreeMap<>();
    private SubBudgetService subBudgetService;

    @Autowired
    public SubBudgetStatisticsServiceImpl(BudgetQueriesService budgetQueriesService,
                                          BudgetCalculations budgetCalculations, BudgetStatisticsService budgetStatisticsService,
                                          SubBudgetService subBudgetService)
    {
        super(budgetQueriesService, budgetCalculations, budgetStatisticsService);
        this.subBudgetService = subBudgetService;
    }

    public BudgetStatisticsEntity convertBudgetStatisticsToEntity(BudgetStats budgetStats)
    {
        Long subBudgetId = budgetStats.getBudgetId();
        BudgetStatisticsEntity budgetStatisticsEntity = new BudgetStatisticsEntity();
        budgetStatisticsEntity.setTotalBudget(budgetStats.getTotalBudget());
        budgetStatisticsEntity.setHealthScore(budgetStats.getHealthScore());
        budgetStatisticsEntity.setTotalSpent(budgetStats.getTotalSpent());
        budgetStatisticsEntity.setAverageSpendingPerDay(budgetStats.getAverageSpendingPerDay());
        budgetStatisticsEntity.setSubBudget(getSubBudgetById(subBudgetId));
        return budgetStatisticsEntity;
    }


    @Override
    public List<BudgetStatisticsEntity> saveBudgetStats(List<BudgetStats> budgets)
    {
        List<BudgetStatisticsEntity> budgetStatisticsEntities = new ArrayList<>();

        try
        {
            for(BudgetStats budgetStats : budgets)
            {
                Long subBudgetId = budgetStats.getBudgetId();
                log.info("Retrieving budget stats for sub-budgetId: {}", subBudgetId);
                BudgetStatisticsEntity budgetStatisticsEntity = convertBudgetStatisticsToEntity(budgetStats);
                budgetStatisticsService.save(budgetStatisticsEntity);
                budgetStatisticsEntities.add(budgetStatisticsEntity);
            }
            return budgetStatisticsEntities;
        }catch(Exception e)
        {
            log.error("There was an error saving the budget stats: ", e);
            return Collections.emptyList();
        }
    }



    @Override
    public Optional<BudgetStatisticsEntity> saveBudgetStatistic(BudgetStats budgetStats)
    {
        if(budgetStats == null){
            return Optional.empty();
        }
        try
        {
             BudgetStatisticsEntity budgetStatisticsEntity = convertBudgetStatisticsToEntity(budgetStats);
             budgetStatisticsService.save(budgetStatisticsEntity);
             return Optional.of(budgetStatisticsEntity);
        }catch(DataAccessException e)
        {
            log.error("There was an error saving the budget stats: ", e);
            return Optional.empty();
        }
    }

    private SubBudgetEntity getSubBudgetById(Long subBudgetId)
    {
        try
        {
            log.info("Getting sub-budget with id: {}", subBudgetId);
            Optional<SubBudgetEntity> subBudgetEntity = subBudgetService.findById(subBudgetId);
            if(subBudgetEntity.isEmpty())
            {
                throw new DataAccessException("Sub budget with id " + subBudgetId + " not found");
            }
            return subBudgetEntity.get();
        }catch(DataAccessException e){
            log.error("There was an error getting the sub budget by id: ", e);
            throw e;
        }
    }

    @Override
    public List<BudgetStats> getBudgetStats(SubBudget subBudget)
    {
        if (subBudget == null)
        {
            return Collections.emptyList();
        }
        LocalDate subBudgetStartDate = subBudget.getStartDate();
        LocalDate subBudgetEndDate = subBudget.getEndDate();
        Long budgetId = subBudget.getBudget().getId();
        try
        {
            BigDecimal subBudgetSavingsTarget = subBudget.getSubSavingsTarget();
            BigDecimal budgetAmount = subBudget.getAllocatedAmount();
            BigDecimal totalSpent = budgetQueriesService.getTotalSpentOnBudget(subBudget.getId(), subBudgetStartDate, subBudgetEndDate);
            BigDecimal remaining = budgetAmount.subtract(totalSpent);
            BigDecimal savings = budgetAmount.subtract(remaining);
            BigDecimal budgetHealthScore = budgetCalculations.calculateTotalBudgetHealth(budgetAmount, totalSpent, subBudgetSavingsTarget);

            BudgetStats subBudgetStats = new BudgetStats(
                    subBudget.getId(),
                    budgetAmount,
                    totalSpent,
                    remaining,
                    savings,
                    budgetHealthScore,
                    budgetCalculations.calculateAverageSpendingPerDayOnBudget(budgetAmount, totalSpent, new BudgetPeriod(Period.MONTHLY, subBudgetStartDate, subBudgetEndDate)),
                    new DateRange(subBudgetStartDate, subBudgetEndDate)
            );

            return List.of(subBudgetStats);

        } catch (Exception e) {
            log.error("Error calculating sub-budget statistics for sub-budget {}: ", subBudget.getId(), e);
            return Collections.emptyList();
        }
    }
}
