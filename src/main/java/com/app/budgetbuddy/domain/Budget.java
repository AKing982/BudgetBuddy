package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

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
public class Budget
{
    private Long id;
    private BigDecimal budgetAmount;
    private BigDecimal actual;
    private Long userId;
    private String budgetName;
    private String budgetDescription;
    private Integer budgetYear;
    private LocalDate budgetStartDate;
    private Period budgetPeriod;
    private BudgetMode budgetMode;
    private SavingsGoal savingsGoal;
    private LocalDateTime createdDate;
    private List<ControlledBudgetCategory> controlledBudgetCategories = new ArrayList<>();
    private List<BudgetSchedule> budgetSchedules = new ArrayList<>();
}
