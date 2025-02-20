package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.BudgetGoals;
import com.app.budgetbuddy.domain.MonthlyBudgetGoals;
import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@Slf4j
public class MonthlyBudgetGoalsBuilder implements BudgetGoalsBuilder<MonthlyBudgetGoals>
{
    private final SubBudgetGoalsService monthlyBudgetGoalsService;

    @Autowired
    public MonthlyBudgetGoalsBuilder(SubBudgetGoalsService subBudgetGoalsService)
    {
        this.monthlyBudgetGoalsService = subBudgetGoalsService;
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

        // Create the SubBudgetEntity

        // Save the SubBudgetEntity


        return Optional.of(monthlyBudgetGoals);
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
