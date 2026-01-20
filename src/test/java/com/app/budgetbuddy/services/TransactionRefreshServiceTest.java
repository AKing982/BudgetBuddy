package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.PlaidCursorEntity;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.InvalidAccessTokenException;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.TransactionsSyncRequest;
import com.plaid.client.model.TransactionsSyncResponse;
import com.plaid.client.request.PlaidApi;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionRefreshServiceTest
{

//    @Mock
//    private TransactionRefreshThreadService transactionRefreshThreadService;

    @Mock
    private PlaidApi plaidApi;

    @Mock
    private PlaidLinkService plaidLinkService;

    @Mock
    private SessionManagementService sessionManagementService;

    @Mock
    private RecurringTransactionService recurringTransactionService;

    @Mock
    private PlaidTransactionManager plaidTransactionManager;

    @Mock
    private TransactionService transactionService;

    @Mock
    private PlaidCursorService plaidCursorService;

//    @InjectMocks
//    private TransactionRefreshService transactionRefreshService;

    private SubBudget testSubBudget;
    private BudgetSchedule budgetSchedule;
    private LocalDate testCurrentDate;
    private String testCursor;

    private PlaidLinkEntity testPlaidLinkEntity;

    private List<Transaction> testTransactions;

    @BeforeEach
    void setUp() {
        testCurrentDate = LocalDate.now();
        testCursor = "test-cursor";
        // Create test SubBudget with Budget
        Budget testBudget = new Budget();
        testBudget.setUserId(1L);
        testSubBudget = new SubBudget();
        testSubBudget.setBudget(testBudget);

//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("test-access-token");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").build());
//        testPlaidLinkEntity.setRequiresUpdate(false);

        budgetSchedule = new BudgetSchedule();
        budgetSchedule.setSubBudgetId(testSubBudget.getId());
        budgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
        budgetSchedule.setBudgetScheduleId(4L);
        budgetSchedule.setSubBudgetId(4L);


        ;
        // Set up the service with test data
    }


//    @Test
//    void testPerformInitialSync_whenNoPlaidLinkEntity_thenReturnFalse(){
//        Optional<PlaidBooleanSync> result = transactionRefreshService.performInitialSync(null, budgetSchedule, LocalDate.of(2025, 4, 14));
//        assertEquals(Optional.empty(), result);
//    }
//
//    @Test
//    void testPerformInitialSync_whenBudgetScheduleIsNull_thenReturnFalse(){
//
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("test-access-token");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        Optional<PlaidBooleanSync> result = transactionRefreshService.performInitialSync(testPlaidLinkEntity, null, LocalDate.of(2025, 4, 14));
//        assertEquals(Optional.empty(), result);
//    }
//
//    @Test
//    void testPerformInitialSync_whenPlaidLinkDoesNotHaveAccessToken_thenThrowAnException(){
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setAccessToken("");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        assertThrows(InvalidAccessTokenException.class, () -> {
//            transactionRefreshService.performInitialSync(testPlaidLinkEntity, budgetSchedule, LocalDate.of(2025, 4, 14));
//        });
//    }
//
//    @Test
//    void testPerformInitialSync_whenPlaidLinkDoesHaveAccessToken_thenReturnPlaidBooleanSyncWithInitialSyncData() throws IOException{
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("access-sandbox-0687f0d2-756c-42ea-9b3f-7fca2d955c47");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        PlaidBooleanSync expectedPlaidBooleanSync = new PlaidBooleanSync();
//        expectedPlaidBooleanSync.setTransactions(getAprilGroceriesTransactions());
//        expectedPlaidBooleanSync.setUserId(1L);
//        expectedPlaidBooleanSync.setTotalSyncedTransactions(7);
//        expectedPlaidBooleanSync.setTotalModified(0);
//        expectedPlaidBooleanSync.setSynced(true);
//        expectedPlaidBooleanSync.setRecurringTransactions(List.of());
//        expectedPlaidBooleanSync.setLastSyncDate(LocalDate.of(2025, 4, 5));
//        expectedPlaidBooleanSync.setLastSyncTime(LocalDate.of(2025, 4, 5).atStartOfDay());
//
//        List<com.plaid.client.model.Transaction> plaidTransactions = convertToPlaidTransactions(getAprilGroceriesTransactions());
//        System.out.println(plaidTransactions.size());
//
//        TransactionsSyncResponse mockPlaidResponse = new TransactionsSyncResponse()
//                .added(plaidTransactions)
//                .removed(List.of())
//                .modified(new ArrayList<>())
//                .nextCursor("new-cursor-value")
//                .hasMore(false);
//
//        System.out.println("Transaction Sync Response:");
//        System.out.println(mockPlaidResponse.getAdded().size());
//
//        LocalDateTime lastSyncTime = LocalDateTime.of(2025, 4, 5, 0, 0);
//
//        PlaidCursorEntity mockPlaidCursorEntity = new PlaidCursorEntity();
//        mockPlaidCursorEntity.setAddedCursor("new-cursor-value2");
//        mockPlaidCursorEntity.setItemId("test-item-id");
//        mockPlaidCursorEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//
//        Long userId = 1L;
//        when(plaidTransactionManager.syncTransactionsForUser(userId, null))
//                .thenAnswer(invocation -> {
//                    System.out.println("✅ plaidTransactionManager mock called!");
//                    return mockPlaidResponse;
//                });
//
//        when(transactionService.convertPlaidTransactions(anyList())).thenReturn(getAprilGroceriesTransactions());
//
//        Optional<PlaidBooleanSync> expectedOptionalPlaidBooleanSyncOptional = Optional.of(expectedPlaidBooleanSync);
//        Optional<PlaidBooleanSync> result = transactionRefreshService.performInitialSync(testPlaidLinkEntity, budgetSchedule, LocalDate.of(2025, 4, 14));
//        assertNotNull(result);
//        assertTrue(result.isPresent());
//        PlaidBooleanSync actual = result.get();
//        PlaidBooleanSync expected = expectedOptionalPlaidBooleanSyncOptional.get();
//        assertEquals(expected.getTransactions().size(), actual.getTransactions().size());
//        assertEquals(expected.getTotalSyncedTransactions(), actual.getTotalSyncedTransactions());
//        assertEquals(expected.getTotalModified(), actual.getTotalModified());
//        assertEquals(expected.getSynced(), actual.getSynced());
//        assertEquals(expected.getRecurringTransactions().size(), actual.getRecurringTransactions().size());
//    }
//
//    @Test
//    void testPerformIncrementalSync_whenSyncSinceLastDate_thenReturnPlaidBooleanSync() throws IOException
//    {
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("test-access-token");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        PlaidCursorEntity testPlaidCursorEntity = new PlaidCursorEntity();
//        testPlaidCursorEntity.setAddedCursor("test-cursor-value");
//        testPlaidCursorEntity.setItemId("test-item-id");
//        testPlaidCursorEntity.setLastSyncDate(LocalDate.of(2025, 4, 5));
//        testPlaidCursorEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//
//
//    }
//
//    @Test
//    void testPerformOfflineSync_whenPlaidLinkDoesNotHaveAccessToken_thenThrowExceptionAndReturnEmptyOptional(){
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        PlaidCursorEntity testPlaidCursorEntity = new PlaidCursorEntity();
//        testPlaidCursorEntity.setAddedCursor("test-cursor-value");
//        testPlaidCursorEntity.setItemId("test-item-id");
//        testPlaidCursorEntity.setLastSyncDate(LocalDate.of(2025, 4, 1));
//        testPlaidCursorEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//
//        LocalDate currentDate = LocalDate.of(2025, 4, 10);
//        Optional<PlaidBooleanSync> actual = transactionRefreshService.performOfflineSync(testPlaidLinkEntity, testPlaidCursorEntity, currentDate);
//        assertEquals(Optional.empty(), actual);
//    }
//
//    @Test
//    void testPerformOfflineSync_whenPlaidCursorIsNull_thenThrowPlaidSyncExceptionAndReturnEmptyOptional()
//    {
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("test-access-token");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        PlaidCursorEntity testPlaidCursorEntity = new PlaidCursorEntity();
//        testPlaidCursorEntity.setAddedCursor(null);
//        testPlaidCursorEntity.setLastSyncDate(LocalDate.of(2025, 4, 5));
//        testPlaidCursorEntity.setItemId("test-item-id");
//        testPlaidCursorEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//
//        LocalDate currentDate = LocalDate.of(2025, 4, 10);
//        Optional<PlaidBooleanSync> actual = transactionRefreshService.performOfflineSync(testPlaidLinkEntity, testPlaidCursorEntity, currentDate);
//        assertEquals(Optional.empty(), actual);
//    }
//
//    @Test
//    void testPerformOfflineSync_whenPlaidCursorIsEmpty_thenThrowPlaidSyncExceptionAndReturnEmptyOptional()
//    {
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("test-access-token");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        PlaidCursorEntity testPlaidCursorEntity = new PlaidCursorEntity();
//        testPlaidCursorEntity.setAddedCursor("");
//        testPlaidCursorEntity.setLastSyncDate(LocalDate.of(2025, 4, 5));
//        testPlaidCursorEntity.setItemId("test-item-id");
//        testPlaidCursorEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//
//        LocalDate currentDate = LocalDate.of(2025, 4, 10);
//        Optional<PlaidBooleanSync> actual = transactionRefreshService.performOfflineSync(testPlaidLinkEntity, testPlaidCursorEntity, currentDate);
//        assertEquals(Optional.empty(), actual);
//    }
//
//    @Test
//    void testPerformOfflineSync_whenLastSyncDateIsCurrentDate_thenReturnPlaidBooleanSync()
//    {
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("test-access-token");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        PlaidCursorEntity testPlaidCursorEntity = new PlaidCursorEntity();
//        testPlaidCursorEntity.setAddedCursor("test-cursor-value");
//        testPlaidCursorEntity.setItemId("test-item-id");
//        testPlaidCursorEntity.setLastSyncDate(LocalDate.of(2025, 4, 5));
//        testPlaidCursorEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//
//        LocalDate currentDate = LocalDate.of(2025, 4, 5);
//
//        PlaidBooleanSync expectedPlaidBooleanSync = new PlaidBooleanSync();
//        expectedPlaidBooleanSync.setTransactions(List.of());
//        expectedPlaidBooleanSync.setUserId(1L);
//        expectedPlaidBooleanSync.setTotalSyncedTransactions(0);
//        expectedPlaidBooleanSync.setTotalModified(0);
//        expectedPlaidBooleanSync.setSynced(false);
//        expectedPlaidBooleanSync.setRecurringTransactions(List.of());
//        expectedPlaidBooleanSync.setLastSyncDate(LocalDate.of(2025, 4, 5));
//        expectedPlaidBooleanSync.setLastSyncTime(LocalDate.of(2025, 4, 5).atStartOfDay());
//
//        Optional<PlaidBooleanSync> expectedOptionalPlaidBooleanSyncOptional = Optional.of(expectedPlaidBooleanSync);
//        Optional<PlaidBooleanSync> result = transactionRefreshService.performOfflineSync(testPlaidLinkEntity, testPlaidCursorEntity, currentDate);
//        assertNotNull(result);
//        assertTrue(result.isPresent());
//        PlaidBooleanSync actual = result.get();
//        PlaidBooleanSync expected = expectedOptionalPlaidBooleanSyncOptional.get();
//        assertEquals(expected.getTransactions().size(), actual.getTransactions().size());
//        assertEquals(expected.getTotalSyncedTransactions(), actual.getTotalSyncedTransactions());
//        assertEquals(expected.getTotalModified(), actual.getTotalModified());
//        assertEquals(expected.getSynced(), actual.getSynced());
//        assertEquals(expected.getRecurringTransactions().size(), actual.getRecurringTransactions().size());
//    }
//
//    @Test
//    void testPerformOfflineSync_whenLastSyncDateIsOneDayFromCurrentDate_thenReturnPlaidBooleanSync() throws IOException
//    {
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("test-access-token");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        PlaidCursorEntity testPlaidCursorEntity = new PlaidCursorEntity();
//        testPlaidCursorEntity.setAddedCursor("test-cursor-value");
//        testPlaidCursorEntity.setItemId("test-item-id");
//        testPlaidCursorEntity.setLastSyncDate(LocalDate.of(2025, 4, 4));
//        testPlaidCursorEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//
//        LocalDate currentDate = LocalDate.of(2025, 4, 5);
//
//        PlaidBooleanSync expectedPlaidBooleanSync = new PlaidBooleanSync();
//        expectedPlaidBooleanSync.setTransactions(getSyncedTransactions1());
//        expectedPlaidBooleanSync.setUserId(1L);
//        expectedPlaidBooleanSync.setTotalSyncedTransactions(2);
//        expectedPlaidBooleanSync.setTotalModified(0);
//        expectedPlaidBooleanSync.setSynced(true);
//        expectedPlaidBooleanSync.setRecurringTransactions(List.of());
//        expectedPlaidBooleanSync.setLastSyncDate(LocalDate.of(2025, 4, 5));
//        expectedPlaidBooleanSync.setLastSyncTime(LocalDate.of(2025, 4, 5).atStartOfDay());
//
//        List<com.plaid.client.model.Transaction> plaidTransactions = convertToPlaidTransactions(getSyncedTransactions1());
//        System.out.println(plaidTransactions.size());
//
//        TransactionsSyncResponse mockPlaidResponse = new TransactionsSyncResponse()
//                .added(plaidTransactions)
//                .removed(List.of())
//                .modified(new ArrayList<>())
//                .nextCursor("new-cursor-value")
//                .hasMore(false);
//
//        Long userId = testPlaidLinkEntity.getUser().getId();
//        String cursor = testPlaidCursorEntity.getAddedCursor();
//        when(plaidTransactionManager.syncTransactionsForUser(userId, cursor))
//                .thenAnswer(invocation -> {
//                    System.out.println("✅ plaidTransactionManager mock called!");
//                    return mockPlaidResponse;
//                });
//
//        when(transactionService.convertPlaidTransactions(plaidTransactions)).thenReturn(getSyncedTransactions1());
//
//        Optional<PlaidBooleanSync> expectedOptionalPlaidBooleanSyncOptional = Optional.of(expectedPlaidBooleanSync);
//        Optional<PlaidBooleanSync> result = transactionRefreshService.performOfflineSync(testPlaidLinkEntity, testPlaidCursorEntity, currentDate);
//        assertNotNull(result);
//        assertTrue(result.isPresent());
//        PlaidBooleanSync actual = result.get();
//        PlaidBooleanSync expected = expectedOptionalPlaidBooleanSyncOptional.get();
//        assertEquals(expected.getTransactions().size(), actual.getTransactions().size());
//        assertEquals(expected.getTotalSyncedTransactions(), actual.getTotalSyncedTransactions());
//        assertEquals(expected.getTotalModified(), actual.getTotalModified());
//        assertEquals(expected.getSynced(), actual.getSynced());
//    }

//    @Test
//    void testPerformOfflineSync_whenPendingTransactionsChangedToPosted_thenReturnPlaidBooleanSync() throws IOException
//    {
//        PlaidLinkEntity testPlaidLinkEntity = new PlaidLinkEntity();
//        testPlaidLinkEntity.setId(1L);
//        testPlaidLinkEntity.setAccessToken("test-access-token");
//        testPlaidLinkEntity.setItemId("test-item-id");
//        testPlaidLinkEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//        testPlaidLinkEntity.setRequiresUpdate(false);
//
//        PlaidCursorEntity testPlaidCursorEntity = new PlaidCursorEntity();
//        testPlaidCursorEntity.setAddedCursor("test-cursor-value");
//        testPlaidCursorEntity.setItemId("test-item-id");
//        testPlaidCursorEntity.setLastSyncDate(LocalDate.of(2025, 4, 5));
//        testPlaidCursorEntity.setUser(UserEntity.builder().username("test-username").id(1L).build());
//
//        LocalDate currentDate = LocalDate.of(2025, 4, 6);
//        LocalDate lastSyncDate = LocalDate.of(2025, 4, 5);
//
//        // Create modified transactions (pending -> posted with amount changes)
//        List<com.plaid.client.model.Transaction> modifiedPlaidTransactions = new ArrayList<>();
//
//        com.plaid.client.model.Transaction gasModifiedPlaid = new com.plaid.client.model.Transaction()
//                .transactionId("tx_gas_001")
//                .accountId("test-account-id")
//                .amount(87.43)
//                .date(LocalDate.parse("2025-04-05"))
//                .name("Shell Gas Station")
//                .merchantName("Shell")
//                .pending(false);
//        modifiedPlaidTransactions.add(gasModifiedPlaid);
//
//        // Restaurant: tip added, was $50, now $60
//        com.plaid.client.model.Transaction restaurantModifiedPlaid = new com.plaid.client.model.Transaction()
//                .transactionId("tx_restaurant_001")
//                .accountId("test-account-id")
//                .amount(60.00)
//                .date(LocalDate.parse("2025-04-05"))
//                .name("Local Restaurant")
//                .merchantName("Local Restaurant")
//                .pending(false);
//        modifiedPlaidTransactions.add(restaurantModifiedPlaid);
//
//        // Mock existing transactions in DB that need to be updated
//        Transaction existingGasTransaction = new Transaction();
//        existingGasTransaction.setTransactionId("tx_gas_001");
//        existingGasTransaction.setAmount(BigDecimal.valueOf(100.00)); // Old pending amount
//        existingGasTransaction.setPending(true); // Was pending
//        existingGasTransaction.setPosted(LocalDate.of(2025, 4, 5));
//        existingGasTransaction.setName("Shell Gas Station");
//        existingGasTransaction.setDate(LocalDate.of(2025, 4, 5));
//        existingGasTransaction.setMerchantName("Shell");
//
//        Transaction existingRestaurantTransaction = new Transaction();
//        existingRestaurantTransaction.setTransactionId("tx_restaurant_001");
//        existingRestaurantTransaction.setAmount(BigDecimal.valueOf(50.00)); // Old amount without tip
//        existingRestaurantTransaction.setPending(false);
//        existingRestaurantTransaction.setDate(LocalDate.of(2025, 4, 5));
//        existingRestaurantTransaction.setPosted(LocalDate.of(2025, 4, 5));
//        existingRestaurantTransaction.setName("Local Restaurant");
//        existingRestaurantTransaction.setMerchantName("Local Restaurant");
//
//        // Gas station: was pending $100, now posted $87.43
//        Transaction gasModified = Transaction.builder()
//                .transactionId("tx_gas_001")
//                .accountId("test-account-id")
//                .amount(BigDecimal.valueOf(87.43))
//                .date(LocalDate.parse("2025-04-05"))
//                .name("Shell Gas Station")
//                .merchantName("Shell")
//                .pending(false)
//                .build();
//
//        // Restaurant: tip added, was $50, now $60
//        Transaction restaurantModified = Transaction.builder()
//                .transactionId("tx_restaurant_001")
//                .accountId("test-account-id")
//                .amount(BigDecimal.valueOf(60.00))
//                .date(LocalDate.parse("2025-04-05"))
//                .name("Local Restaurant")
//                .merchantName("Local Restaurant")
//                .pending(false)
//                .build();
//
//        when(transactionService.convertPlaidTransactions(eq(modifiedPlaidTransactions)))
//                .thenReturn(List.of(gasModified, restaurantModified));
//
//        when(transactionService.updateExistingTransaction(any(Transaction.class)))
//                .thenAnswer(invocation -> {
//                    Transaction arg = invocation.getArgument(0);
//                    if (arg.getTransactionId().equals("tx_gas_001")) {
//                        return Optional.of(gasModified);
//                    } else if (arg.getTransactionId().equals("tx_restaurant_001")) {
//                        return Optional.of(restaurantModified);
//                    }
//                    return Optional.empty();
//                });
//
//        // Create some new transactions that occurred while offline
//        List<com.plaid.client.model.Transaction> addedPlaidTransactions = new ArrayList<>();
//
//        com.plaid.client.model.Transaction coffeeNew = new com.plaid.client.model.Transaction()
//                .transactionId("tx_coffee_001")
//                .accountId("test-account-id")
//                .amount(5.50)
//                .date(LocalDate.parse("2025-04-06"))
//                .name("Coffee Shop")
//                .merchantName("Coffee Shop")
//                .pending(false);
//        addedPlaidTransactions.add(coffeeNew);
//
//        TransactionsSyncResponse mockPlaidResponse = new TransactionsSyncResponse()
//                .added(addedPlaidTransactions)
//                .modified(modifiedPlaidTransactions)
//                .removed(List.of())
//                .nextCursor("new-cursor-after-offline-sync")
//                .hasMore(false);
//
//        Long userId = testPlaidLinkEntity.getUser().getId();
//        String cursor = testPlaidCursorEntity.getAddedCursor();
//        when(plaidTransactionManager.syncTransactionsForUser(userId, cursor))
//                .thenAnswer(invocation -> {
//                    System.out.println("✅ plaidTransactionManager mock called!");
//                    return mockPlaidResponse;
//                });
//
//        // Mock conversion of new transactions
//        Transaction newCoffeeTransaction = new Transaction();
//        newCoffeeTransaction.setTransactionId("tx_coffee_001");
//        newCoffeeTransaction.setAmount(BigDecimal.valueOf(5.50));
//        newCoffeeTransaction.setPosted(LocalDate.of(2025, 4, 6));
//        newCoffeeTransaction.setName("Coffee Shop");
//        newCoffeeTransaction.setDate(LocalDate.of(2025, 4, 6));
//        newCoffeeTransaction.setMerchantName("Coffee Shop");
//        newCoffeeTransaction.setPending(false);
//
//        // Expected result
//        PlaidBooleanSync expectedPlaidBooleanSync = new PlaidBooleanSync();
//        expectedPlaidBooleanSync.setUserId(1L);
//        expectedPlaidBooleanSync.setTransactions(List.of(restaurantModified, gasModified, newCoffeeTransaction));
//        expectedPlaidBooleanSync.setTotalSyncedTransactions(1); // 1 new transaction added
//        expectedPlaidBooleanSync.setTotalModified(2); // 2 transactions modified
//        expectedPlaidBooleanSync.setSynced(true);
//
//        when(transactionService.convertPlaidTransactions(eq(addedPlaidTransactions)))
//                .thenReturn(List.of(newCoffeeTransaction));
//
//        // Execute the offline sync (incremental sync after being offline)
//        Optional<PlaidBooleanSync> result = transactionRefreshService.performOfflineSync(
//                testPlaidLinkEntity,
//                testPlaidCursorEntity,
//                currentDate
//        );
//        assertNotNull(result);
//        assertTrue(result.isPresent());
//        PlaidBooleanSync actual = result.get();
//        PlaidBooleanSync expected = expectedPlaidBooleanSync;
//        assertEquals(expected.getTransactions().size(), actual.getTransactions().size());
//        assertEquals(expected.getTotalSyncedTransactions(), actual.getTotalSyncedTransactions());
//        assertEquals(expected.getTotalModified(), actual.getTotalModified());
//        assertEquals(expected.getSynced(), actual.getSynced());
//    }

    // Helper method to convert your Transaction objects to Plaid Transaction objects
    private List<com.plaid.client.model.Transaction> convertToPlaidTransactions(List<Transaction> transactions) {
        List<com.plaid.client.model.Transaction> plaidTransactions = new ArrayList<>();

        for (Transaction tx : transactions) {
            com.plaid.client.model.Transaction plaidTx = new com.plaid.client.model.Transaction()
                    .transactionId(tx.getTransactionId())
                    .accountId("test-account-id")
                    .amount(tx.getAmount().doubleValue())
                    .date(LocalDate.parse(tx.getPosted().toString()))
                    .name(tx.getName())
                    .merchantName(tx.getMerchantName());
            plaidTransactions.add(plaidTx);
        }

        return plaidTransactions;
    }

    private List<Transaction> getSyncedTransactions1(){
        List<Transaction> groceryTransactions = new ArrayList<>();

        Transaction wincoTransaction1 = new Transaction();
        wincoTransaction1.setTransactionId("e11112345");
        wincoTransaction1.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        wincoTransaction1.setDescription("PIN Purchase WINCO FOODS");
        wincoTransaction1.setMerchantName("Winco Foods");
        wincoTransaction1.setName("Winco Foods");
        wincoTransaction1.setPending(false);
        wincoTransaction1.setPosted(LocalDate.of(2025, 4, 5));
        wincoTransaction1.setDate(LocalDate.of(2025, 4, 5));
        wincoTransaction1.setAmount(BigDecimal.valueOf(45.84));
        groceryTransactions.add(wincoTransaction1);

        Transaction targetTransaction = new Transaction();
        targetTransaction.setTransactionId("e22223456");
        targetTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        targetTransaction.setDescription("Purchase TARGET STORES");
        targetTransaction.setMerchantName("Target");
        targetTransaction.setName("Target");
        targetTransaction.setDate(LocalDate.of(2025, 4, 5));
        targetTransaction.setPending(false);
        targetTransaction.setPosted(LocalDate.of(2025, 4, 5));
        targetTransaction.setAmount(BigDecimal.valueOf(78.32));
        groceryTransactions.add(targetTransaction);

        return groceryTransactions;
    }

    private List<Transaction> getAprilGroceriesTransactions(){
        List<Transaction> groceryTransactions = new ArrayList<>();

        // Week 1
        Transaction wincoTransaction1 = new Transaction();
        wincoTransaction1.setTransactionId("e11112345");
        wincoTransaction1.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        wincoTransaction1.setDescription("PIN Purchase WINCO FOODS");
        wincoTransaction1.setMerchantName("Winco Foods");
        wincoTransaction1.setName("Winco Foods");
        wincoTransaction1.setPending(false);
        wincoTransaction1.setPosted(LocalDate.of(2025, 4, 2));
        wincoTransaction1.setAmount(BigDecimal.valueOf(45.84));
        groceryTransactions.add(wincoTransaction1);

        Transaction targetTransaction = new Transaction();
        targetTransaction.setTransactionId("e22223456");
        targetTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        targetTransaction.setDescription("Purchase TARGET STORES");
        targetTransaction.setMerchantName("Target");
        targetTransaction.setName("Target");
        targetTransaction.setPending(false);
        targetTransaction.setPosted(LocalDate.of(2025, 4, 5));
        targetTransaction.setAmount(BigDecimal.valueOf(78.32));
        groceryTransactions.add(targetTransaction);

        // Week 2
        Transaction safewayTransaction = new Transaction();
        safewayTransaction.setTransactionId("e33334567");
        safewayTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        safewayTransaction.setDescription("Purchase SAFEWAY #1234");
        safewayTransaction.setMerchantName("Safeway");
        safewayTransaction.setName("Safeway");
        safewayTransaction.setPending(false);
        safewayTransaction.setPosted(LocalDate.of(2025, 4, 9));
        safewayTransaction.setAmount(BigDecimal.valueOf(56.71));
        groceryTransactions.add(safewayTransaction);

        Transaction wincoTransaction2 = new Transaction();
        wincoTransaction2.setTransactionId("e44445678");
        wincoTransaction2.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        wincoTransaction2.setDescription("PIN Purchase WINCO FOODS");
        wincoTransaction2.setMerchantName("Winco Foods");
        wincoTransaction2.setName("Winco Foods");
        wincoTransaction2.setPending(false);
        wincoTransaction2.setPosted(LocalDate.of(2025, 4, 12));
        wincoTransaction2.setAmount(BigDecimal.valueOf(62.93));
        groceryTransactions.add(wincoTransaction2);

        // Week 3
        Transaction wholeFoodsTransaction = new Transaction();
        wholeFoodsTransaction.setTransactionId("e55556789");
        wholeFoodsTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        wholeFoodsTransaction.setDescription("Purchase WHOLE FOODS #981");
        wholeFoodsTransaction.setMerchantName("Whole Foods");
        wholeFoodsTransaction.setName("Whole Foods");
        wholeFoodsTransaction.setPending(false);
        wholeFoodsTransaction.setPosted(LocalDate.of(2025, 4, 18));
        wholeFoodsTransaction.setAmount(BigDecimal.valueOf(94.27));
        groceryTransactions.add(wholeFoodsTransaction);

        // Week 4
        Transaction krogerTransaction = new Transaction();
        krogerTransaction.setTransactionId("e66667890");
        krogerTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        krogerTransaction.setDescription("Purchase KROGER #765");
        krogerTransaction.setMerchantName("Kroger");
        krogerTransaction.setName("Kroger");
        krogerTransaction.setPending(false);
        krogerTransaction.setPosted(LocalDate.of(2025, 4, 24));
        krogerTransaction.setAmount(BigDecimal.valueOf(51.49));
        groceryTransactions.add(krogerTransaction);

        Transaction targetTransaction2 = new Transaction();
        targetTransaction2.setTransactionId("e77778901");
        targetTransaction2.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        targetTransaction2.setDescription("Purchase TARGET STORES");
        targetTransaction2.setMerchantName("Target");
        targetTransaction2.setName("Target");
        targetTransaction2.setPending(false);
        targetTransaction2.setPosted(LocalDate.of(2025, 4, 29));
        targetTransaction2.setAmount(BigDecimal.valueOf(68.15));
        groceryTransactions.add(targetTransaction2);
        return groceryTransactions;
    }

    private List<Transaction> getRentTransactionsForApril(){
        List<Transaction> rentTransactions = new ArrayList<>();

        Transaction rentTransaction1 = new Transaction();
        rentTransaction1.setAmount(BigDecimal.valueOf(1200.00));
        rentTransaction1.setCategories(List.of("Rent", "Housing"));
        rentTransaction1.setDescription("ACH Payment PROPERTY MGMT");
        rentTransaction1.setMerchantName("Vista Apartments");
        rentTransaction1.setName("Vista Apartments");
        rentTransaction1.setPending(false);
        rentTransaction1.setTransactionId("e11112345");
        rentTransaction1.setPosted(LocalDate.of(2025, 4, 1));
        rentTransactions.add(rentTransaction1);

        Transaction rentTransaction2 = new Transaction();
        rentTransaction2.setAmount(BigDecimal.valueOf(707.00));
        rentTransaction2.setCategories(List.of("Rent", "Housing"));
        rentTransaction2.setDescription("ACH Payment PROPERTY MGMT");
        rentTransaction2.setMerchantName("Vista Apartments");
        rentTransaction2.setName("Vista Apartments");
        rentTransaction2.setPending(false);
        rentTransaction2.setTransactionId("e12122345");
        rentTransaction2.setPosted(LocalDate.of(2025, 4, 16));
        rentTransactions.add(rentTransaction2);
        return rentTransactions;
    }


    @AfterEach
    void tearDown() {
    }
}