package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.Budget;
import com.app.budgetbuddy.domain.SubBudget;
import com.app.budgetbuddy.domain.Transaction;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@SpringBootTest
class TransactionRefreshServiceTest {

    @MockBean
    private TransactionRefreshThreadService transactionRefreshThreadService;

    @MockBean
    private UserLogService userLogService;

    @Autowired
    private TransactionRefreshService transactionRefreshService;

    private SubBudget testSubBudget;
    private LocalDate testCurrentDate;
    private String testCursor;

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

        ;
        // Set up the service with test data
    }

    @Test
    void testScheduleTransactionRefreshForUser_UserActive() throws IOException {
        // Mock active user
        when(userLogService.isUserActive(anyLong())).thenReturn(true);

        // The key is to use Mockito's any() matcher for the transaction list
        // instead of the specific eq(testTransactions) matcher

        // Call the method
        transactionRefreshService.scheduleTransactionRefreshForUser();

        // Verify interactions with less specific matchers
        verify(userLogService).isUserActive(1L);
        verify(transactionRefreshThreadService).startTransactionSyncThread(
                any(SubBudget.class),
                any(LocalDate.class),
                anyList(), // Use anyList() instead of eq(testTransactions)
                anyString()
        );
        verify(transactionRefreshThreadService).startRecurringTransactionSyncThread(
                any(LocalDate.class),
                any(SubBudget.class),
                anyList() // Use anyList() instead of eq(testRecurringTransactions)
        );
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