package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.PdeType;
import com.app.budgetbuddy.domain.WeeklyBudgetTrend;

import java.util.List;
import java.util.Map;

public interface MathematicalModelBuilder
{
    void createModel(PdeType type);
}
