package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@EqualsAndHashCode(callSuper = true)
@Data
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class DailyCategorySpending extends CategorySpending
{
    private LocalDate currentDate;

    public DailyCategorySpending(String category, BigDecimal categorySpending, List<Transaction> transactions, LocalDate currentDate)
    {
        super(category, categorySpending, transactions);
        this.currentDate = currentDate;
    }

    public DailyCategorySpending(LocalDate currentDate) {
        this.currentDate = currentDate;
    }
}
