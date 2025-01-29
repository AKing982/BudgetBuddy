package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class PreBudgetInfo
{
    private Long userId;
    private LocalDate startMonth;
    private LocalDate endMonth;
    private BigDecimal totalIncome;
    private String budgetName;
    private String budgetDescription;
    private Period budgetPeriod;

}
