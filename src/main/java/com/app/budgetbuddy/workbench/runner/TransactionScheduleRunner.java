package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.TransactionScheduleJob;
import com.app.budgetbuddy.exceptions.TransactionsScheduleException;
import com.app.budgetbuddy.repositories.UserRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class TransactionScheduleRunner
{
    private TransactionRunner transactionRunner;
    private volatile boolean isRunning = false;
    private TransactionScheduleJob lastRun;
    private UserRepository userRepository;
    private ScheduledExecutorService scheduledExecutorService;

    @Autowired
    public TransactionScheduleRunner(TransactionRunner transactionRunner,
                                     ScheduledExecutorService scheduledExecutorService,
                                     UserRepository userRepository){
        this.transactionRunner = transactionRunner;
        this.scheduledExecutorService = scheduledExecutorService;
        this.userRepository = userRepository;
    }


    /**
     * Synchronizes Transactions for all users
     */
    @Scheduled(cron = "0 0 1 * * *")
    public void syncDailyTransactions(){
        if (!isRunning) {
            try {
                isRunning = true;
                lastRun = new TransactionScheduleJob(LocalDateTime.now());
                log.info("Starting daily transaction sync");

                // Get active users for sync
                List<Long> activeUserIds = userRepository.findAllIds();

                for (Long userId : activeUserIds) {
                    LocalDate today = LocalDate.now();
                    LocalDate startDate = today.withDayOfMonth(1);
                    LocalDate endDate = today.withDayOfMonth(today.lengthOfMonth());

                    transactionRunner.syncUserTransactions(userId, startDate, endDate);
                    transactionRunner.syncRecurringTransactions(userId, startDate, endDate);
                }

                lastRun.setEndTime(LocalDateTime.now());
                lastRun.setSuccess(true);
                log.info("Daily transaction sync completed");

            } catch (Exception e) {
                log.error("Error during daily transaction sync: ", e);
                if (lastRun != null) {
                    lastRun.setErrorMessage(e.getMessage());
                    lastRun.setSuccess(false);
                }
            } finally {
                isRunning = false;
            }
        } else {
            log.warn("Daily sync already running, skipping...");
        }
    }

    public TransactionScheduleJob generateTransactionScheduleJob()
    {
        return null;
    }

    public void scheduleUserTransactionSync(final Long userId){
        scheduledExecutorService.schedule(() -> {
            try {
                syncOnLogin(userId);
            } catch (Exception e) {
                log.error("Error during scheduled user sync for user {}: ", userId, e);
            }
        }, 0, TimeUnit.SECONDS);
    }

    /**
     * Synchronizes transaction data for the month
     * @param userId
     */
    public void syncMonthlyTransactions(Long userId)
    {
        try
        {

        }catch(TransactionsScheduleException ex){
            log.error("Error during monthly transaction sync: ", ex);
        }
    }

    /**
     * Synchronizes transaction data for the last month on login
     * @param userId
     */
    public void syncOnLogin(Long userId)
    {
        try
        {
            log.info("Starting login sync for user: {}", userId);
            LocalDate today = LocalDate.now();
            LocalDate startDate = today.withDayOfMonth(1);
            LocalDate endDate = today.withDayOfMonth(today.lengthOfMonth());
            log.info("Starting transaction sync for startDate: {} and endDate: {}", startDate, endDate);
            boolean transactionsFoundForLastMonth = transactionRunner.checkTransactionsExistInDateRange(startDate, endDate, userId);
            boolean recurringTransactionsFoundForLastMonth = transactionRunner.checkRecurringTransactionsExistInDateRange(startDate, endDate, userId);
            if(!transactionsFoundForLastMonth)
            {
                log.info("Syncing Transactions for user {} from {} to {}", userId, startDate, endDate);
                transactionRunner.syncUserTransactions(userId, startDate, endDate);
                if(!recurringTransactionsFoundForLastMonth)
                {
                    log.info("Syncing Recurring Transactions for user {} from {} to {}", userId, startDate, endDate);
                    transactionRunner.syncRecurringTransactions(userId, startDate, endDate);
                }
            }
        }catch(TransactionsScheduleException e)
        {
            log.error("Error during  transaction sync: ", e);
            throw e;
        }
    }

}
