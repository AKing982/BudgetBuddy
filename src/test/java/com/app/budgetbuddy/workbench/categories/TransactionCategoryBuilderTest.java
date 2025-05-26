package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.services.TransactionService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
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
    @DisplayName("Should return an empty collection when transaction rules are null")
    void testCreateTransactionCategories_shouldReturnEmptyCollection(){
        List<TransactionCategory> actual = transactionCategoryBuilder.createTransactionCategories(null);
        assertTrue(actual.isEmpty());
    }

    @Test
    @DisplayName("Should return an empty collection when transaction rules are empty")
    void testCreateTransactionCategories_shouldReturnEmptyCollectionWhenTransactionRulesIsEmpty(){
        Map<String, ? extends TransactionRule> rules = new HashMap<>();
        List<TransactionCategory> actual = transactionCategoryBuilder.createTransactionCategories(rules);
        assertTrue(actual.isEmpty());
    }

    @Test
    @DisplayName("Should return transaction categories given valid transaction rules")
    void testCreateTransactionCategories_shouldReturnTransactionCategoriesGivenValidTransactionRules(){
        Map<String, TransactionRule> categorizedRules = createTestCategorizedTransactionsMap();

        List<TransactionCategory> expected = new ArrayList<>();

        TransactionCategory groceriesWincoTransactionCategory = new TransactionCategory();
        groceriesWincoTransactionCategory.setPriority(1);
        groceriesWincoTransactionCategory.setPlaidCategory("Supermarkets and Groceries");
        groceriesWincoTransactionCategory.setCategorizedBy("SYSTEM");
        groceriesWincoTransactionCategory.setRecurring(false);
        groceriesWincoTransactionCategory.setTransactionId("rDbOgmnJV0iAXgAZ7j6MtOOq944Ao7IrxJznV");
        groceriesWincoTransactionCategory.setMatchedCategory("Groceries");
        groceriesWincoTransactionCategory.setId(2L);
        groceriesWincoTransactionCategory.setCategorized_date(LocalDate.of(2025, 3, 12));
        expected.add(groceriesWincoTransactionCategory);

        TransactionCategory otherParkingTransactionCategory = new TransactionCategory();
        otherParkingTransactionCategory.setPriority(1);
        otherParkingTransactionCategory.setPlaidCategory("Parking");
        otherParkingTransactionCategory.setCategorizedBy("SYSTEM");
        otherParkingTransactionCategory.setRecurring(false);
        otherParkingTransactionCategory.setTransactionId("KAYVLwndaEuDk5DPxVqptLLkPppey5CyMZ65O");
        otherParkingTransactionCategory.setMatchedCategory("Other");
        otherParkingTransactionCategory.setId(1L);
        otherParkingTransactionCategory.setCategorized_date(LocalDate.of(2025, 3, 2));
        expected.add(otherParkingTransactionCategory);

        List<String> transactionIds = new ArrayList<>(categorizedRules.keySet());
        Mockito.when(transactionService.getTransactionsMap(transactionIds))
                .thenReturn(createTransactionMap());

        List<TransactionCategory> actual = transactionCategoryBuilder.createTransactionCategories(categorizedRules);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++){
            TransactionCategory expectedTransactionCategory = expected.get(i);
            TransactionCategory actualTransactionCategory = actual.get(i);
            assertEquals(expectedTransactionCategory.getPriority(), actualTransactionCategory.getPriority());
            assertEquals(expectedTransactionCategory.getPlaidCategory(), actualTransactionCategory.getPlaidCategory());
            assertEquals(expectedTransactionCategory.getCategorizedBy(), actualTransactionCategory.getCategorizedBy());
            assertEquals(expectedTransactionCategory.isRecurring(), actualTransactionCategory.isRecurring());
            assertEquals(expectedTransactionCategory.getTransactionId(), actualTransactionCategory.getTransactionId());
            assertEquals(expectedTransactionCategory.getMatchedCategory(), actualTransactionCategory.getMatchedCategory());
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