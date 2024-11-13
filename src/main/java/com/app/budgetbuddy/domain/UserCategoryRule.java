package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class UserCategoryRule extends CategoryRule
{
    private User user;
    private LocalDateTime createdDate;
    private LocalDateTime modifiedDate;
    private BigDecimal amount;
    private boolean isActive;
    private int priority;

    public UserCategoryRule(String categoryName, String merchantPattern, String descriptionPattern, String frequency, TransactionType transactionType, boolean isRecurring, User user, LocalDateTime createdDate, LocalDateTime modifiedDate, boolean isActive, int priority) {
        super(categoryName, merchantPattern, descriptionPattern, frequency, transactionType, isRecurring);
        this.user = user;
        this.createdDate = createdDate;
        this.modifiedDate = modifiedDate;
        this.isActive = isActive;
        this.priority = priority;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        UserCategoryRule that = (UserCategoryRule) o;
        return isActive == that.isActive && priority == that.priority && Objects.equals(user, that.user) && Objects.equals(createdDate, that.createdDate) && Objects.equals(modifiedDate, that.modifiedDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), user, createdDate, modifiedDate, isActive, priority);
    }
}
