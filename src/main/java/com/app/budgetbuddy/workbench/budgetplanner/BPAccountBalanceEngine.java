package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Component
public class BPAccountBalanceEngine
{
    private final BPForecastingService forecastingService;

    @Autowired
    public BPAccountBalanceEngine(BPForecastingService forecastingService)
    {
        this.forecastingService = forecastingService;
    }

    public List<BPAccountBalance> buildAccountBalances(final String acctId,
                                                       final BigDecimal startingBalance,
                                                       final BPLayout layout)
    {
        if(acctId == null || startingBalance == null || layout == null)
        {
            throw new DataException("Account ID, Starting Balance or Layout cannot be null");
        }
        List<BPColumn> columns = layout.columns();
        List<BPRow> rows = layout.rows();
        if(columns.isEmpty() || rows.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BPAccountBalance> balances = new ArrayList<>();
        BigDecimal runningBalance = startingBalance;
        for(BPColumn column : columns)
        {
            BPAccountBalance balance = buildAccountBalance(acctId, runningBalance, column, rows);
            balances.add(balance);
            runningBalance = balance.getClosingBalance();
        }
        return balances;
    }

    public BPAccountBalance buildAccountBalance(final String acctId,
                                                final BigDecimal currentBalance,
                                                final BPColumn column,
                                                final List<BPRow> rows)
    {
        if(currentBalance == null || column == null || rows == null)
        {
            throw new DataException("Current Balance, Column or rows cannot be null");
        }
        BigDecimal totalIncome;
        BigDecimal totalExpenses;
        if(column.columnType() == BPColumnType.ACTUAL)
        {
            if(rows.isEmpty())
            {
                return BPAccountBalance.builder()
                        .columnIndex(column.columnIndex())
                        .dateRange(column.dateRange())
                        .currentBalance(currentBalance)
                        .plannedBalance(currentBalance)
                        .availableBalance(currentBalance)
                        .closingBalance(currentBalance)
                        .build();
            }
            totalIncome = sumByCategory(rows, column, true);
            totalExpenses = sumByCategory(rows, column, false);
        }
        else
        {
            totalIncome = forecastingService.forecastIncome(acctId, column.dateRange());
            totalExpenses = forecastingService.forecastExpenses(acctId, column.dateRange());
        }
        BigDecimal closingBalance = currentBalance.add(totalIncome).subtract(totalExpenses).setScale(2, RoundingMode.HALF_UP);
        return BPAccountBalance.builder()
                    .dateRange(column.dateRange())
                    .columnIndex(column.columnIndex())
                    .currentBalance(currentBalance)
                    .plannedBalance(closingBalance)
                    .availableBalance(closingBalance)
                    .closingBalance(closingBalance)
                    .build();
    }

    private BigDecimal sumByCategory(List<BPRow> rows, BPColumn column, boolean income)
    {
        return rows.stream()
                .filter(row -> income
                        ? row.categoryType().isIncome()
                        : row.categoryType().isExpense())
                .flatMap(row -> row.bpCells().stream())
                .filter(cell -> cell.column().columnIndex() == column.columnIndex())
                .map(cell -> BigDecimal.valueOf(cell.amount())
                        .setScale(2, RoundingMode.HALF_UP))  // round each cell amount first
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);          // then round the total
    }
}
