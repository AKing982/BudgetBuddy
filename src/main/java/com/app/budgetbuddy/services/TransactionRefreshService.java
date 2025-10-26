package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.PlaidCursorEntity;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.entities.UserLogEntity;
import com.app.budgetbuddy.exceptions.InvalidAccessTokenException;
import com.app.budgetbuddy.exceptions.InvalidMathModelException;
import com.app.budgetbuddy.exceptions.PlaidSyncException;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.TransactionsGetRequest;
import com.plaid.client.model.TransactionsSyncRequest;
import com.plaid.client.model.TransactionsSyncResponse;
import com.plaid.client.request.PlaidApi;
import lombok.Getter;
import lombok.Setter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import retrofit2.Call;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
@Setter
@Getter
public class TransactionRefreshService
{
    private final TransactionRefreshThreadService transactionRefreshThreadService;
    private final SessionManagementService sessionManagementService;
    private final TransactionService transactionService;
    private final PlaidTransactionManager plaidTransactionManager;
    private final RecurringTransactionService recurringTransactionService;
    private final PlaidCursorService plaidCursorService;
    private final PlaidLinkService plaidLinkService;
    private final BudgetScheduleService budgetScheduleService;

    @Autowired
    public TransactionRefreshService(SessionManagementService sessionManagementService,
                                     TransactionService transactionService,
                                     PlaidTransactionManager plaidTransactionManager,
                                     RecurringTransactionService recurringTransactionService,
                                     PlaidCursorService plaidCursorService,
                                     PlaidLinkService plaidLinkService,
                                     BudgetScheduleService budgetScheduleService,
                                     TransactionRefreshThreadService transactionRefreshThreadService)
    {
        this.sessionManagementService = sessionManagementService;
        this.transactionService = transactionService;
        this.plaidTransactionManager = plaidTransactionManager;
        this.recurringTransactionService = recurringTransactionService;
        this.plaidCursorService = plaidCursorService;
        this.plaidLinkService = plaidLinkService;
        this.budgetScheduleService = budgetScheduleService;
        this.transactionRefreshThreadService = transactionRefreshThreadService;
    }

    public Optional<PlaidBooleanSync> performInitialSync(PlaidLinkEntity plaidLinkEntity, BudgetSchedule budgetSchedule, LocalDate currentDate)
    {
        if(plaidLinkEntity == null || budgetSchedule == null || currentDate == null)
        {
            return Optional.empty();
        }
        Long userId = plaidLinkEntity.getUser().getId();
        UserEntity user = plaidLinkEntity.getUser();
        String itemId = plaidLinkEntity.getItemId();
        int sync_added = 0;
        int sync_modified = 0;
        String cursor = null;
        boolean hasMore = true;
        boolean isSynced = false;
        List<Transaction> initialTransactions = new ArrayList<>();
        try
        {
            String accessToken = plaidLinkEntity.getAccessToken();
            if(accessToken.isEmpty())
            {
                throw new InvalidAccessTokenException("The access token is empty");
            }
            while(hasMore)
            {
                log.debug("Before Transaction Sync Response");
                TransactionsSyncResponse response = plaidTransactionManager.syncTransactionsForUser(userId, cursor);
                log.debug("After Transaction Sync Response");
                List<com.plaid.client.model.Transaction> addedPlaidTransactions = response.getAdded();
                // Check for added plaid transactions
                if(!addedPlaidTransactions.isEmpty())
                {
                    initialTransactions = transactionService.convertPlaidTransactions(addedPlaidTransactions);
                    int convertedSize = initialTransactions.size();
                    sync_added += convertedSize;
                    isSynced = true;
                }

                // Check for modified Plaid Transactions
                List<com.plaid.client.model.Transaction> modifiedPlaidTransactions = response.getModified();
                if(!modifiedPlaidTransactions.isEmpty())
                {
                    List<Transaction> convertedTransactions = transactionService.convertPlaidTransactions(modifiedPlaidTransactions);
                    int convertedSize = convertedTransactions.size();
                    sync_modified += convertedSize;
                    isSynced = true;
                }
                cursor = response.getNextCursor();
                hasMore = response.getHasMore();
                log.debug("Initial Sync Batch - Added: {}, Modified: {}, Cursor: {}, HasMore: {}", sync_added, sync_modified, cursor, hasMore);
            }
            PlaidCursorEntity initialSyncCursor = new PlaidCursorEntity();
            initialSyncCursor.setAddedCursor(cursor);
            initialSyncCursor.setItemId(itemId);
            initialSyncCursor.setUser(user);
            initialSyncCursor.setLastSyncTimestamp(LocalDateTime.now());
            plaidCursorService.save(initialSyncCursor);
            log.info("Initial Sync complete for item {}. Added: {}, Modified: {}", itemId, sync_added, sync_modified);

            PlaidBooleanSync plaidBooleanSync = new PlaidBooleanSync();
            plaidBooleanSync.setLastSyncTime(LocalDateTime.now());
            plaidBooleanSync.setUserId(userId);
            plaidBooleanSync.setTotalSyncedTransactions(sync_added);
            plaidBooleanSync.setTotalModified(sync_modified);
            plaidBooleanSync.setSynced(isSynced);
            plaidBooleanSync.setRecurringTransactions(List.of());
            plaidBooleanSync.setTransactions(initialTransactions);
            return Optional.of(plaidBooleanSync);

        }catch(InvalidAccessTokenException e){
            log.error("There was an error fetching the access token for userId: {}", userId);
            throw e;
        }catch(IOException e){
            log.error("There was an error running the initial sync: ", e);
            return Optional.empty();
        }
    }

