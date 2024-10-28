package com.app.budgetbuddy.domain;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
public class Budget
{
    private Long id;
    private BigDecimal budgetAmount;
    private BigDecimal actual;
    private Long userId;
    private String budgetName;
    private String budgetDescription;
    private LocalDateTime createdDate;
}
