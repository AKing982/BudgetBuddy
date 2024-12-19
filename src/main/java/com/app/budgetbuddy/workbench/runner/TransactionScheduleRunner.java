package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.TransactionScheduleJob;
import com.app.budgetbuddy.repositories.UserRepository;
import com.app.budgetbuddy.workbench.TransactionRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Slf4j
public class TransactionScheduleRunner
{
    private TransactionRunner transactionRunner;
    private volatile boolean isRunning = false;
    private TransactionScheduleJob lastRun;
    private UserRepository userRepository;

    @Autowired
    public TransactionScheduleRunner(TransactionRunner transactionRunner,
                                     UserRepository userRepository){
        this.transactionRunner = transactionRunner;
        this.userRepository = userRepository;
    }

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

    public void syncOnLogin(Long userId){
        if (!isRunning) {
            try {
                isRunning = true;
                log.info("Starting login sync for user: {}", userId);

                LocalDate today = LocalDate.now();
                LocalDate startDate = today.withDayOfMonth(1);
                LocalDate endDate = today.withDayOfMonth(today.lengthOfMonth());

                transactionRunner.syncUserTransactions(userId, startDate, endDate);

                transactionRunner.syncRecurringTransactions(userId, startDate, endDate);

                log.info("Login sync completed for user: {}", userId);

            } catch (Exception e) {
                log.error("Error during login sync for user {}: ", userId, e);
            } finally {
                isRunning = false;
            }
        } else {
            log.warn("Sync already running, skipping login sync for user: {}", userId);
        }
    }

}
