package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.app.budgetbuddy.workbench.runner.CategoryRunner;
import com.app.budgetbuddy.workbench.runner.PlaidTransactionRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

@Service
@Slf4j
public class TransactionImportService
{
    private PlaidTransactionRunner plaidTransactionRunner;
    private CategoryRunner categoryRunner;
    private SubBudgetService subBudgetService;

    @Autowired
    public TransactionImportService(PlaidTransactionRunner plaidTransactionRunner,
                                    CategoryRunner categoryRunner,
                                    SubBudgetService subBudgetService) {
        this.plaidTransactionRunner = plaidTransactionRunner;
        this.categoryRunner = categoryRunner;
        this.subBudgetService = subBudgetService;
    }

    public List<DateRange> getMonthDateRangesByCurrentDate(final Long userId)
    {
        LocalDate currentDate = LocalDate.now();
        int currentYear = currentDate.getYear();
        LocalDate budgetBeginDate = LocalDate.of(currentYear, 1, 1);
        DateRange currentDateRange = DateRange.createDateRange(budgetBeginDate, currentDate);
        int numberOfMonths = currentDateRange.splitIntoMonths().size();
        List<DateRange> monthRanges = subBudgetService.findSubBudgetsByUserIdAndLimit(userId, numberOfMonths, currentYear)
                .stream()
                .map(subBudget -> new DateRange(subBudget.getStartDate(), subBudget.getEndDate()))
                .sorted(Comparator.comparing(DateRange::getStartDate))
                .toList();
        // log.info("Found {} month ranges for user {}", monthRanges.size(), userId);
        return monthRanges;
    }


    public List<Transaction> importMonthlyTransactions(final Long userId) {
//        List<CompletableFuture<List<Transaction>>> monthlyFutures = new ArrayList<>();
//        log.info("Starting transaction import for user: {}", userId);
//        long startTime = System.currentTimeMillis();
//        List<DateRange> monthDateRanges = getMonthDateRangesByCurrentDate(userId);
//        if(monthDateRanges.isEmpty())
//        {
//            log.warn("No Month ranges found for user {}", userId);
//            return Collections.emptyList();
//        }
//        for(DateRange monthDateRange : monthDateRanges)
//        {
//            CompletableFuture<List<Transaction>> monthFuture = CompletableFuture
//                    .supplyAsync(() -> processMonth(userId, monthDateRange), monthlyExecutorServiceThreads)
//                    .exceptionally(throwable -> {
//                        log.error("Error processing month range {} to {}: {}",
//                                monthDateRange.getStartDate(), monthDateRange.getEndDate(), throwable.getMessage());
//                        return Collections.emptyList();
//                    });
//            monthlyFutures.add(monthFuture);
//        }
//        List<Transaction> allMonthlyTransactions = monthlyFutures
//                .stream()
//                .map(CompletableFuture::join)
//                .flatMap(List::stream)
//                .toList();
//        mainTransactionList.addAll(allMonthlyTransactions);
//        long endTime = System.currentTimeMillis();
//        log.info("Transaction Import completed for user {}: {} transactions imported in {}ms",
//                userId, mainTransactionList.size(), endTime - startTime);
//        return allMonthlyTransactions;
        return null;
    }

    public List<RecurringTransaction> importMonthlyRecurringTransactions(Long userId)
    {
        return null;
    }

    private List<Transaction> processMonth(final Long userId, final DateRange monthRange) {
//        log.info("Processing month range {} to {} for user {} (Thread: {})",
//                monthRange.getStartDate(), monthRange.getEndDate(), userId, Thread.currentThread().getName());
//        List<CompletableFuture<List<Transaction>>> weeklyFutures = new ArrayList<>();
//        // Get the weeks in month
//        List<DateRange> weeksInMonth = monthRange.splitIntoWeeks();
//        try
//        {
//            for(DateRange week : weeksInMonth)
//            {
//                CompletableFuture<List<Transaction>> weekFuture = CompletableFuture
//                        .supplyAsync(() -> {
//                            try {
//                                return processWeek(userId, week);
//                            } catch (IOException e) {
//                                throw new RuntimeException(e);
//                            }
//                        }, weeklyExecutorServiceThreads)
//                        .exceptionally(throwable -> {
//                            log.error("Error processing week range {} to {} for userId {}: {}", week.getStartDate(), week.getEndDate(), userId, throwable.getMessage());
//                            return Collections.emptyList();
//                        });
//                weeklyFutures.add(weekFuture);
//            }
//            List<Transaction> allWeeklyTransactions = weeklyFutures
//                    .stream()
//                    .map(CompletableFuture::join)
//                    .flatMap(List::stream)
//                    .toList();
//            log.info("Month range {} to {} completed: {} transactions from {} weeks (Thread: {})",
//                    monthRange.getStartDate(), monthRange.getEndDate(),
//                    allWeeklyTransactions.size(), weeksInMonth.size(), Thread.currentThread().getName());
//
//            return allWeeklyTransactions;
//        }catch(Exception e)
//        {
//            log.error("There was an error processing the month {} to {} for userId {}: {}", monthRange.getStartDate(), monthRange.getEndDate(), userId, e.getMessage());
//            return Collections.emptyList();
//        }
        return null;
    }
}
