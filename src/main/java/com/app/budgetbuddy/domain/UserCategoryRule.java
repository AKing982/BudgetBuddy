package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class UserCategoryRule extends CategoryRule
{
    private Long userId;
    private LocalDateTime createdDate;
    private LocalDateTime modifiedDate;
    private boolean isActive;

    public UserCategoryRule(String categoryName, String merchantPattern, String descriptionPattern, String frequency, TransactionType transactionType, boolean isRecurring, int priority, Long userId, LocalDateTime createdDate, LocalDateTime modifiedDate, boolean isActive) {
        super(categoryName, merchantPattern, descriptionPattern, frequency, transactionType, isRecurring, priority);
        this.userId = userId;
        this.createdDate = createdDate;
        this.modifiedDate = modifiedDate;
        this.isActive = isActive;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        UserCategoryRule that = (UserCategoryRule) o;
        return isActive == that.isActive && Objects.equals(userId, that.userId) && Objects.equals(createdDate, that.createdDate) && Objects.equals(modifiedDate, that.modifiedDate);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), userId, createdDate, modifiedDate, isActive);
    }
}
