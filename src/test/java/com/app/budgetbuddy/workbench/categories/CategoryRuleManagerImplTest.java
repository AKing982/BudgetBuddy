package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.services.CategoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CategoryRuleManagerImplTest {

    @Mock
    private CategoryRuleService categoryRuleService;

    @Mock
    private CategoryService categoryService;

    @InjectMocks
    private CategoryRuleManagerImpl categoryRuleManager;

    @BeforeEach
    void setUp() {
        categoryRuleManager = new CategoryRuleManagerImpl(categoryRuleService, categoryService);
    }

    @Test
    void testCreateCategoryRuleListFromTransactions_whenTransactionsListIsEmpty(){
        List<Transaction> transactions = new ArrayList<>();
        List<RecurringTransaction> recurringTransactionDTOS = new ArrayList<>();
        List<CategoryRule> actual = categoryRuleManager.createCategoryRuleListFromTransactions(transactions, recurringTransactionDTOS);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateCategoryRuleListFromTransactions_returnCategoryRules(){
        List<Transaction> transactions = new ArrayList<>();
        transactions.add(createAffirmTransaction());
        transactions.add(createAutoZoneTransaction());
        transactions.add(createGroceriesTransaction());

        List<CategoryRule> expectedCategoryRules = new ArrayList<>();
        expectedCategoryRules.add(createAffirmRule());
        expectedCategoryRules.add(createAutoZoneRule());
        expectedCategoryRules.add(createWalmartRule());

        List<RecurringTransaction> recurringTransactionDTOS = new ArrayList<>();

        Mockito.when(categoryService.findCategoryById("cat-001")).thenReturn(Optional.of(createCategory("cat-001")));

        List<CategoryRule> actual = categoryRuleManager.createCategoryRuleListFromTransactions(transactions, recurringTransactionDTOS);
        assertEquals(expectedCategoryRules, actual);
        for(int i = 0; i < expectedCategoryRules.size(); i++){
            assertEquals(expectedCategoryRules.get(i), actual.get(i));
            assertEquals(expectedCategoryRules.get(i).getCategoryName(), actual.get(i).getCategoryName());
            assertEquals(expectedCategoryRules.get(i).getDescriptionPattern(), actual.get(i).getDescriptionPattern());
            assertEquals(expectedCategoryRules.get(i).getFrequency(), actual.get(i).getFrequency());
            assertEquals(expectedCategoryRules.get(i).isRecurring(), actual.get(i).isRecurring());
        }
    }

    @Test
    void testRuleMatchesTransaction_whenCategoryRuleIsNull_thenReturnFalse(){
        Boolean result = categoryRuleManager.ruleMatchesTransaction(null, createAffirmTransaction());
        assertFalse(result);
    }

    @Test
    void testRuleMatchesTransaction_whenTransactionIsNull_thenReturnFalse(){
        Boolean result = categoryRuleManager.ruleMatchesTransaction(createAffirmRule(), null);
        assertFalse(result);
    }

    @Test
    void testRuleMatchesTransaction_thenReturnTrue(){
        CategoryRule groceryRule = createWalmartRule();
        Transaction groceryTransaction = createGroceriesTransaction();
        Boolean result = categoryRuleManager.ruleMatchesTransaction(groceryRule, groceryTransaction);
        assertTrue(result);
    }

    @ParameterizedTest
    @MethodSource("provideCategoryRulesAndTransactions")
    void testRuleMatchesTransaction(CategoryRule categoryRule, Transaction transaction, boolean expectedMatch) {
        Boolean result = categoryRuleManager.ruleMatchesTransaction(categoryRule, transaction);
        assertEquals(expectedMatch, result);
    }

    @Test
    void testValidateCategoryRule_whenCategoryRuleNull_thenReturnFalse(){
        boolean result = categoryRuleManager.validateCategoryRule(null);
        assertFalse(result);
    }

    @Test
    void testValidateCategoryRule_whenCategoryNameIsNull_thenReturnFalse(){
        boolean result = categoryRuleManager.validateCategoryRule(createBadCategoryRule(null, "Walmart", "Walmart"));
        assertFalse(result);
    }

    @Test
    void testValidateCategoryRule_whenMerchantPatternNull_thenReturnFalse(){
        boolean result = categoryRuleManager.validateCategoryRule(createBadCategoryRule("Groceries", "Walmart", null));
        assertFalse(result);
    }

    @Test
    void testValidateCategoryRule_whenDescriptionPatternNull_thenReturnFalse(){
        boolean result = categoryRuleManager.validateCategoryRule(createBadCategoryRule("Groceries", null, "Walmart"));
        assertFalse(result);
    }

    @Test
    void testValidateCategoryRule_returnTrue(){
        CategoryRule groceryRule = createWalmartRule();
        boolean result = categoryRuleManager.validateCategoryRule(groceryRule);
        assertTrue(result);
    }

    @Test
    void testGetMatchingCategoryRulesForTransaction_whenTransactionIsNull_thenReturnFalse(){

    }

    /**
     * Method source providing test cases for parameterized test.
     */
    private static Stream<Arguments> provideCategoryRulesAndTransactions() {
        return Stream.of(
                // Null cases
                Arguments.of(null, null, false),
                Arguments.of(createAffirmRule(), null, false),
                Arguments.of(null, createAffirmTransaction(), false),

                // Exact matches
                Arguments.of(createAffirmRule(), createAffirmTransaction(), true),
                Arguments.of(createAutoZoneRule(), createAutoZoneTransaction(), true),
                Arguments.of(createWalmartRule(), createGroceriesTransaction(), true),

                // Mismatches due to merchant pattern
                Arguments.of(createAffirmRule(), createAutoZoneTransaction(), false),
                Arguments.of(createWalmartRule(), createAffirmTransaction(), false),

                // Partial merchant name cases
                Arguments.of(new CategoryRule("Partial Match Test", "Auto", null, null, TransactionType.PURCHASE, false), createAutoZoneTransaction(), true),
                Arguments.of(new CategoryRule("Partial No Match", "Aff", null, null, TransactionType.PURCHASE, false), createGroceriesTransaction(), false)
        );
    }


    private CategoryRule createBadCategoryRule(String categoryName, String descriptionPattern, String merchantName)
    {
        return new CategoryRule(categoryName,merchantName, descriptionPattern, "MONTHLY", TransactionType.PURCHASE, false);
    }

    private CategoryEntity createCategory(String categoryId)
    {
        CategoryEntity category = new CategoryEntity();
        category.setId(categoryId);
        category.setActive(true);
        category.setDescription("Category Description");
        category.setName("Test Category");
        category.setCustom(false);
        return category;
    }

    private static Transaction createAffirmTransaction() {
        return new Transaction(
                "account-12345", // accountId
                new BigDecimal("10.31"), // amount
                "USD", // isoCurrencyCode
                List.of("Financial", "Purchase"), // categories
                "cat-001", // categoryId
                LocalDate.of(2024, 10, 5), // date
                "PIN Purchase AFFIRM P AFFIRM PAY 5YM SAN FRANCIS", // description
                "Affirm", // merchantName
                "Affirm Purchase", // name
                false, // pending
                "txn-001", // transactionId
                LocalDate.of(2024, 10, 4), // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 10, 5) // posted
        );
    }
    private static Transaction createAutoZoneTransaction() {
        return new Transaction(
                "account-67890", // accountId
                new BigDecimal("211.28"), // amount
                "USD", // isoCurrencyCode
                List.of("Automotive"), // categories
                "cat-002", // categoryId
                LocalDate.of(2024, 10, 5), // date
                "AutoZone", // description
                "AutoZone", // merchantName
                "AutoZone Purchase", // name
                false, // pending
                "txn-002", // transactionId
                LocalDate.of(2024, 10, 5), // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 10, 5) // posted
        );
    }

    private static Transaction createDepositTransfer() {
        return new Transaction(
                "account-33333", // accountId
                new BigDecimal("-150"), // amount (negative for deposit)
                "USD", // isoCurrencyCode
                List.of("Credit"), // categories
                "cat-003", // categoryId
                LocalDate.of(2024, 10, 4), // date
                "Deposit Transfer From Share 01, Mobile Branch FT Transfer Dep", // description
                "", // merchantName (empty for transfers)
                "Deposit Transfer", // name
                false, // pending
                "txn-003", // transactionId
                LocalDate.of(2024, 10, 4), // authorizedDate
                "", // logoUrl
                LocalDate.of(2024, 10, 4) // posted
        );
    }

    private static Transaction createGroceriesTransaction() {
        return new Transaction(
                "account-44444", // accountId
                new BigDecimal("2.55"), // amount
                "USD", // isoCurrencyCode
                List.of("Supermarkets and Groceries"), // categories
                "cat-004", // categoryId
                LocalDate.of(2024, 10, 5), // date
                "Walmart", // description
                "Walmart", // merchantName
                "Walmart Purchase", // name
                false, // pending
                "txn-004", // transactionId
                LocalDate.of(2024, 10, 4), // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 10, 5) // posted
        );
    }

    public static CategoryRule createAffirmRule() {
        return new CategoryRule(
                "Financial",         // categoryName
                "Affirm",            // merchantPattern
                "AFFIRM PAY",        // descriptionPattern
                null,                // frequency
                TransactionType.PURCHASE, // transactionType
                false                // isRecurring
        );
    }

    public static CategoryRule createAutoZoneRule() {
        return new CategoryRule(
                "Automotive",        // categoryName
                "AutoZone",          // merchantPattern
                null,                // descriptionPattern
                null,                // frequency
                TransactionType.PURCHASE, // transactionType
                false                // isRecurring
        );
    }

    public static CategoryRule createWalmartRule() {
        return new CategoryRule(
                "Supermarkets and Groceries", // categoryName
                "Walmart",             // merchantPattern
                null,                  // descriptionPattern
                null,                  // frequency
                TransactionType.PURCHASE, // transactionType
                false                  // isRecurring
        );
    }



    @AfterEach
    void tearDown() {
    }
}