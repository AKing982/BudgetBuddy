package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class WeeklyCategorySpending extends CategorySpending
{
    private DateRange weekRange;

    public WeeklyCategorySpending(String category, BigDecimal categorySpending, List<Transaction> transactions, DateRange weekRange)
    {
        super(category, categorySpending, transactions);
        this.weekRange = weekRange;
    }

    public WeeklyCategorySpending(DateRange weekRange) {
        this.weekRange = weekRange;
    }
}
