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
    private Long userId;
    private LocalDateTime createdDate;
    private LocalDateTime modifiedDate;
    private TransactionMatchType descriptionMatchType;
    private String matchByDescription;
    private String matchByMerchant;
    private boolean isActive;

    public UserCategoryRule(String categoryId, String categoryName, String merchantPattern, String descriptionPattern, String frequency, TransactionType transactionType, boolean isRecurring, int priority, Long userId, LocalDateTime createdDate, LocalDateTime modifiedDate, TransactionMatchType descriptionMatchType, String matchByDescription, String matchByMerchant, boolean isActive) {
        super(categoryId, categoryName, merchantPattern, descriptionPattern, frequency, transactionType, isRecurring, priority);
        this.userId = userId;
        this.createdDate = createdDate;
        this.modifiedDate = modifiedDate;
        this.descriptionMatchType = descriptionMatchType;
        this.matchByDescription = matchByDescription;
        this.matchByMerchant = matchByMerchant;
        this.isActive = isActive;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        if (!super.equals(o)) return false;
        UserCategoryRule that = (UserCategoryRule) o;
        return isActive == that.isActive && Objects.equals(userId, that.userId) && Objects.equals(createdDate, that.createdDate) && Objects.equals(modifiedDate, that.modifiedDate) && descriptionMatchType == that.descriptionMatchType && Objects.equals(matchByDescription, that.matchByDescription) && Objects.equals(matchByMerchant, that.matchByMerchant);
    }

    @Override
    public int hashCode() {
        return Objects.hash(super.hashCode(), userId, createdDate, modifiedDate, descriptionMatchType, matchByDescription, matchByMerchant, isActive);
    }

    @Override
    public String toString() {
        return "UserCategoryRule{" +
                "userId=" + userId +
                ", createdDate=" + createdDate +
                ", modifiedDate=" + modifiedDate +
                ", descriptionMatchType=" + descriptionMatchType +
                ", matchByDescription='" + matchByDescription + '\'' +
                ", matchByMerchant='" + matchByMerchant + '\'' +
                ", isActive=" + isActive +
                '}';
    }
}
