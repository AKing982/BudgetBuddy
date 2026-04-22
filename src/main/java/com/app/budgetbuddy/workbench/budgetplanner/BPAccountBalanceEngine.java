package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Component
public class BPAccountBalanceEngine
{
    private final BPForecastingService forecastingService;

    @Autowired
    public BPAccountBalanceEngine(BPForecastingService forecastingService)
    {
        this.forecastingService = forecastingService;
    }

    public List<BPAccountBalance> buildAccountBalances(final List<BPColumn> columns,
                                                       final List<BPCategory> incomes,
                                                       final List<BPCategory> expenses)
    {
        if(columns.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BPAccountBalance> balances = new ArrayList<>();
        BigDecimal runningBalance = BigDecimal.ZERO;
        for(BPColumn column : columns)
        {
            BigDecimal income = getActualForIndex(incomes, column.getColumnIndex());
            BigDecimal expense = getActualForIndex(expenses, column.getColumnIndex());
            BigDecimal net = income.subtract(expense);
            runningBalance = runningBalance.add(net).setScale(2, RoundingMode.HALF_UP);

            balances.add(BPAccountBalance.builder()
                    .dateRange(column.getDateRange())
                    .columnIndex(column.getColumnIndex())
                    .currentBalance(runningBalance)
                    .closingBalance(runningBalance)
                    .build());
        }
        return balances;
    }

    private BigDecimal getActualForIndex(List<BPCategory> categories, int columnIndex)
    {
        return categories.stream()
                .filter(c -> c.getColumnIndex() == columnIndex)
                .map(BPCategory::getActual)
                .filter(Objects::nonNull)
                .findFirst()
                .orElse(BigDecimal.ZERO);
    }

}
