package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class Budget
{
    private Long id;
    private BigDecimal budgetAmount;
    private BigDecimal actual;
    private Long userId;
    private String budgetName;
    private String budgetDescription;
    private LocalDate startDate;
    private LocalDate endDate;
    private Period budgetPeriod;
    private BudgetMode budgetMode;
    private BigDecimal savingsAmountAllocated;
    private BigDecimal savingsProgress;
    private int totalMonthsToSave;
    private LocalDateTime createdDate;
    private List<SubBudget> subBudgets = new ArrayList<>();
}
