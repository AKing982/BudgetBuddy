package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.services.TransactionService;
import com.plaid.client.model.Application;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.runner.RunWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cglib.core.Local;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.junit4.SpringRunner;
import org.testcontainers.shaded.org.checkerframework.checker.units.qual.A;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;


@SpringBootTest
class TransactionCategoryBuilderTest
{
    @Autowired
    private TransactionCategoryBuilder transactionCategoryBuilder;

    @MockBean
    private TransactionCategoryService transactionCategoryService;

    @MockBean
    private TransactionService transactionService;

    @Test
    void testCreateTransactionCategories_whenCategorizedTransactionsMapIsNull_thenReturnEmptyList(){
        List<TransactionCategory> actual = transactionCategoryBuilder.createTransactionCategories(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateTransactionCategories_whenCategorizedTransactionsMapIsEmpty_thenReturnEmptyList(){
        List<TransactionCategory> actual = transactionCategoryBuilder.createTransactionCategories(new HashMap<>());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateTransactionCategories_whenCategorizedTransactionsMapIsNotEmpty_thenReturnTransactionCategories(){
        Map<String, TransactionRule> categorizedTransactions = createTestCategorizedTransactionsMap();

        List<TransactionCategory> expectedTransactionCategories = new ArrayList<>();
        TransactionCategory wincoGroceryTransactionCategory = new TransactionCategory();
        wincoGroceryTransactionCategory.setCategorizedBy("SYSTEM");
        wincoGroceryTransactionCategory.setCategorized_date(LocalDate.now());
        wincoGroceryTransactionCategory.setTransactionId("rDbOgmnJV0iAXgAZ7j6MtOOq944Ao7IrxJznV");
        wincoGroceryTransactionCategory.setMatchedCategory("Groceries");
        wincoGroceryTransactionCategory.setPlaidCategory("Supermarkets and Groceries");
        wincoGroceryTransactionCategory.setPriority(1);
        wincoGroceryTransactionCategory.setRecurring(false);

        TransactionCategory parkingSpotTransactionCategory = new TransactionCategory();
        parkingSpotTransactionCategory.setCategorizedBy("SYSTEM");
        parkingSpotTransactionCategory.setCategorized_date(LocalDate.now());
        parkingSpotTransactionCategory.setMatchedCategory("Other");
        parkingSpotTransactionCategory.setPlaidCategory("Parking");
        parkingSpotTransactionCategory.setTransactionId("KAYVLwndaEuDk5DPxVqptLLkPppey5CyMZ65O");
        parkingSpotTransactionCategory.setPriority(1);
        parkingSpotTransactionCategory.setRecurring(false);
        expectedTransactionCategories.add(wincoGroceryTransactionCategory);
        expectedTransactionCategories.add(parkingSpotTransactionCategory);

        List<String> transactionIds = new ArrayList<>(categorizedTransactions.keySet());
        Map<String, Transaction> transactionMap = createTransactionMap();

        System.out.println("TransactionMap Size: " + transactionMap.size());
        Mockito.when(transactionService.getTransactionsMap(anyList())).thenReturn(transactionMap);
        // Use BDDMockito with Spring's MockBean

        Map<String, Transaction> tMap = transactionService.getTransactionsMap(transactionIds);
        System.out.println("TMap Size: " + tMap.size());
        Transaction t1 = tMap.get("KAYVLwndaEuDk5DPxVqptLLkPppey5CyMZ65O");
        System.out.println("T1: " + t1);
        Transaction t2 = tMap.get("rDbOgmnJV0iAXgAZ7j6MtOOq944Ao7IrxJznV");
        System.out.println("T2: " + t2);

        // Add mock for the saveAll method
        Mockito.doNothing().when(transactionCategoryService).saveAll(Mockito.anyList());

        List<TransactionCategory> actualTransactionCategories = transactionCategoryBuilder.createTransactionCategories(categorizedTransactions);
        assertEquals(expectedTransactionCategories.size(), actualTransactionCategories.size());
        for(int i = 0; i < expectedTransactionCategories.size(); i++){
            TransactionCategory expected = expectedTransactionCategories.get(i);
            TransactionCategory actual = actualTransactionCategories.get(i);

            assertEquals(expected.getTransactionId(), actual.getTransactionId(),
                    "TransactionId mismatch for index " + i + ": expected '" + expected.getTransactionId() + "', got '" + actual.getTransactionId() + "'");

            assertEquals(expected.getPriority(), actual.getPriority(),
                    "Priority mismatch for transaction " + expected.getTransactionId() + ": expected " + expected.getPriority() + ", got " + actual.getPriority());

            assertEquals(expected.getCategorizedBy(), actual.getCategorizedBy(),
                    "CategorizedBy mismatch for transaction " + expected.getTransactionId() + ": expected '" + expected.getCategorizedBy() + "', got '" + actual.getCategorizedBy() + "'");

            assertEquals(expected.getPlaidCategory(), actual.getPlaidCategory(),
                    "PlaidCategory mismatch for transaction " + expected.getTransactionId() + ": expected '" + expected.getPlaidCategory() + "', got '" + actual.getPlaidCategory() + "'");

            assertEquals(expected.isRecurring(), actual.isRecurring(),
                    "Recurring flag mismatch for transaction " + expected.getTransactionId() + ": expected " + expected.isRecurring() + ", got " + actual.isRecurring());

            assertEquals(expected.getMatchedCategory(), actual.getMatchedCategory(),
                    "MatchedCategory mismatch for transaction " + expected.getTransactionId() + ": expected '" + expected.getMatchedCategory() + "', got '" + actual.getMatchedCategory() + "'");

            assertEquals(expected.getCategorized_date(), actual.getCategorized_date(),
                    "Categorized_date mismatch for transaction " + expected.getTransactionId() + ": expected " + expected.getCategorized_date() + ", got " + actual.getCategorized_date());
        }
    }

    @Test
    void testCreateTransactionCategories_whenTransactionMapIsNull_thenReturnEmptyList(){
        Map<String, TransactionRule> categorizedTransactions = createTestCategorizedTransactionsMap();

        Mockito.when(transactionService.getTransactionsMap(anyList())).thenReturn(null);

        List<TransactionCategory> actual = transactionCategoryBuilder.createTransactionCategories(categorizedTransactions);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateTransactionCategories_whenTransactionMapIsEmpty_thenReturnEmptyList(){
        Map<String, TransactionRule> categorizedTransactions = createTestCategorizedTransactionsMap();

        Mockito.when(transactionService.getTransactionsMap(anyList())).thenReturn(new HashMap<>());
        List<TransactionCategory> actual = transactionCategoryBuilder.createTransactionCategories(categorizedTransactions);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateTransactionCategories_whenTransactionPlaidNameCategoryMissing_thenReturnTransactionCategories()
    {
        Map<String, TransactionRule> categorizedTransactions = createTestCategorizedTransactionsMap();

        List<TransactionCategory> expectedTransactionCategories = new ArrayList<>();
        TransactionCategory wincoGroceryTransactionCategory = new TransactionCategory();
        wincoGroceryTransactionCategory.setTransactionId("rDbOgmnJV0iAXgAZ7j6MtOOq944Ao7IrxJznV");
        wincoGroceryTransactionCategory.setCategorizedBy("SYSTEM");
        wincoGroceryTransactionCategory.setCategorized_date(LocalDate.now());
        wincoGroceryTransactionCategory.setMatchedCategory("Groceries");
        wincoGroceryTransactionCategory.setPlaidCategory("Shops");
        wincoGroceryTransactionCategory.setPriority(1);
        wincoGroceryTransactionCategory.setRecurring(false);

        TransactionCategory parkingSpotTransactionCategory = new TransactionCategory();
        parkingSpotTransactionCategory.setCategorizedBy("SYSTEM");
        parkingSpotTransactionCategory.setCategorized_date(LocalDate.now());
        parkingSpotTransactionCategory.setMatchedCategory("Other");
        parkingSpotTransactionCategory.setPlaidCategory("Parking");
        parkingSpotTransactionCategory.setTransactionId("KAYVLwndaEuDk5DPxVqptLLkPppey5CyMZ65O");
        parkingSpotTransactionCategory.setPriority(1);
        parkingSpotTransactionCategory.setRecurring(false);
        expectedTransactionCategories.add(wincoGroceryTransactionCategory);
        expectedTransactionCategories.add(parkingSpotTransactionCategory);

        Mockito.when(transactionService.getTransactionsMap(anyList())).thenReturn(createTransactionMapWithMissingPlaidCategoryName());
        Mockito.doNothing().when(transactionCategoryService).saveAll(expectedTransactionCategories);

        List<TransactionCategory> actualTransactionCategories = transactionCategoryBuilder.createTransactionCategories(categorizedTransactions);
        assertEquals(expectedTransactionCategories.size(), actualTransactionCategories.size());
        for(int i = 0; i < expectedTransactionCategories.size(); i++){
            TransactionCategory expected = expectedTransactionCategories.get(i);
            TransactionCategory actual = actualTransactionCategories.get(i);

            assertEquals(expected.getTransactionId(), actual.getTransactionId(),
                    "TransactionId mismatch for index " + i + ": expected '" + expected.getTransactionId() + "', got '" + actual.getTransactionId() + "'");

            assertEquals(expected.getPriority(), actual.getPriority(),
                    "Priority mismatch for transaction " + expected.getTransactionId() + ": expected " + expected.getPriority() + ", got " + actual.getPriority());

            assertEquals(expected.getCategorizedBy(), actual.getCategorizedBy(),
                    "CategorizedBy mismatch for transaction " + expected.getTransactionId() + ": expected '" + expected.getCategorizedBy() + "', got '" + actual.getCategorizedBy() + "'");

            assertEquals(expected.getPlaidCategory(), actual.getPlaidCategory(),
                    "PlaidCategory mismatch for transaction " + expected.getTransactionId() + ": expected '" + expected.getPlaidCategory() + "', got '" + actual.getPlaidCategory() + "'");

            assertEquals(expected.isRecurring(), actual.isRecurring(),
                    "Recurring flag mismatch for transaction " + expected.getTransactionId() + ": expected " + expected.isRecurring() + ", got " + actual.isRecurring());

            assertEquals(expected.getMatchedCategory(), actual.getMatchedCategory(),
                    "MatchedCategory mismatch for transaction " + expected.getTransactionId() + ": expected '" + expected.getMatchedCategory() + "', got '" + actual.getMatchedCategory() + "'");

            assertEquals(expected.getCategorized_date(), actual.getCategorized_date(),
                    "Categorized_date mismatch for transaction " + expected.getTransactionId() + ": expected " + expected.getCategorized_date() + ", got " + actual.getCategorized_date());
        }

    }

    private Map<String, Transaction> createTransactionMap()
    {
        Map<String, Transaction> transactionMap = new HashMap<>();
        Transaction transaction1 = new Transaction();
        transaction1.setTransactionId("KAYVLwndaEuDk5DPxVqptLLkPppey5CyMZ65O");
        transaction1.setCategoryId("22013000");
        transaction1.setDate(LocalDate.of(2025, 3, 2));
        transaction1.setCategories(List.of("Parking", "Travel"));
        transaction1.setDescription("Purchase THEPARKINGSPOT-ECW401 UTUS, 03-01-2025 @ 8:27 Trace #:030108271026113039");
        transaction1.setMerchantName("Theparkingspot Ec");
        transaction1.setPosted(LocalDate.of(2025, 3, 2));
        transaction1.setAmount(BigDecimal.valueOf(12.840));
        transaction1.setPending(false);

        Transaction transaction2 = new Transaction();
        transaction2.setTransactionId("rDbOgmnJV0iAXgAZ7j6MtOOq944Ao7IrxJznV");
        transaction2.setCategoryId("19047000");
        transaction2.setDate(LocalDate.of(2025, 2, 12));
        transaction2.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        transaction2.setDescription("PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 02-12-2025 @ 11:35 Trace #:021211353900513319");
        transaction2.setMerchantName("Winco Foods");
        transaction2.setPosted(LocalDate.of(2025, 2, 12));
        transaction2.setAmount(BigDecimal.valueOf(16.050));
        transaction2.setPending(false);

        transactionMap.put(transaction1.getTransactionId(), transaction1);
        transactionMap.put(transaction2.getTransactionId(), transaction2);
        return transactionMap;
    }

    private Map<String, Transaction> createTransactionMapWithMissingPlaidCategoryName()
    {
        Map<String, Transaction> transactionMap = new HashMap<>();
        Transaction transaction2 = new Transaction();
        transaction2.setTransactionId("rDbOgmnJV0iAXgAZ7j6MtOOq944Ao7IrxJznV");
        transaction2.setCategoryId("19047000");
        transaction2.setDate(LocalDate.of(2025, 2, 12));
        transaction2.setCategories(List.of("Shops"));
        transaction2.setDescription("PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 02-12-2025 @ 11:35 Trace #:021211353900513319");
        transaction2.setMerchantName("Winco Foods");
        transaction2.setPosted(LocalDate.of(2025, 2, 12));
        transaction2.setAmount(BigDecimal.valueOf(16.050));
        transaction2.setPending(false);

        Transaction transaction1 = new Transaction();
        transaction1.setTransactionId("KAYVLwndaEuDk5DPxVqptLLkPppey5CyMZ65O");
        transaction1.setCategoryId("22013000");
        transaction1.setDate(LocalDate.of(2025, 3, 2));
        transaction1.setCategories(List.of("Parking", "Travel"));
        transaction1.setDescription("Purchase THEPARKINGSPOT-ECW401 UTUS, 03-01-2025 @ 8:27 Trace #:030108271026113039");
        transaction1.setMerchantName("Theparkingspot Ec");
        transaction1.setPosted(LocalDate.of(2025, 3, 2));
        transaction1.setAmount(BigDecimal.valueOf(12.840));
        transaction1.setPending(false);

        transactionMap.put(transaction1.getTransactionId(), transaction1);
        transactionMap.put(transaction2.getTransactionId(), transaction2);

        return transactionMap;
    }

    private Map<String, TransactionRule> createTestCategorizedTransactionsMap(){
        Map<String, TransactionRule> categorizedTransactions = new HashMap<>();
        TransactionRule transactionRule1 = new TransactionRule();

        transactionRule1.setTransactionId("KAYVLwndaEuDk5DPxVqptLLkPppey5CyMZ65O");
        transactionRule1.setTransactionType("DEBIT");
        transactionRule1.setActive(true);
        transactionRule1.setDescriptionPattern("THEPARKINGSPOT");
        transactionRule1.setMerchantPattern("Theparkingspot");
        transactionRule1.setPlaidCategory("Parking");
        transactionRule1.setMatchedCategory("Other");
        transactionRule1.setPriority(1);
        transactionRule1.setSystemRule(true);
        transactionRule1.setCategories(Arrays.asList("Parking", "Travel"));

        TransactionRule transactionRule2 = new TransactionRule();
        transactionRule2.setActive(true);
        transactionRule2.setDescriptionPattern("WINCO FOODS");
        transactionRule2.setMerchantPattern("Winco Foods");
        transactionRule2.setPlaidCategory("Supermarkets and Groceries");
        transactionRule2.setMatchedCategory("Groceries");
        transactionRule2.setTransactionId("rDbOgmnJV0iAXgAZ7j6MtOOq944Ao7IrxJznV");
        transactionRule2.setPriority(1);
        transactionRule2.setSystemRule(true);
        transactionRule2.setCategories(Arrays.asList("Supermarkets and Groceries", "Shops"));
        categorizedTransactions.put(transactionRule1.getTransactionId(), transactionRule1);
        categorizedTransactions.put(transactionRule2.getTransactionId(), transactionRule2);
        return categorizedTransactions;
    }




    @AfterEach
    void tearDown() {
    }
}