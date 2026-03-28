package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@AllArgsConstructor( access = lombok.AccessLevel.PUBLIC)
@NoArgsConstructor( access = lombok.AccessLevel.PUBLIC)
@Builder
public class BPForecastDetail
{
    // classic vs visual toggle
    private boolean isClassic;
    private boolean isVisual;

    // category structure — drives spending donut + income vs spend ring
    private List<BudgetCategoryGroup> categoryGroups = new ArrayList<>();
    private List<BPBudgetCategory> nonCategoryBudgetCategories = new ArrayList<>();
    private List<BPAccountBalance> accountBalances = new ArrayList<>();

    // period-keyed financial data
    private List<BPDateRangeAmount> totalPeriodSaved = new ArrayList<>();
    private List<BPDateRangeAmount> totalPeriodPlanned = new ArrayList<>();
    private List<BPDateRangeAmount> totalPeriodIncome = new ArrayList<>();
    private List<BPDateRangeAmount> totalRemainingBalances = new ArrayList<>();
    private List<BPDateRangeAmount> balanceTrajectory = new ArrayList<>();

    // savings rate KPI cards
    private BigDecimal actualSavingsRate;
    private BigDecimal avgSavingsRate;
}
