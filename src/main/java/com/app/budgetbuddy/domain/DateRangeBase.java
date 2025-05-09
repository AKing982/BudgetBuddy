package com.app.budgetbuddy.domain;


import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class DateRangeBase
{
    private BigDecimal spentOnRange;
    private String rangeType;
    private boolean isActive;
}
