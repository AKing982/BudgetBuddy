package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Deprecated
public class BPKpiDetail
{
    private BPDateRangeAmount totalIncome;        // "$5k" card
    private BPDateRangeAmount totalExpenses;      // "$4k" card
    private BPDateRangeAmount totalBalance;       // "$725" card
    private BigDecimal savedPercent;              // "+14%" card
    private List<BudgetCategoryGroup> categoryGroups;   // spending donut
    private List<BPAccountBalance> accountBalances;
    private List<BPBalanceTrendPoint> balanceTrend;     // sparkline
}
