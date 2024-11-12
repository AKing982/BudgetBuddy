package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionType;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.services.CategoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class TransactionCategoryRuleMatcherTest {

    @Mock
    private CategoryRuleService categoryRuleService;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private TransactionCategoryRuleMatcher categoryRuleMatcher;

    private CategoryRule categoryRule;

    @BeforeEach
    void setUp() {
        categoryRule = new CategoryRule();
        categoryRule.setCategoryName("Supermarkets and Groceries");
        categoryRule.setDescriptionPattern("groceries|supermarkets|foods");
        categoryRule.setFrequency("DAILY");
        categoryRule.setMerchantPattern("winco");
        categoryRule.setRecurring(false);
        categoryRule.setTransactionType(TransactionType.CREDIT);
        MockitoAnnotations.openMocks(this);
    }

    @Test
    void testMatchesRule_whenTransactionIsNull_shouldReturnFalse(){
        assertFalse(categoryRuleMatcher.matchesRule(null, categoryRule));
    }


    @Test
    void testMatchesRule_whenCategoryRuleIsNull_shouldReturnFalse() {
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(29.99),
                "USD",
                List.of("Groceries"),
                "category123",
                LocalDate.of(2024, 10, 1),
                "groceries",
                "winco foods",
                "WINCO FOODS #15 11969 S Carlsbad Way Herrim",
                false,
                "transaction123",
                LocalDate.of(2024, 10, 1),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 1)
        );
        assertFalse(categoryRuleMatcher.matchesRule(transaction, null));
    }

    @Test
    void testMatchesRule_whenOnlyMerchantPatternMatches_shouldReturnTrue() {
        assertTrue(categoryRuleMatcher.matchesRule(createTransactionWithInvalidDescription(), categoryRule));
    }

    @Test
    void testMatchesRule_whenOnlyDescriptionPatternMatches_shouldReturnTrue() {
        assertTrue(categoryRuleMatcher.matchesRule(createTransactionWithDescriptionOnly(), categoryRule));
    }

    @Test
    void testMatchesRule_whenBothMerchantAndDescriptionPatternMatch_shouldReturnTrue() {
        assertTrue(categoryRuleMatcher.matchesRule(createTransaction(), categoryRule));
    }

    @Test
    void testMatchesRule_whenNeitherMerchantNorDescriptionPatternMatches_shouldReturnFalse() {
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(120.00),
                "USD",
                List.of("Electronics"),
                "category123",
                LocalDate.of(2024, 10, 2),
                "Electronics Purchase",
                "Best Buy",
                "Purchase BEST BUY #1234 Electronics",
                false,
                "transaction456",
                LocalDate.of(2024, 10, 2),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 2)
        );
        assertFalse(categoryRuleMatcher.matchesRule(transaction, categoryRule));
    }

    @Test
    void testMatchesRule_whenPatternPartiallyMatchesDescription_shouldReturnTrue() {
        // "Supermarkets and Groceries" contains "supermarkets", a partial match
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(25.50),
                "USD",
                List.of("Groceries"),
                "category123",
                LocalDate.of(2024, 10, 3),
                "supermarkets and groceries",
                "other store",
                "Purchase at Local Supermarket",
                false,
                "transaction654",
                LocalDate.of(2024, 10, 3),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 3)
        );
        assertTrue(categoryRuleMatcher.matchesRule(transaction, categoryRule));
    }

    @Test
    void testMatchesRule_whenCategoryListMatchesCategoryRuleList_shouldReturnTrue() {
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(25.50),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "",
                LocalDate.of(2024, 10, 3),
                "",
                "",
                "",
                false,
                "transaction654",
                LocalDate.of(2024, 10, 3),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 3)
        );
        assertTrue(categoryRuleMatcher.matchesRule(transaction, categoryRule));
    }

    @Test
    void testMatchesRule_whenCategoryIdMatchesCategoryNameInCategoryRule_shouldReturnTrue() {
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(25.50),
                "USD",
                List.of(),
                "19047000",
                LocalDate.of(2024, 10, 3),
                "",
                "",
                "",
                false,
                "transaction654",
                LocalDate.of(2024, 10, 3),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 3)
        );

        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
        assertTrue(categoryRuleMatcher.matchesRule(transaction, categoryRule));
    }

    @Test
    void testMatchesRule_whenTransactionMatchesAllRules_shouldReturnTrue() {
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
        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
        assertTrue(categoryRuleMatcher.matchesRule(transaction, categoryRule));
    }

    @Test
    void testCategorizeTransaction_whenTransactionIsNull_thenReturnEmptyString(){
        String categorizedTransaction = categoryRuleMatcher.categorizeTransaction(null);
        assertTrue(categorizedTransaction.isEmpty());
    }

    @Test
    void testCategorizeTransaction_whenDescriptionInvalid_thenUseOtherPattern(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(29.99),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "19047000",
                LocalDate.of(2024, 10, 1),
                "",
                "Winco Foods",
                "",
                false,
                "transaction123",
                LocalDate.of(2024, 10, 1),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 1)
        );

        CategoryRule nonMatchingRule = new CategoryRule();
        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");

        // Populate the systemCategoryRules with a rule that won't match
        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));
        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));

        String expected = "Supermarkets and Groceries";
        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
        assertEquals(expected, actual);
        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
    }

    @Test
    void testCategorizeTransaction_whenMerchantNameIsInvalid_thenUseOtherPattern(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(29.99),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "19047000",
                LocalDate.of(2024, 10, 1),
                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
                "",
                "Winco Foods",
                false,
                "transaction123",
                LocalDate.of(2024, 10, 1),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 1)
        );

        CategoryRule nonMatchingRule = new CategoryRule();
        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");

        // Populate the systemCategoryRules with a rule that won't match
        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));

        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
        assertEquals("Supermarkets and Groceries", actual);
        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
    }

    @Test
    void testCategorizeTransaction_whenCategoryIdIsInvalid_thenUseOtherPattern(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(29.99),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "",
                LocalDate.of(2024, 10, 1),
                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
                "Winco Foods",
                "Winco Foods",
                false,
                "transaction123",
                LocalDate.of(2024, 10, 1),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 1)
        );
        CategoryRule nonMatchingRule = new CategoryRule();
        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");
        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));

        Mockito.when(categoryService.findCategoryById("")).thenReturn(Optional.empty());
        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
        System.out.println("Actual value: " + actual);
        assertEquals("Supermarkets and Groceries", actual);
        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
    }

    @Test
    void testCategorizeTransaction_whenCategoriesListEmpty_thenUseOtherPattern(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(29.99),
                "USD",
                List.of(),
                "19047000",
                LocalDate.of(2024, 10, 1),
                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
                "Winco Foods",
                "Winco Foods",
                false,
                "transaction123",
                LocalDate.of(2024, 10, 1),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 1)
        );
        CategoryRule nonMatchingRule = new CategoryRule();
        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");

        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));
        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
        assertEquals("Supermarkets and Groceries", actual);
        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
    }

    @Test
    void testCategorizeTransaction_whenTransactionCriteriaEmpty_thenReturnUncategorized(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(29.99),
                "USD",
                List.of(),
                "",
                LocalDate.of(2024, 10, 1),
                "",
                "",
                "",
                false,
                "transaction123",
                LocalDate.of(2024, 10, 1),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 1)
        );
        CategoryRule nonMatchingRule = new CategoryRule();
        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");

        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));
        Mockito.when(categoryService.findCategoryById("")).thenReturn(Optional.empty());
        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
        assertEquals("Uncategorized", actual);
        assertTrue(!categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
        assertTrue(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
    }

    @Test
    void testCategorizeTransaction_whenMultipleRulesMatch_thenSelectCorrectRule(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(29.99),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "19047000",
                LocalDate.of(2024, 10, 1),
                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
                "Winco Foods",
                "Winco Foods",
                false,
                "transaction123",
                LocalDate.of(2024, 10, 1),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 1)
        );

        CategoryRule matchingRule1 = new CategoryRule();
        matchingRule1.setCategoryName("Supermarkets and Groceries");
        matchingRule1.setMerchantPattern("Winco Foods");
        matchingRule1.setDescriptionPattern("foods|groceries|supermarkets");

        CategoryRule matchingRule2 = new CategoryRule();
        matchingRule2.setCategoryName("Shops");
        matchingRule2.setMerchantPattern("Winco");
        matchingRule2.setDescriptionPattern("PIN Purchase WINCO FOODS");

        categoryRuleMatcher.setSystemCategoryRules(List.of(matchingRule1, matchingRule2));
        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));

        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
        assertEquals("Supermarkets and Groceries", actual);
        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
    }

    @Test
    void testCategorizeTransaction_whenCaseInsensitiveMatch_thenMatchCorrectly() {
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(29.99),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "19047000",
                LocalDate.of(2024, 10, 1),
                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
                "WINCO FOODS",
                "",
                false,
                "transaction123",
                LocalDate.of(2024, 10, 1),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 1)
        );

        CategoryRule groceriesRule = new CategoryRule();
        groceriesRule.setCategoryName("Supermarkets and Groceries");
        groceriesRule.setMerchantPattern("winco");  // Lowercase pattern

        categoryRuleMatcher.setSystemCategoryRules(List.of(groceriesRule));
        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
        assertEquals("Supermarkets and Groceries", actual);
        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
        assertTrue(!categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
    }



    private CategoryEntity createGroceryCategory(){
        CategoryEntity categoryEntity = new CategoryEntity();
        categoryEntity.setActive(true);
        categoryEntity.setDescription("Supermarkets and Groceries");
        categoryEntity.setCustom(false);
        categoryEntity.setName("Supermarkets and Groceries");
        return categoryEntity;
    }


    private Transaction createTransactionWithInvalidDescription(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(29.99),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "19047000",
                LocalDate.of(2024, 10, 1),
                "",
                "Winco Foods",
                "",
                false,
                "transaction123",
                LocalDate.of(2024, 10, 1),
                "http://example.com/logo.png",
                LocalDate.of(2024, 10, 1)
        );
        return transaction;
    }

    private Transaction createTransactionWithDescriptionOnly(){
        Transaction transaction = new Transaction(
                "account123",
                BigDecimal.valueOf(15.75),
                "USD",
                List.of("Supermarkets and Groceries", "Shops"),
                "19047000",
                LocalDate.of(2024, 9, 30),
                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
                "",
                "",
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