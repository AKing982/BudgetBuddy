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
            BigDecimal income = incomes.get(column.columnIndex()).getActual();
            BigDecimal expense = expenses.get(column.columnIndex()).getActual();
            BigDecimal netAmount = income.subtract(expense).setScale(2, RoundingMode.HALF_UP);
            BigDecimal closingBalance;
            if(runningBalance.compareTo(BigDecimal.ZERO) == 0)
            {
                closingBalance = netAmount;
            }
            else
            {
                closingBalance = runningBalance.add(netAmount).setScale(2, RoundingMode.HALF_UP);
            }
            balances.add(BPAccountBalance.builder()
                    .dateRange(column.dateRange())
                    .columnIndex(column.columnIndex())
                    .currentBalance(runningBalance)
                    .closingBalance(closingBalance)
                    .build());

            runningBalance = closingBalance;
        }
        return balances;
    }

}
