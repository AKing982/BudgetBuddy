package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
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
    private TransactionService transactionService;
    private PlaidTransactionManager plaidTransactionManager;
    private SubBudgetService subBudgetService;
    private List<Transaction> mainTransactionList = new ArrayList<>();
    private ExecutorService weeklyExecutorServiceThreads;
    private ExecutorService monthlyExecutorServiceThreads;
    private int currentYear = LocalDate.now().getYear();
    private final LocalDate budgetBeginDate = LocalDate.of(currentYear, 1, 1);
    private int numOfMonthsSinceCurrentDate = LocalDate.now().getMonthValue() - budgetBeginDate.getMonthValue();

    @Autowired
    public TransactionImportService(TransactionService transactionService,
                                    PlaidTransactionManager plaidTransactionManager,
                                    SubBudgetService subBudgetService) {
        this.transactionService = transactionService;
        this.plaidTransactionManager = plaidTransactionManager;
        this.subBudgetService = subBudgetService;
        this.weeklyExecutorServiceThreads = configureWeeklyExecutorService();
        this.monthlyExecutorServiceThreads = configureMonthlyExecutorService();
    }

    public ExecutorService configureMonthlyExecutorService()
    {
        if(numOfMonthsSinceCurrentDate <= 0)
        {
            return Executors.newFixedThreadPool(1);
        }
        return Executors.newFixedThreadPool(numOfMonthsSinceCurrentDate);
    }

    public ExecutorService configureWeeklyExecutorService()
    {
        int poolSize = 5;
        if(numOfMonthsSinceCurrentDate <= 0)
        {
            return Executors.newFixedThreadPool(poolSize);
        }
        return Executors.newFixedThreadPool(numOfMonthsSinceCurrentDate * 4);
    }

    public List<DateRange> getMonthDateRangesByCurrentDate(final Long userId)
    {
        List<DateRange> monthRanges = subBudgetService.findSubBudgetsByUserIdAndLimit(userId, numOfMonthsSinceCurrentDate, currentYear)
                .stream()
                .map(subBudget -> new DateRange(subBudget.getStartDate(), subBudget.getEndDate()))
                .sorted(Comparator.comparing(DateRange::getStartDate))
                .toList();
        log.info("Found {} month ranges for user {}", monthRanges.size(), userId);
        return monthRanges;
    }

    public List<Transaction> importMonthlyTransactions(final Long userId)
    {
        List<CompletableFuture<List<Transaction>>> monthlyFutures = new ArrayList<>();
        log.info("Starting transaction import for user: {}", userId);
        long startTime = System.currentTimeMillis();
        List<DateRange> monthDateRanges = getMonthDateRangesByCurrentDate(userId);
        if(monthDateRanges.isEmpty())
        {
            log.warn("No Month ranges found for user {}", userId);
            return Collections.emptyList();
        }
        for(DateRange monthDateRange : monthDateRanges)
        {
            CompletableFuture<List<Transaction>> monthFuture = CompletableFuture
                    .supplyAsync(() -> processMonth(userId, monthDateRange), monthlyExecutorServiceThreads)
                    .exceptionally(throwable -> {
                        log.error("Error processing month range {} to {}: {}",
                                monthDateRange.getStartDate(), monthDateRange.getEndDate(), throwable.getMessage());
                        return Collections.emptyList();
                    });
            monthlyFutures.add(monthFuture);
        }
        List<Transaction> allMonthlyTransactions = monthlyFutures
                .stream()
                .map(CompletableFuture::join)
                .flatMap(List::stream)
                .toList();
        mainTransactionList.addAll(allMonthlyTransactions);
        long endTime = System.currentTimeMillis();
        log.info("Transaction Import completed for user {}: {} transactions imported in {}ms",
                userId, mainTransactionList.size(), endTime - startTime);
        return allMonthlyTransactions;
    }

    private List<Transaction> processMonth(final Long userId, final DateRange monthRange)
    {
        log.info("Processing month range {} to {} for user {} (Thread: {})",
                monthRange.getStartDate(), monthRange.getEndDate(), userId, Thread.currentThread().getName());
        List<CompletableFuture<List<Transaction>>> weeklyFutures = new ArrayList<>();
        // Get the weeks in month
        List<DateRange> weeksInMonth = monthRange.splitIntoWeeks();
        try
        {
            for(DateRange week : weeksInMonth)
            {
                CompletableFuture<List<Transaction>> weekFuture = CompletableFuture
                        .supplyAsync(() -> {
                            try {
                                return processWeek(userId, week);
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        }, weeklyExecutorServiceThreads)
                        .exceptionally(throwable -> {
                            log.error("Error processing week range {} to {} for userId {}: {}", week.getStartDate(), week.getEndDate(), userId, throwable.getMessage());
                            return Collections.emptyList();
                        });
                weeklyFutures.add(weekFuture);
            }
            List<Transaction> allWeeklyTransactions = weeklyFutures
                    .stream()
                    .map(CompletableFuture::join)
                    .flatMap(List::stream)
                    .toList();
            log.info("Month range {} to {} completed: {} transactions from {} weeks (Thread: {})",
                    monthRange.getStartDate(), monthRange.getEndDate(),
                    allWeeklyTransactions.size(), weeksInMonth.size(), Thread.currentThread().getName());

            return allWeeklyTransactions;
        }catch(Exception e)
        {
            log.error("There was an error processing the month {} to {} for userId {}: {}", monthRange.getStartDate(), monthRange.getEndDate(), userId, e.getMessage());
            return Collections.emptyList();
        }
    }

    private List<Transaction> processWeek(final Long userId, final DateRange weekRange) throws IOException
    {
//        log.debug("Processing week range {} to {} for user {} (Thread: {})",
//                weekRange.getStartDate(), weekRange.getEndDate(), userId,
//                Thread.currentThread().getName());
//
//        // Fetch transactions from plaid for the week
//        LocalDate weekStart = weekRange.getStartDate();
//        LocalDate weekEnd = weekRange.getEndDate();
//        try
//        {
//            List<Transaction> transactionsForWeek = plaidTransactionManager.fetchPlaidTransactionsByDateRange(userId, weekStart, weekEnd);
//            log.info("Retrieved {} transactions for {} to {}", transactionsForWeek.size(), weekRange.getStartDate(), weekRange.getEndDate());
//            transactionService.saveAll(transactionsForWeek);
//            log.info("Saving transactions to the database");
//            return transactionsForWeek;
//
//        }catch(Exception e){
//            log.error("There was an error processing transactions for week {} to {} for userId {}: {}", weekRange.getStartDate(), weekRange.getEndDate(), userId, e.getMessage());
//            return Collections.emptyList();
//        }
        return null;
    }

 }
