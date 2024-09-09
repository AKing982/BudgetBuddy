package com.app.budgetbuddy.domain;

import java.math.BigDecimal;

public record SpendingCategory(Category category, BigDecimal spending, double percentageOfSpending) {

}
