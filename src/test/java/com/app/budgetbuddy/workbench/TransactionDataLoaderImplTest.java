package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.IllegalDateException;
import com.app.budgetbuddy.exceptions.InvalidStartDateException;
import com.app.budgetbuddy.services.TransactionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TransactionDataLoaderImplTest {

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private TransactionDataLoaderImpl transactionDataLoader;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        transactionDataLoader = new TransactionDataLoaderImpl(transactionService);
    }

    @Test
    void testLoadTransactionsByDateRange_whenStartDateIsNull_thenThrowException() {
        assertThrows(IllegalDateException.class, () -> {
            transactionDataLoader.loadTransactionsByDateRange(1L, null, LocalDate.of(2024, 9, 1));
        });
    }

    @Test
    void testLoadTransactionsByDateRange_whenEndDateIsNull_thenThrowException() {
        assertThrows(IllegalDateException.class, () -> {
            transactionDataLoader.loadTransactionsByDateRange(1L, LocalDate.of(2024, 9, 1), null);
        });
    }

    @Test
    void testLoadTransactionsByDateRange_whenStartDateIsBeforeEndDate_thenReturnEmptyList() {
        List<Transaction> actual = transactionDataLoader.loadTransactionsByDateRange(1L, LocalDate.of(2024, 9, 30), LocalDate.of(2024, 9, 1));
        assertTrue(actual.isEmpty());
    }

    @Test
    void testLoadTransactionsByDateRange_whenStartDateAndEndDateValid_thenReturnTransactionList(){
        LocalDate startDate = LocalDate.of(2024, 9, 1);
        LocalDate endDate = LocalDate.of(2024, 9, 30);

        List<Transaction> expected = new ArrayList<>();
        expected.add(createTransaction());
        expected.add(createTransaction());

        Mockito.when(transactionService.getTransactionsByDateRange(startDate, endDate)).thenReturn(List.of(createTransactionEntity(), createTransactionEntity(), createTransactionEntity(), createTransactionEntity()));

        List<Transaction> actual = transactionDataLoader.loadTransactionsByDateRange(1L, startDate, endDate);
        for(int i = 0; i < actual.size(); i++){
            assertEquals(expected.get(i).getTransactionId(), actual.get(i).getTransactionId());
            assertEquals(expected.get(i).getCategoryId(), actual.get(i).getCategoryId());
            assertEquals(expected.get(i).getAmount(), actual.get(i).getAmount());
            assertEquals(expected.get(i).getDescription(), actual.get(i).getDescription());
            assertEquals(expected.get(i).getDate(), actual.get(i).getDate());
            assertEquals(expected.get(i).getMerchantName(), actual.get(i).getMerchantName());
            assertEquals(expected.get(i).getAccountId(), actual.get(i).getAccountId());
            assertEquals(expected.get(i).getCategories(), actual.get(i).getCategories());
            assertEquals(expected.get(i).getPosted(), actual.get(i).getPosted());
            assertEquals(expected.get(i).getAuthorizedDate(), actual.get(i).getAuthorizedDate());
            assertEquals(expected.get(i).getName(), actual.get(i).getName());
        }
    }

    @Test
    void testLoadTransactionsByDateRange_SameStartAndEndDate_thenReturnTransactionList(){
        LocalDate startDate = LocalDate.of(2024, 9, 30);
        LocalDate endDate = LocalDate.of(2024, 9, 30);
        List<Transaction> expected = new ArrayList<>();
        expected.add(createTransaction());
        expected.add(createTransaction());

        Mockito.when(transactionService.getConvertedPlaidTransactions(1L, startDate, endDate)).thenReturn(expected);

        List<Transaction> actual = transactionDataLoader.loadTransactionsByDateRange(1L, startDate, endDate);
        for (int i = 0; i < expected.size(); i++) {
            assertEquals(expected.get(i).getTransactionId(), actual.get(i).getTransactionId(),
                    "Transaction ID mismatch at index " + i);
            assertEquals(expected.get(i).getCategoryId(), actual.get(i).getCategoryId(),
                    "Category ID mismatch at index " + i);
            assertEquals(expected.get(i).getAmount(), actual.get(i).getAmount(),
                    "Amount mismatch at index " + i);
            assertEquals(expected.get(i).getDescription(), actual.get(i).getDescription(),
                    "Description mismatch at index " + i);
            assertEquals(expected.get(i).getDate(), actual.get(i).getDate(),
                    "Date mismatch at index " + i);
            assertEquals(expected.get(i).getMerchantName(), actual.get(i).getMerchantName(),
                    "Merchant Name mismatch at index " + i);
            assertEquals(expected.get(i).getAccountId(), actual.get(i).getAccountId(),
                    "Account ID mismatch at index " + i);
            assertEquals(expected.get(i).getCategories(), actual.get(i).getCategories(),
                    "Categories mismatch at index " + i);
            assertEquals(expected.get(i).getPosted(), actual.get(i).getPosted(),
                    "Posted date mismatch at index " + i);
            assertEquals(expected.get(i).getAuthorizedDate(), actual.get(i).getAuthorizedDate(),
                    "Authorized Date mismatch at index " + i);
            assertEquals(expected.get(i).getName(), actual.get(i).getName(),
                    "Transaction name mismatch at index " + i);
        }
    }

    @Test
    void testLoadRecentTransactions_withTransactions_returnRecentTransactions(){
        List<Transaction> recentTransactions = new ArrayList<>();
        recentTransactions.add(createRecentTransaction1());
        recentTransactions.add(createRecentTransaction2());

        Mockito.when(transactionService.get)
    }

    private TransactionsEntity createTransactionEntity(){
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setAmount(new BigDecimal("15.75"));
        transactionsEntity.setMerchantName("Winco Foods");
        transactionsEntity.setAuthorizedDate(LocalDate.of(2024, 9, 30));
        transactionsEntity.setCategory(CategoryEntity.builder().id("19047000").name("Supermarkets and Groceries").description("Shops").build());
        transactionsEntity.setPending(false);
        transactionsEntity.setId("transaction123");
        transactionsEntity.setDescription("PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024");
        transactionsEntity.setIsoCurrencyCode("USD");
        transactionsEntity.setAccount(AccountEntity.builder().id("account123").build());
        transactionsEntity.setLogoUrl("http://example.com/logo.png");
        transactionsEntity.setCreateDate(LocalDate.of(2024, 9, 30));
        transactionsEntity.setPosted(LocalDate.of(2024, 9, 30));
        return transactionsEntity;
    }

    private Transaction createTransaction(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(15.75),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "19047000",
                LocalDate.of(2024, 9, 30),
                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
                "Winco Foods",
                "Winco Foods",
                false,
                "transaction123",
                LocalDate.of(2024, 9, 30),
                "http://example.com/logo.png",
                LocalDate.of(2024, 9, 30)
        );
        return transaction;
    }

    private Transaction createRecentTransaction1(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(19.12),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "19047000",
                LocalDate.of(2024, 11, 13),
                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 11-13-2024",
                "Winco Foods",
                "Winco Foods",
                false,
                "transaction123",
                LocalDate.of(2024, 11, 13),
                "http://example.com/logo.png",
                LocalDate.of(2024, 11, 13)
        );
        return transaction;
    }

    private Transaction createRecentTransaction2(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(31.23),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "19047000",
                LocalDate.of(2024, 11, 12),
                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 11-12-2024",
                "Winco Foods",
                "Winco Foods",
                false,
                "transaction123",
                LocalDate.of(2024, 11, 12),
                "http://example.com/logo.png",
                LocalDate.of(2024, 11, 12)
        );
        return transaction;
    }




    @AfterEach
    void tearDown() {
    }
}