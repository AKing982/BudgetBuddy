package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;
import java.util.function.Predicate;

public class BPTemplateExtractorUtil
{
    private BPTemplateExtractorUtil() {}

    public static List<BudgetCategoryGroup> categoryGroups(List<BPCategory> categories)
    {
        return categories.stream()
                .filter(c -> c.getType() == BPType.BUDGET)
                .map(c -> {
                    BudgetCategoryGroup group = new BudgetCategoryGroup();
                    group.setGroupName(c.getName());
                    return group;
                })
                .distinct()
                .toList();
    }

    public static List<BPCategory> budgetCategories(List<BPCategory> categories)
    {
        return categories.stream()
                .filter(c -> c.getType() == BPType.BUDGET)
                .toList();
    }

    public static List<BPAccountBalance> accountBalances(List<BPCategory> categories)
    {
        return categories.stream()
                .filter(c -> c.getType() == BPType.BALANCE)
                .map(c -> BPAccountBalance.builder()
                        .dateRange(c.getRange())
                        .columnIndex(c.getColumnIndex())
                        .currentBalance(c.getActual())
                        .closingBalance(c.getBudgeted())
                        .build())
                .toList();
    }

    public static BPCategory row(List<BPCategory> categories, String name)
    {
        return categories.stream()
                .filter(c -> c.getName().equals(name))
                .findFirst()
                .orElse(null);
    }

    public static BigDecimal sumAmounts(List<BPCategory> categories, Predicate<BPCategory> filter)
    {
        return categories.stream()
                .filter(filter)
                .map(BPCategory::getActual)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    public static List<BPDateRangeAmount> periodAmounts(List<BPCategory> categories, Predicate<BPCategory> filter)
    {
        return categories.stream()
                .filter(filter)
                .map(c -> new BPDateRangeAmount(c.getRange(), c.getActual().doubleValue()))
                .toList();
    }

    public static List<BPBalanceTrendPoint> balanceTrend(List<BPCategory> categories)
    {
        return categories.stream()
                .filter(c -> c.getType() == BPType.BALANCE)
                .map(c -> new BPBalanceTrendPoint(c.getRange(), c.getActual().doubleValue()))
                .toList();
    }

    public static DateRange fullRange(List<BPColumn> columns)
    {
        return new DateRange(
                columns.get(0).getDateRange().getStartDate(),
                columns.get(columns.size() - 1).getDateRange().getEndDate());
    }
}
