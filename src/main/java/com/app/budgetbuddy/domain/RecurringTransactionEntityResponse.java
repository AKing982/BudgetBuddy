package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.UserEntity;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class RecurringTransactionEntityResponse
{
    private Long id;
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
