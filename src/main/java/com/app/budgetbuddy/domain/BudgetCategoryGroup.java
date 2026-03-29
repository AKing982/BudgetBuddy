package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.List;
import java.util.Objects;

@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class BudgetCategoryGroup
{
    private String groupName;
    private List<BPBudgetCategory> budgetCategories;
    private List<BPRow> rows;

    public BudgetCategoryGroup(String groupName, List<BPBudgetCategory> budgetCategories, List<BPRow> rows) {
        this.groupName = groupName;
        this.budgetCategories = budgetCategories;
        this.rows = rows;
    }

    @Override
    public boolean equals(Object o) {
        if (o == null || getClass() != o.getClass()) return false;
        BudgetCategoryGroup that = (BudgetCategoryGroup) o;
        return Objects.equals(groupName, that.groupName) && Objects.equals(budgetCategories, that.budgetCategories) && Objects.equals(rows, that.rows);
    }

    @Override
    public int hashCode() {
        return Objects.hash(groupName, budgetCategories, rows);
    }
}
