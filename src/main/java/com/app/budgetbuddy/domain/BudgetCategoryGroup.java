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
    private List<BPCategory> budgetCategories;

    public BudgetCategoryGroup(String groupName, List<BPCategory> budgetCategories) {
        this.groupName = groupName;
        this.budgetCategories = budgetCategories;
    }

}
