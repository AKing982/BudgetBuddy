package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.runner.CategoryRunner;
import com.app.budgetbuddy.workbench.runner.PlaidTransactionRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@Slf4j
public class TransactionImportEngine
{
    private TransactionImportAsyncService transactionImportAsyncService;
    private CategoryRunner categoryRunner;
    private SubBudgetService subBudgetService;

    @Autowired
    public TransactionImportEngine(TransactionImportAsyncService transactionImportAsyncService,
                                   CategoryRunner categoryRunner,
                                   SubBudgetService subBudgetService)
    {
        this.transactionImportAsyncService = transactionImportAsyncService;
        this.categoryRunner = categoryRunner;
        this.subBudgetService = subBudgetService;
    }

    private List<SubBudget> getMonthDateRangesByCurrentDate(final Long userId)
    {
        LocalDate currentDate = LocalDate.now();
        int currentYear = currentDate.getYear();
        LocalDate budgetBeginDate = LocalDate.of(currentYear, 1, 1);
        DateRange currentDateRange = DateRange.createDateRange(budgetBeginDate, currentDate);
        int numberOfMonths = currentDateRange.splitIntoMonths().size();
        return subBudgetService.findSubBudgetsByUserIdAndLimit(userId, numberOfMonths, currentYear)
                .stream()
                .distinct()
                .toList();
    }

    public List<Transaction> importMonthlyTransactions(final Long userId)
    {
        List<Transaction> transactions = new ArrayList<>();
        List<SubBudget> subBudgetList = getMonthDateRangesByCurrentDate(userId);
        try
        {
            return subBudgetList.stream()
                    .map(subBudget -> transactionImportAsyncService.importMonthlyTransactionsAsync(subBudget).join())
                    .flatMap(List::stream)
                    .sorted(Comparator.comparing(Transaction::getDate))
                    .toList();
        }catch(DataException ex){
            log.error("Error importing monthly transactions", ex);
            return transactions;
        }
    }

    public List<RecurringTransaction> importMonthlyRecurringTransactions(Long userId)
    {
        List<RecurringTransaction> recurringTransactions = new ArrayList<>();
        List<SubBudget> subBudgetList = getMonthDateRangesByCurrentDate(userId);
        try
        {
            return subBudgetList.stream()
                    .map(subBudget -> transactionImportAsyncService.importMonthlyRecurringTransactionsAsync(subBudget).join())
                    .flatMap(List::stream)
                    .toList();
        }catch(DataException ex){
            log.error("Error importing monthly recurring transactions", ex);
            return recurringTransactions;
        }
    }

}