    @Scheduled(fixedRate=360000)
    @Transactional
    public void scheduleTransactionRefresh()
    {
        LocalDate today = LocalDate.now();
        Set<Long> activeUsers = sessionManagementService.getActiveUsersBySessions();
        log.info("Starting scheduled transaction refresh for users: {}", activeUsers);
        for(Long userId : activeUsers)
        {
            try
            {
                syncTransactionsForUser(userId, today);
            }catch(PlaidSyncException e){
                log.error("There was an error syncing transactions for user {}", userId);
            }
        }
    }

    private BudgetSchedule fetchBudgetScheduleByCurrentDate(Long userId, LocalDate currentDate)
    {
        Optional<BudgetSchedule> budgetScheduleOptional = budgetScheduleService.findBudgetScheduleByUserIdAndCurrentDate(userId, currentDate);
        if(budgetScheduleOptional.isEmpty())
        {
            log.info("No budget schedule found for user {} and current date {}", userId, currentDate);
            return null;
        }
        return budgetScheduleOptional.get();
    }

    @Transactional
    public void syncTransactionsForUser(Long userId, LocalDate currentDate)
    {
        log.info("Syncing transactions for user {}", userId);
        Optional<PlaidLinkEntity> plaidLinkEntityOptional = plaidLinkService.findPlaidLinkByUserID(userId);
        if(plaidLinkEntityOptional.isEmpty())
        {
            log.info("No Plaid Link found for user {}", userId);
            return;
        }
        PlaidLinkEntity plaidLinkEntity = plaidLinkEntityOptional.get();
        Optional<PlaidCursorEntity> plaidCursorEntityOptional = plaidCursorService.findByUserIdAndItemId(userId, plaidLinkEntity.getItemId());
        BudgetSchedule budgetSchedule = fetchBudgetScheduleByCurrentDate(userId, currentDate);
        if(plaidCursorEntityOptional.isEmpty())
        {
            // If the plaid cursor entity is empty, then perform an initial sync for the user
            performInitialSync(plaidLinkEntity, budgetSchedule, currentDate);
            log.info("No Plaid Cursor found for user {}", userId);
            return;
        }
        PlaidCursorEntity plaidCursorEntity = plaidCursorEntityOptional.get();
        // Check whether the user is currently active or is offline
        boolean isUserActive = sessionManagementService.isUserActive(userId);
        if(isUserActive)
        {
            // Was the user offline for several days?
            // If yes, then perform an offline sync
            // Else run the incremental sync
            performIncrementalSync(plaidLinkEntity, plaidCursorEntity, currentDate);
        }
        else
        {
            log.info("Skipping incremental sync for user {} as they are offline", userId);
        }
        // If the user is active, perform a sync
        // Else if the user is offline, skip sync
        // Else if the user was offline for several days and is now online, go ahead and run the offline sync

    }

