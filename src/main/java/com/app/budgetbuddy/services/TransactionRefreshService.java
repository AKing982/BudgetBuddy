package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.PlaidCursorEntity;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
@Setter
@Getter
public class TransactionRefreshService
{
    private final TransactionRefreshThreadService transactionRefreshThreadService;
    private final UserLogService userLogService;
    private final SubBudgetService subBudgetService;
    private final TransactionService transactionService;
    private final RecurringTransactionService recurringTransactionService;
    private final PlaidCursorService plaidCursorService;

    @Autowired
    public TransactionRefreshService(UserLogService userLogService,
                                     SubBudgetService subBudgetService,
                                     TransactionService transactionService,
                                     RecurringTransactionService recurringTransactionService,
                                     PlaidCursorService plaidCursorService,
                                     TransactionRefreshThreadService transactionRefreshThreadService)
    {
        this.userLogService = userLogService;
        this.subBudgetService = subBudgetService;
        this.transactionService = transactionService;
        this.recurringTransactionService = recurringTransactionService;
        this.plaidCursorService = plaidCursorService;
        this.transactionRefreshThreadService = transactionRefreshThreadService;
    }

    // 1. First get the current date,
    // 2. Then find the subBudget that the current date is within.
    // 3. Then get the linked budget and userId
    // 4. Next get any new transactions for the current date
    // 5. Also get any new recurring transactions for the current date
    // 6.

    //TODO: Fix issue with how subBudget, userId and current date are configured through the setters
    //TODO: Consider cases when the user is signed out for multiple days, and we need to resync for those days
    @Scheduled(fixedRate=3600000)
    @Transactional(readOnly = true)
    public void scheduleTransactionRefreshForUser()
    {
        try
        {
            LocalDate currentDate = LocalDate.now();
            Long userId = 1L;
            Optional<SubBudget> subBudgetOptional = subBudgetService.findSubBudgetByUserIdAndDate(userId, currentDate);
            if(subBudgetOptional.isEmpty())
            {
                log.info("No sub budget found for user id {}", userId);
                return;
            }
            SubBudget subBudget = subBudgetOptional.get();
            if(userLogService.isUserActive(userId))
            {
                List<PlaidCursorEntity> userPlaidCursors = plaidCursorService.findByUserId(userId);
                if(userPlaidCursors.isEmpty())
                {
                    log.info("No Plaid Cursors found for user id {}", userId);
                }
                List<Transaction> transactions = transactionService.getTransactionsByDate(currentDate, userId);
                List<RecurringTransaction> recurringTransactions = recurringTransactionService.getRecurringTransactionsForDate(userId, currentDate);
                processTransactionsWithCursor(transactions, subBudget, currentDate, userPlaidCursors);
                if(recurringTransactions.isEmpty() && transactions.isEmpty())
                {
                    log.info("No Transactions/Recurring transactions to sync at this time...");
                }
                else if(transactions.isEmpty())
                {
                    transactionRefreshThreadService.startRecurringTransactionSyncThread(currentDate, subBudget, recurringTransactions);
                }
            }
            else
            {
                log.info("User {} is not currently logged in and active.", userId);
            }
        }catch(IOException e){
            log.error("There was an error running the transaction refresh: ", e);
        }
    }

    private boolean processTransactionsWithCursor(final List<Transaction> transactions, final SubBudget subBudget, final LocalDate currentDate, final List<PlaidCursorEntity> plaidCursorEntities)
    {
        if(transactions.isEmpty() || subBudget == null || currentDate == null || plaidCursorEntities == null)
        {
            return false;
        }
        try
        {
            for(PlaidCursorEntity plaidCursorEntity : plaidCursorEntities)
            {
                Long plaidCursorId = plaidCursorEntity.getId();
                String addedCursor = plaidCursorEntity.getAddedCursor();
                transactionRefreshThreadService.startTransactionSyncThread(subBudget, currentDate, transactions, addedCursor);
                plaidCursorService.updateSyncStatus(plaidCursorId, true, "SUCCESS", null);
            }
            log.info("Successfully processed transactions with cursors");
            return true;

        }catch(IOException e){
            log.error("There was an error running the transaction refresh: ", e);
            return false;
        }
    }

}
