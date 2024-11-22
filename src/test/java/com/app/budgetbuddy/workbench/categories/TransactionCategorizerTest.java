package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.domain.TransactionType;
import com.app.budgetbuddy.exceptions.TransactionRuleException;
import io.swagger.annotations.Authorization;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionCategorizerTest {

    @Mock
    private TransactionCategoryRuleMatcher transactionCategoryRuleMatcher;

    @Mock
    private CategoryRuleService categoryRuleService;

    @Mock
    private RecurringTransactionCategoryRuleMatcher recurringTransactionCategoryRuleMatcher;

    @InjectMocks
    private TransactionCategorizer transactionCategorizer;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        transactionCategorizer = new TransactionCategorizer(transactionCategoryRuleMatcher, recurringTransactionCategoryRuleMatcher);
    }

    @Test
    void testCategorizeTransactionsBySystemRules_whenTransactionListIsEmpty(){
        List<TransactionRule> actual = transactionCategorizer.categorizeTransactionsBySystemRules(List.of());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCategorizeTransactionsBySystemRules_whenSingleTransaction(){
        Transaction transaction = createTransaction();
        List<TransactionRule> expected = new ArrayList<>();

        TransactionRule expectedRule = TransactionRule.builder()
                .transactionId("123")
                .matchedCategory("Supermarkets And Groceries")
                .categories(List.of("Supermarkets and Groceries", "Shops"))
                .descriptionPattern("PIN PURCHASE WINCO #15")
                .merchantPattern("WINCO FOODS")
                .priority(4)
                .build();

        when(transactionCategoryRuleMatcher.categorizeTransaction(transaction)).thenReturn(expectedRule);

        List<TransactionRule> actual = transactionCategorizer.categorizeTransactionsBySystemRules(List.of(transaction));
        assertEquals(1, actual.size());
        assertEquals("Supermarkets And Groceries", actual.get(0).getMatchedCategory());
        assertEquals(4, actual.get(0).getPriority());
        assertEquals("PIN PURCHASE WINCO #15", actual.get(0).getDescriptionPattern());
    }

    @Test
    void testCategorizeTransactionsBySystemRules_whenMultipleTransactions(){
        Transaction groceryTransaction = createTransaction();
        Transaction gasTransaction = createTransaction("Purchase MAVERIK #413 SOUTH JORDAN UTUS", "Maverik", List.of("Gas Stations", "Travel"), "22009000");
        Transaction rentTransaction = createTransaction("Purchase FLEX FINANCE HTTPSGETFLEX.NYUS", "Flex Finance", List.of("Financial", "Service"), "18020004");

        TransactionRule groceryTransactionRule = TransactionRule.builder()
                .categories(List.of("Supermarkets And Groceries", "Shops"))
                .descriptionPattern("PIN PURCHASE WINCO #15")
                .merchantPattern("WINCO FOODS")
                .matchedCategory("Supermarkets And Groceries")
                .priority(4)
                .transactionId(groceryTransaction.getTransactionId())
                .build();

        TransactionRule gasTransactionRule = TransactionRule.builder()
                .categories(List.of("Gas Stations", "Travel"))
                .descriptionPattern("PURCHASE MAVERIK #413")
                .matchedCategory("Gas Stations")
                .merchantPattern("MAVERIK")
                .transactionId(gasTransaction.getTransactionId())
                .priority(4)
                .build();

        TransactionRule rentTransactionRule = TransactionRule.builder()
                .categories(List.of("Finance", "Service"))
                .descriptionPattern("PURCHASE FLEX FINANCE")
                .matchedCategory("Finance")
                .merchantPattern("FLEX FINANCE")
                .priority(4)
                .transactionId(rentTransaction.getTransactionId())
                .build();

        List<TransactionRule> expected = new ArrayList<>();
        expected.add(gasTransactionRule);
        expected.add(groceryTransactionRule);
        expected.add(rentTransactionRule);

        Mockito.when(transactionCategoryRuleMatcher.categorizeTransaction(groceryTransaction)).thenReturn(groceryTransactionRule);
        Mockito.when(transactionCategoryRuleMatcher.categorizeTransaction(gasTransaction)).thenReturn(gasTransactionRule);
        Mockito.when(transactionCategoryRuleMatcher.categorizeTransaction(rentTransaction)).thenReturn(rentTransactionRule);

        List<TransactionRule> actual = transactionCategorizer.categorizeTransactionsBySystemRules(List.of(groceryTransaction, gasTransaction, rentTransaction));
        // Assert: Verify the results
        assertEquals(3, actual.size(), "The number of categorized transactions should match the expected number.");
        assertTrue(actual.contains(groceryTransactionRule), "The grocery transaction rule should be present.");
        assertTrue(actual.contains(gasTransactionRule), "The gas transaction rule should be present.");
        assertTrue(actual.contains(rentTransactionRule), "The rent transaction rule should be present.");

        // Optional: Verify interaction with the matcher
        Mockito.verify(transactionCategoryRuleMatcher).categorizeTransaction(groceryTransaction);
        Mockito.verify(transactionCategoryRuleMatcher).categorizeTransaction(gasTransaction);
        Mockito.verify(transactionCategoryRuleMatcher).categorizeTransaction(rentTransaction);
    }

    @Test
    void testCategorizeTransactionsBySystemRules_whenExceptionIsThrownDuringCategorization(){
        Transaction groceryTransaction = createTransaction();
        Transaction otherTransaction = createTransaction(
                "Purchase MAVERIK #413 SOUTH JORDAN UTUS",
                "Maverik",
                List.of("Gas Stations", "Travel"),
                "22009000");

        TransactionRule groceryTransactionRule = TransactionRule.builder()
                .categories(List.of("Supermarkets And Groceries", "Shops"))
                .descriptionPattern("PIN PURCHASE WINCO #15")
                .merchantPattern("WINCO FOODS")
                .matchedCategory("Supermarkets And Groceries")
                .priority(4)
                .transactionId(groceryTransaction.getTransactionId())
                .build();

        List<TransactionRule> expected = new ArrayList<>();
        expected.add(groceryTransactionRule);

        // Mock the matcher to throw an exception for one transaction
        Mockito.when(transactionCategoryRuleMatcher.categorizeTransaction(groceryTransaction))
                .thenThrow(new TransactionRuleException("Error categorizing transaction"));

        // Mock the matcher to return a rule for another transaction
        Mockito.when(transactionCategoryRuleMatcher.categorizeTransaction(otherTransaction))
                .thenReturn(TransactionRule.builder()
                        .categories(List.of("Gas Stations", "Travel"))
                        .descriptionPattern("Purchase MAVERIK #413")
                        .matchedCategory("Gas Stations")
                        .merchantPattern("Maverik")
                        .transactionId(otherTransaction.getTransactionId())
                        .priority(4)
                        .build());


        // Act: Call the method
        List<TransactionRule> actual = transactionCategorizer.categorizeTransactionsBySystemRules(
                List.of(groceryTransaction, otherTransaction));

        // Assert: Verify that only the valid transaction was processed successfully
        assertEquals(1, actual.size(), "One transaction rule should be created successfully.");
        assertEquals("Gas Stations", actual.get(0).getMatchedCategory(), "The matched category should be 'Gas Stations'.");

        // Verify that both transactions were attempted to be categorized
        Mockito.verify(transactionCategoryRuleMatcher, times(1)).categorizeTransaction(groceryTransaction);
        Mockito.verify(transactionCategoryRuleMatcher, times(1)).categorizeTransaction(otherTransaction);
    }

    @Test
    void testCategorizeTransaction_whenNullTransactionFound_returnRemainingTransactionRules() {
        // Arrange: Create a valid transaction and a null transaction
        Transaction groceryTransaction = createTransaction();

        // Mock behavior to return a rule for the valid transaction
        Mockito.when(transactionCategoryRuleMatcher.categorizeTransaction(groceryTransaction))
                .thenReturn(TransactionRule.builder()
                        .categories(List.of("Supermarkets And Groceries", "Shops"))
                        .descriptionPattern("PIN PURCHASE WINCO #15")
                        .merchantPattern("WINCO FOODS")
                        .matchedCategory("Supermarkets And Groceries")
                        .priority(4)
                        .transactionId(groceryTransaction.getTransactionId())
                        .build());

        List<Transaction> transactions = new ArrayList<>();
        transactions.add(null);
        transactions.add(groceryTransaction);


        // Act: Call the method under test with a null transaction
        List<TransactionRule> actual = transactionCategorizer.categorizeTransactionsBySystemRules(
                transactions);

        // Assert: Verify that the valid transaction was processed successfully
        assertEquals(1, actual.size(), "One transaction rule should be created successfully.");
        assertEquals("Supermarkets And Groceries", actual.get(0).getMatchedCategory(), "The matched category should be 'Supermarkets And Groceries'.");

        // Verify that categorizeTransaction was called only for the non-null transaction
        Mockito.verify(transactionCategoryRuleMatcher, times(1)).categorizeTransaction(groceryTransaction);
    }

    @Test
    void testCategorizeTransactionsByUserRules_whenTransactionListIsEmpty(){
        List<Transaction> transactions = new ArrayList<>();
        List<TransactionRule> actual = transactionCategorizer.categorizeTransactionByUserRules(transactions, 1L);
        assertTrue(actual.isEmpty(), "One transaction rule should be created successfully.");
    }

    @Test
    void testCategorizeTransactionsByUserRules_whenSingleTransaction(){
        final Transaction groceryTransaction = createTransaction();
        final Long userId = 1L;
        TransactionRule expectedRule = TransactionRule.builder()
                .transactionId("123")
                .matchedCategory("Supermarkets And Groceries")
                .categories(List.of("Supermarkets and Groceries", "Shops"))
                .descriptionPattern("PIN PURCHASE WINCO #15")
                .merchantPattern("WINCO FOODS")
                .priority(4)
                .build();


        Mockito.when(transactionCategoryRuleMatcher.categorizeTransactionByUserRules(groceryTransaction, userId))
                .thenReturn(expectedRule);

        List<TransactionRule> actual = transactionCategorizer.categorizeTransactionByUserRules(List.of(groceryTransaction), userId);
        assertEquals(1, actual.size(), "One transaction rule should be created successfully.");
        assertEquals("Supermarkets And Groceries", actual.get(0).getMatchedCategory(), "The matched category should be 'Supermarkets and Groceries'.");

        verify(transactionCategoryRuleMatcher, times(1)).categorizeTransactionByUserRules(groceryTransaction, userId);
    }

    private TransactionRule createTransactionRule(String merchant, String category, String description, int priority) {
        return TransactionRule.builder()
                .merchantPattern(merchant)
                .matchedCategory(category)
                .descriptionPattern(description)
                .priority(priority)
                .build();
    }

    private TransactionRule createTransactionRule(int priority){
        TransactionRule transactionRule = new TransactionRule();
        transactionRule.setPriority(priority);
        transactionRule.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        transactionRule.setTransactionId("#2342342");
        transactionRule.setMerchantPattern("winco");
        return transactionRule;
    }

    private Transaction createTransaction(String description, String merchantName, List<String> categories, String categoryId){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(15.75),
                "USD",
                categories,
                categoryId,
                LocalDate.of(2024, 9, 30),
                description,
                merchantName,
                merchantName,
                false,
                "transaction123",
                LocalDate.of(2024, 9, 30),
                "http://example.com/logo.png",
                LocalDate.of(2024, 9, 30)
        );
        return transaction;
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


    @AfterEach
    void tearDown() {
    }
}