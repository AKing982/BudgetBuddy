package com.app.budgetbuddy.workbench.envelopes;

import com.app.budgetbuddy.domain.BudgetCriteria;
import com.app.budgetbuddy.domain.SubBudget;

import java.util.List;
import java.util.Optional;

public interface EnvelopeBuilder<I, O>
{
    Optional<O> build(I criteria, BudgetCriteria budgetCriteria, List<SubBudget> subBudgets);
}
