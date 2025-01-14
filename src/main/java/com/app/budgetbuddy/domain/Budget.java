package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
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
