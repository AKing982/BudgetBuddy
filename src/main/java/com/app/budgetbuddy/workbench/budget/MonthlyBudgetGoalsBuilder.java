package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetGoals;
import com.app.budgetbuddy.domain.MonthlyBudgetGoals;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import com.app.budgetbuddy.entities.SubBudgetEntity;
import com.app.budgetbuddy.entities.SubBudgetGoalsEntity;
import com.app.budgetbuddy.services.BudgetGoalsService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import com.app.budgetbuddy.services.SubBudgetService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class MonthlyBudgetGoalsBuilder extends BudgetGoalsBuilder<MonthlyBudgetGoals>
{
    private final SubBudgetGoalsService monthlyBudgetGoalsService;
    private final SubBudgetService subBudgetService;

    @Autowired
    public MonthlyBudgetGoalsBuilder(SubBudgetGoalsService subBudgetGoalsService,
                                     BudgetGoalsService budgetGoalsService,
                                     SubBudgetService subBudgetService)
    {
        super(budgetGoalsService);
        this.monthlyBudgetGoalsService = subBudgetGoalsService;
        this.subBudgetService = subBudgetService;
    }

    @Override
    public Optional<MonthlyBudgetGoals> createBudgetGoal(final BudgetGoals budgetGoals, final Long subBudgetId)
    {
        double monthlyTargetAmount = budgetGoals.getTargetAmount() / 12;
        double remainingAmount = budgetGoals.getTargetAmount() - budgetGoals.getCurrentSavings();
        MonthlyBudgetGoals monthlyBudgetGoals = new MonthlyBudgetGoals(
                null,  // id will be generated
                subBudgetId,  // subBudgetId will be set later
                budgetGoals.getBudgetId(),
                BigDecimal.valueOf(monthlyTargetAmount),
                BigDecimal.valueOf(budgetGoals.getCurrentSavings()),
                BigDecimal.valueOf(100),  // initial goal score
                BigDecimal.valueOf(remainingAmount),
                determineInitialStatus(budgetGoals)
        );
        return Optional.of(monthlyBudgetGoals);
    }

    @Override
    public List<SubBudgetGoalsEntity> saveBudgetGoals(List<MonthlyBudgetGoals> budgetGoals)
    {
        List<SubBudgetGoalsEntity> subBudgetGoalsEntities = new ArrayList<>();
        try
        {
            for(MonthlyBudgetGoals monthlyBudgetGoals: budgetGoals)
            {
                SubBudgetGoalsEntity subBudgetGoalsEntity = new SubBudgetGoalsEntity();
                subBudgetGoalsEntity.setBudgetGoals(getBudgetGoalsEntity(monthlyBudgetGoals.getBudgetGoalId()));
                subBudgetGoalsEntity.setGoalScore(monthlyBudgetGoals.getGoalScore());
                subBudgetGoalsEntity.setId(monthlyBudgetGoals.getId());
                subBudgetGoalsEntity.setMonthlyStatus(monthlyBudgetGoals.getMonthlyStatus());
                subBudgetGoalsEntity.setRemainingAmount(monthlyBudgetGoals.getRemainingAmount());
                subBudgetGoalsEntity.setMonthlySavingsTarget(monthlyBudgetGoals.getMonthlySavingsTarget());
                subBudgetGoalsEntity.setMonthlyContributed(monthlyBudgetGoals.getMonthlyContributed());
                subBudgetGoalsEntity.setSubBudgetEntity(getSubBudgetEntityById(monthlyBudgetGoals.getSubBudgetId()));
                monthlyBudgetGoalsService.save(subBudgetGoalsEntity);
                log.info("Successfully saved Monthly Budget Goals....");
                subBudgetGoalsEntities.add(subBudgetGoalsEntity);
            }
            return subBudgetGoalsEntities;
        }catch(Exception e)
        {
            log.error("There was an error saving the monthly budget goals: ", e);
            return Collections.emptyList();
        }
    }

    private SubBudgetEntity getSubBudgetEntityById(Long id)
    {
        Optional<SubBudgetEntity> subBudgetEntity = subBudgetService.findById(id);
        return subBudgetEntity.orElseThrow(() -> new IllegalArgumentException("Sub budget id " + id + " not found"));
    }

    private BudgetGoalsEntity getBudgetGoalsEntity(Long id)
    {
        Optional<BudgetGoalsEntity> budgetGoalsEntityOptional = getBudgetGoalsById(id);
        return budgetGoalsEntityOptional.orElseThrow(() -> new RuntimeException("There was an error getting the budget goals entity"));
    }

    private String determineInitialStatus(BudgetGoals budgetGoals) {
        if (budgetGoals.getCurrentSavings() >= budgetGoals.getTargetAmount()) {
            return "COMPLETED";
        } else if (budgetGoals.getCurrentSavings() > 0) {
            return "IN_PROGRESS";
        }
        return "NOT_STARTED";
    }
}
