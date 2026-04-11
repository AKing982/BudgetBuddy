package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.List;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPRollingDetail
{
    private List<BPColumn> columns;
    private List<BudgetCategoryGroup> categoryGroups;
    private List<BPCategory> budgetCategories;
    private List<BPAccountBalance> accountBalances;
    private BPGoalsDetail goalsDetail;
    private BPCategory incomeRow;
    private BPCategory savingsRow;
    private boolean isClassic;
    private boolean isGrouped;
}
