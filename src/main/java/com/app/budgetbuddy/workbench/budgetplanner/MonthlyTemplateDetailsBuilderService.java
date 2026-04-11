package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPTemplateDetailsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Objects;

@Service
public class MonthlyTemplateDetailsBuilderService implements BPTemplateDetailBuilderService
{
    private final BPLayoutBuilderService layoutBuilderService;
    private final BPTemplateDetailsService bpTemplateDetailsService;

    @Autowired
    public MonthlyTemplateDetailsBuilderService(BPLayoutBuilderService layoutBuilderService,
                                                BPTemplateDetailsService bpTemplateDetailsService)
    {
        this.layoutBuilderService = layoutBuilderService;
        this.bpTemplateDetailsService = bpTemplateDetailsService;
    }

    private BPRollingDetail buildRollingDetail(BPLayout layout)
    {
        List<BPCategory> categories = layout.bpCategories();
        BPRollingDetail detail = new BPRollingDetail();
        detail.setColumns(layout.columns());
        detail.setCategoryGroups(BPTemplateExtractorUtil.categoryGroups(categories));
        detail.setBudgetCategories(BPTemplateExtractorUtil.budgetCategories(categories));
        detail.setAccountBalances(BPTemplateExtractorUtil.accountBalances(categories));
        detail.setIncomeRow(BPTemplateExtractorUtil.row(categories, "Income"));
        detail.setSavingsRow(BPTemplateExtractorUtil.row(categories, "Savings"));
        detail.setClassic(false);
        detail.setGrouped(true);
        return detail;
    }

    private BPKpiDetail buildKpiDetail(BPLayout layout)
    {
        List<BPCategory> categories = layout.bpCategories();
        List<BPColumn> columns = layout.columns();
        DateRange fullRange = BPTemplateExtractorUtil.fullRange(columns);

        BigDecimal totalIncome = BPTemplateExtractorUtil.sumAmounts(categories, r -> r.getType() == BPType.INCOME);
        BigDecimal totalExpenses = BPTemplateExtractorUtil.sumAmounts(categories, r -> r.getType() == BPType.EXPENSE);
        BigDecimal closingBalance = BPTemplateExtractorUtil.accountBalances(categories).stream()
                .map(BPAccountBalance::getClosingBalance)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, (a, b) -> b);
        BigDecimal savedPercent = totalIncome.compareTo(BigDecimal.ZERO) > 0
                ? totalIncome.subtract(totalExpenses)
                .divide(totalIncome, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        BPKpiDetail detail = new BPKpiDetail();
        detail.setTotalIncome(new BPDateRangeAmount(fullRange, totalIncome.doubleValue()));
        detail.setTotalExpenses(new BPDateRangeAmount(fullRange, totalExpenses.doubleValue()));
        detail.setTotalBalance(new BPDateRangeAmount(fullRange, closingBalance.doubleValue()));
        detail.setSavedPercent(savedPercent);
        detail.setBalanceTrend(BPTemplateExtractorUtil.balanceTrend(categories));
        detail.setAccountBalances(BPTemplateExtractorUtil.accountBalances(categories));
        detail.setCategoryGroups(BPTemplateExtractorUtil.categoryGroups(categories));
        return detail;
    }

    @Override
    public BPTemplateDetail buildDetail(BPTemplateType bpTemplateType, SubBudget subBudget)
    {
        BPLayout layout = layoutBuilderService.buildLayout(bpTemplateType, subBudget);
        BPTemplateDetail detail = new BPTemplateDetail();
        detail.setTemplateType(bpTemplateType);
        switch(bpTemplateType){
            case MONTHLY_STD, WEEKLY_STD, BIWEEKLY_STD -> {
                detail.setRollingDetail(buildRollingDetail(layout));
            }
            case MONTHLY_BALANCE_SHEET -> {
                detail.setBpKpiDetail(buildKpiDetail(layout));
            }
            default -> throw new IllegalArgumentException("Invalid template type");
        }
        return detail;
    }

    @Override
    public BPTemplateDetail saveDetail(BPTemplateDetail detail)
    {
        if(detail == null)
        {
            throw new DataException("Detail cannot be null");
        }
        return null;
    }
}
