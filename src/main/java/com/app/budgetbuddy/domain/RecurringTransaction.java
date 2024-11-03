package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class RecurringTransaction
{
    private Long userId;
    private String accountId;
    private String streamId;
    private String categoryId;
    private String description;
    private String merchantName;
    private LocalDate firstDate;
    private LocalDate lastDate;
    private String frequency;
    private BigDecimal averageAmount;
    private BigDecimal lastAmount;
    private Boolean active;
    private String type;
}
