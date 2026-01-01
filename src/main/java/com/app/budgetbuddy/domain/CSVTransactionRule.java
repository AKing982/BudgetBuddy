package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.Objects;

@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@Builder
public class CSVTransactionRule
{
    private Long id;
    private Long userId;
    private CSVRule rule;
    private String value;
    private boolean isActive;

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        CSVTransactionRule that = (CSVTransactionRule) o;
        return isActive == that.isActive && Objects.equals(id, that.id) && Objects.equals(userId, that.userId) && rule == that.rule && Objects.equals(value, that.value);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, userId, rule, value, isActive);
    }
}