    /**
     * This method will perform an incremental sync on the user's transactions during the day while the user is currently active
     * Any new transactions that are added
     * @param plaidLinkEntity
     * @param plaidCursorEntity
     * @return
     */
    public Optional<PlaidBooleanSync> performIncrementalSync(final PlaidLinkEntity plaidLinkEntity, final PlaidCursorEntity plaidCursorEntity)
    {
        if(plaidLinkEntity == null || plaidCursorEntity == null)
        {
            return Optional.empty();
        }

        String itemId = plaidLinkEntity.getItemId();
        String plaidCursor = plaidCursorEntity.getAddedCursor();
        String nextCursor = "";
        LocalDate currentDate = LocalDate.now();
        Long userId = plaidLinkEntity.getUser().getId();
        boolean hasMore = true;
        try
        {
            String accessToken = plaidLinkEntity.getAccessToken();
            if(accessToken.isEmpty())
            {
                throw new InvalidAccessTokenException("The access token is empty");
            }
            while(hasMore)
            {
                TransactionsSyncResponse syncResponse = plaidTransactionManager.syncTransactionsForUser(userId, plaidCursor);
                List<com.plaid.client.model.Transaction> addedPlaidTransactions = syncResponse.getAdded();
                List<com.plaid.client.model.Transaction> modifiedPlaidTransactions = syncResponse.getModified();
                
                if(addedPlaidTransactions.isEmpty() && modifiedPlaidTransactions.isEmpty())
                {
                    log.info("No transactions were synced for user {}", userId);
                    return Optional.of(createDefaultBooleanSync(plaidLinkEntity.getUser()));
                }
                List<Transaction> convertedAddedTransactions = transactionService.convertPlaidTransactions(addedPlaidTransactions);
                List<Transaction> convertedModifiedTransactions = transactionService.convertPlaidTransactions(modifiedPlaidTransactions);
                int totalSyncedTransactions = convertedAddedTransactions.size() + convertedModifiedTransactions.size();

                hasMore = syncResponse.getHasMore();
                nextCursor = syncResponse.getNextCursor();
            }

        }catch(InvalidAccessTokenException e){
            log.error("There was an error fetching the access token for userId: {}", userId);
            return Optional.empty();
        }catch(IOException e){
            log.error("There was an error with the sync response: {}" , e.getMessage());
            return Optional.empty();
        }

        return Optional.empty();
    }

    private PlaidBooleanSync createDefaultBooleanSync(UserEntity user)
    {
        PlaidBooleanSync currentDaySync = new PlaidBooleanSync();
        currentDaySync.setUserId(user.getId());
        currentDaySync.setSynced(false);
        currentDaySync.setTotalSyncedTransactions(0);
        currentDaySync.setTotalModified(0);
        currentDaySync.setRecurringTransactions(List.of());
        currentDaySync.setTransactions(List.of());
        return currentDaySync;
    }

