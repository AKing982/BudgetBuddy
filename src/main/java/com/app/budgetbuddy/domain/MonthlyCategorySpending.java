package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class MonthlyCategorySpending extends CategorySpending
{
    private List<DateRangeSpending> weeklySpending = new ArrayList<>();

    public MonthlyCategorySpending(String category, BigDecimal totalCategorySpending, List<Transaction> transactions, List<DateRangeSpending> weeklySpending)
    {
        super(category, totalCategorySpending, transactions);
        this.weeklySpending = weeklySpending;
    }
}
