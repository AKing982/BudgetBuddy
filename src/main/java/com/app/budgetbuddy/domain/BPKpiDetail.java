package com.app.budgetbuddy.domain;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class BPKpiDetail
{
    private BPDateRangeAmount totalIncome;
    private BPDateRangeAmount totalExpenses;
    private BPDateRangeAmount totalBalance;
    private BigDecimal savedPercent;

    // spending donut — category breakdown
    private List<BudgetCategoryGroup> categoryGroups = new ArrayList<>();
    private List<BPBudgetCategory> nonCategoryBudgetCategories = new ArrayList<>();

    // account balances
    private List<BPAccountBalance> accountBalances = new ArrayList<>();

    // balance trend sparkline — the rising line in Image 3
    private List<BPBalanceTrendPoint> balanceTrend = new ArrayList<>();

    // period structure
    private List<BPColumn> columns = new ArrayList<>();
    private List<BPDateRangeAmount> totalPeriodIncome = new ArrayList<>();
    private List<BPDateRangeAmount> totalPeriodSaved = new ArrayList<>();
    private List<BPDateRangeAmount> totalRemainingBalances = new ArrayList<>();
}
