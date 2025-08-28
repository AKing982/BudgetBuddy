package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.domain.math.AbstractMathModel;

public record PreCalculationCategory(String category, AbstractMathModel spendingModel, AbstractMathModel budgetModel, AbstractMathModel savingsModel, AbstractMathModel goalsModel) { }
