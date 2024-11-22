package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class UserCategoryRule extends CategoryRule
{
    private Long ruleId;
    private Long userId;
    private LocalDateTime createdDate;
    private LocalDateTime modifiedDate;
    private TransactionMatchType descriptionMatchType;
    private String matchByText;
    private boolean isActive;

    public UserCategoryRule(String categoryId, String categoryName, String merchantPattern, String descriptionPattern, String frequency, TransactionType transactionType, boolean isRecurring, int priority, Long userId, LocalDateTime createdDate, LocalDateTime modifiedDate, TransactionMatchType descriptionMatchType, String matchByText, boolean isActive) {
        super(categoryId, categoryName, merchantPattern, descriptionPattern, frequency, transactionType, isRecurring, priority);
        this.userId = userId;
        this.createdDate = createdDate;
        this.modifiedDate = modifiedDate;
        this.descriptionMatchType = descriptionMatchType;
        this.matchByText = matchByText;
        this.isActive = isActive;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        UserCategoryRule that = (UserCategoryRule) o;
        return isActive == that.isActive && Objects.equals(ruleId, that.ruleId) && Objects.equals(userId, that.userId) && Objects.equals(createdDate, that.createdDate) && Objects.equals(modifiedDate, that.modifiedDate) && descriptionMatchType == that.descriptionMatchType && Objects.equals(matchByText, that.matchByText);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), ruleId, userId, createdDate, modifiedDate, descriptionMatchType, matchByText, isActive);
    }

    @Override
    public String toString() {
        return "UserCategoryRule{" +
                "ruleId=" + ruleId +
                ", userId=" + userId +
                ", createdDate=" + createdDate +
                ", modifiedDate=" + modifiedDate +
                ", descriptionMatchType=" + descriptionMatchType +
                ", matchByText='" + matchByText + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
