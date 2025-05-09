package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@EqualsAndHashCode(callSuper = true)
@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class DailyBudgetRange extends DateRangeBase
{
    private LocalDateTime dateTime;

    public DailyBudgetRange(BigDecimal spentOnRange, String rangeType, boolean isActive, LocalDateTime dateTime) {
        super(spentOnRange, rangeType, isActive);
        this.dateTime = dateTime;
    }
}