    /**
     * Syncs user's transactions if they were signed out for multiple days
     *
     * @param plaidLinkEntity
     * @param plaidCursorEntity
     * @param currentDate
     * @return
     */
    public Optional<PlaidBooleanSync> performOfflineSync(PlaidLinkEntity plaidLinkEntity, PlaidCursorEntity plaidCursorEntity, LocalDate currentDate)
    {
        if(plaidLinkEntity == null || plaidCursorEntity == null || currentDate == null)
        {
            return Optional.empty();
        }
        log.info("Performing offline sync for user {} at {}", plaidLinkEntity.getUser().getId(), currentDate);
        UserEntity user = plaidLinkEntity.getUser();
        String plaidCursor = plaidCursorEntity.getAddedCursor();
        String accessToken = plaidLinkEntity.getAccessToken();
        LocalDate lastSyncDate = plaidCursorEntity.getLastSyncDate();
        Long userId = user.getId();
        boolean hasMore = true;
        int totalModifiedTransactionsDuringSync = 0;
        Map<LocalDate, List<Transaction>> transactionsByDate = new HashMap<>();
        if(lastSyncDate.equals(currentDate))
        {
            log.info("Skipping offline sync for user {} as they were last synced on {}", user.getId(), lastSyncDate);
            return Optional.of(createDefaultBooleanSync(user));
        }
        try
        {
            if(accessToken.isEmpty())
            {
                throw new InvalidAccessTokenException("The access token is empty");
            }
            if(plaidCursor == null || plaidCursor.isEmpty())
            {
                throw new PlaidSyncException("The cursor is null");
            }
            while(hasMore)
            {
                // Create a Transaction Sync Request
                TransactionsSyncResponse syncResponse = plaidTransactionManager.syncTransactionsForUser(userId, plaidCursor);
                List<com.plaid.client.model.Transaction> syncedTransactions = syncResponse.getAdded();
                List<com.plaid.client.model.Transaction> modifiedTransactions = syncResponse.getModified();
                if(syncedTransactions.isEmpty())
                {
                    log.info("No transactions were synced for user {}", user.getId());
                    return Optional.of(createDefaultBooleanSync(user));
                }
                convertTransactionsAndAddToMap(syncedTransactions, transactionsByDate, lastSyncDate);
                if(!modifiedTransactions.isEmpty())
                {
                    totalModifiedTransactionsDuringSync += modifiedTransactions.size();
                    List<Transaction> convertedModifiedTransactions = transactionService.convertPlaidTransactions(modifiedTransactions);
                    for(Transaction modifiedTransaction : convertedModifiedTransactions)
                    {
                        String transactionId = modifiedTransaction.getTransactionId();
                        LocalDate modifiedTransactionDate = modifiedTransaction.getDate();
                        Optional<Transaction> updatedTransactionOptional = transactionService.modifyExistingTransaction(modifiedTransaction);
                        if(updatedTransactionOptional.isEmpty())
                        {
                            log.info("No Transaction with id {} was updated ", transactionId);
                            continue;
                        }
                        Transaction updatedTransaction = updatedTransactionOptional.get();
                        // Add the updated transaction to the map
                        if(!modifiedTransactionDate.isBefore(lastSyncDate) && !modifiedTransactionDate.isAfter(lastSyncDate))
                        {
                            transactionsByDate.computeIfAbsent(modifiedTransactionDate, k -> new ArrayList<>()).add(updatedTransaction);
                        }
                    }
                }
                // For any modified transactions, we will need to first convert the modified transactions
                // then search for those modified transactions using the transaction service in the database
                // then update those transactions in the database using the modified data
                convertTransactionsAndAddToMap(modifiedTransactions, transactionsByDate, lastSyncDate);
                plaidCursor = syncResponse.getNextCursor();
                hasMore = syncResponse.getHasMore();
            }
            PlaidCursorEntity updatedPlaidCursor = new PlaidCursorEntity();
            updatedPlaidCursor.setAddedCursor(plaidCursor);
            updatedPlaidCursor.setItemId(plaidLinkEntity.getItemId());
            updatedPlaidCursor.setUser(user);
            updatedPlaidCursor.setLastSyncTimestamp(LocalDateTime.now());
            plaidCursorService.save(updatedPlaidCursor);
            saveSyncedTransactionsMap(transactionsByDate);

            log.info("Offline sync complete for user {}", user.getId());
            return createPlaidBooleanSyncByTransactionsMap(transactionsByDate, totalModifiedTransactionsDuringSync);

        }catch(InvalidAccessTokenException e){
            log.error("There was an error fetching the access token for userId: {}", user.getId());
            return Optional.empty();
        }catch(PlaidSyncException e){
            log.error("Plaid Cursor is null");
            return Optional.empty();
        }catch(IOException e){
            log.error("There was an error running the offline sync: ", e);
            return Optional.empty();
        }
    }

    private void convertTransactionsAndAddToMap(final List<com.plaid.client.model.Transaction> plaidTransactions, final Map<LocalDate, List<Transaction>> transactionsByDate, final LocalDate lastSyncDate)
    {
        List<Transaction> convertedTransactions = transactionService.convertPlaidTransactions(plaidTransactions);
        for(Transaction transaction : convertedTransactions)
        {
            LocalDate transactionDate = transaction.getDate();
            log.info("Transaction Date: {}", transactionDate);
            if(!transactionDate.isBefore(lastSyncDate) && !transactionDate.isAfter(lastSyncDate))
            {
                transactionsByDate.computeIfAbsent(transactionDate, k -> new ArrayList<>()).add(transaction);
            }
        }
    }

    private Optional<PlaidBooleanSync> createPlaidBooleanSyncByTransactionsMap(final Map<LocalDate, List<Transaction>> transactionsByDate, final int totalModified)
    {
        if(transactionsByDate == null)
        {
            return Optional.empty();
        }
        List<Transaction> allTransactions = transactionsByDate.values().stream().flatMap(List::stream).toList();
        int totalTransactionsSynced = allTransactions.size();
        PlaidBooleanSync plaidBooleanSync = new PlaidBooleanSync();
        plaidBooleanSync.setTotalSyncedTransactions(totalTransactionsSynced);
        plaidBooleanSync.setTotalModified(totalModified);
        plaidBooleanSync.setSynced(true);
        plaidBooleanSync.setRecurringTransactions(List.of());
        plaidBooleanSync.setTransactions(allTransactions);
        return Optional.of(plaidBooleanSync);
    }

    private void saveSyncedTransactionsMap(final Map<LocalDate, List<Transaction>> transactionsByDate)
    {
        for(Map.Entry<LocalDate, List<Transaction>> entry : transactionsByDate.entrySet())
        {
            LocalDate date = entry.getKey();
            List<Transaction> transactions = entry.getValue();
            transactionService.saveTransactionsByDate(transactions, date);
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
