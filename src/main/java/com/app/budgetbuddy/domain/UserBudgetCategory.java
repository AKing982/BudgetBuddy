package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class UserBudgetCategory
{
    private Long id;
    private Long userId;
    private String categoryId;
    private String categoryName;
    private Double budgetedAmount;
    private Double budgetActual;
    private Boolean isActive;
    private LocalDate startDate;
    private LocalDate endDate;


}
