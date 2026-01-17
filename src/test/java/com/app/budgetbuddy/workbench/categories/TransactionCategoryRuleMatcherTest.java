package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.PlaidCategoryManager;
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
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class TransactionRuleMatcherTest {

    @Mock
    private TransactionRuleService transactionRuleService;

    @Mock
    private CategoryService categoryService;

    @Mock
    private PlaidCategoryManager plaidCategoryManager;

    @InjectMocks
    private TransactionRuleMatcher categoryRuleMatcher;

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
        when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));

        MockitoAnnotations.openMocks(this);
    }

//    @Test
//    void testHasUserAssignedPriority_whenTransactionRuleNull_thenReturnFalse(){
//        assertFalse(categoryRuleMatcher.hasUserAssignedPriority(null, List.of(createUserRule("Test", "Test","Test" , 1)), 1L));
//    }

//    @Test
//    void testMatchingDescriptionPriority() {
//        UserCategoryRule userRule = createUserRule(
//                "YouTubePremium",
//                "Digital Purchase",
//                "YouTubePremium g.co/helppay#",
//                3
//        );
//        userRule.setUserId(1L);
//        userRule.setActive(true);
//        userRule.setTransactionType(TransactionType.DEBIT);
//        userRule.setRecurring(true);
//        userRule.setFrequency("MONTHLY");
//
//        TransactionRule subscriptionTransaction = createTransactionRule(
//                "",
//                "",
//                "YouTubePremium g.co/helppay#",
//                3
//        );
//
//        assertTrue(categoryRuleMatcher.hasUserAssignedPriority(subscriptionTransaction, List.of(userRule), 1L));
//    }
//
//    @Test
//    void testHasUserAssignedPriorityInactivePriority() {
//        UserCategoryRule userRule = createUserRule("Walmart", null, "PURCHASE.*", 1);
//        userRule.setActive(false);
//        TransactionRule transRule = createTransactionRule("Walmart", null, "PURCHASE.*", 1);
//
//        categoryRuleMatcher.setUserCategoryRules(List.of(userRule));
//        assertFalse(categoryRuleMatcher.hasUserAssignedPriority(transRule, List.of(userRule), 1L));
//    }

//    @Test
//    void testHasUserAssignedPriority_MultipleRules(){
//        UserCategoryRule groceryRule = createUserRule(
//                "WINCO.*",
//                "Groceries",
//                "PIN Purchase WINCO.*",
//                1
//        );
//        UserCategoryRule gasRule = createUserRule(
//                "MAVERIK.*",
//                "Gas",
//                "Purchase MAVERIK.*",
//                1
//        );
//
//        // Transaction should only match grocery rule
//        TransactionRule transactionRule = createTransactionRule(
//                "WINCO FOODS",
//                "Groceries",
//                "PIN Purchase WINCO FOODS",
//                1
//        );
//        categoryRuleMatcher.setUserCategoryRules(List.of(groceryRule, gasRule));
//        assertTrue(categoryRuleMatcher.hasUserAssignedPriority(transactionRule, List.of(groceryRule,gasRule), 1L));
//    }
//
//    @Test
//    void testMatchingMerchantPriority() {
//        UserCategoryRule userRule = createUserRule(
//                "WINCO FOODS #15",
//                "Supermarkets and Groceries",
//                "",
//                1
//        );
//        userRule.setUserId(1L);
//        userRule.setActive(true);
//        userRule.setTransactionType(TransactionType.DEBIT);
//
//        TransactionRule groceryTransaction = createTransactionRule(
//                "WINCO FOODS #15",
//                "",
//                "PIN Purchase",
//                1
//        );
//
//        categoryRuleMatcher.setUserCategoryRules(List.of(userRule));
//        assertTrue(categoryRuleMatcher.hasUserAssignedPriority(groceryTransaction, List.of(userRule),1L));
//    }
//
//    @Test
//    void testMatchingCategoryPriority() {
//        UserCategoryRule userRule = createUserRule(
//                "ROCKYMTN/PACIFIC POWER",
//                "Utilities",
//                "ROCKYMTN/PACIFIC POWER BILL.*",
//                2
//        );
//        userRule.setUserId(1L);
//        userRule.setActive(true);
//        userRule.setTransactionType(TransactionType.DEBIT);
//        userRule.setRecurring(true);
//        userRule.setFrequency("MONTHLY");
//
//        TransactionRule utilityTransaction = createTransactionRule(
//                "",
//                "Utilities",
//                "",
//                2
//        );
//
//        categoryRuleMatcher.setUserCategoryRules(List.of(userRule));
//        assertTrue(categoryRuleMatcher.hasUserAssignedPriority(utilityTransaction, List.of(userRule),1L));
//    }
//
//    @Test
//    void testPriorityMismatch() {
//        UserCategoryRule userRule = createUserRule(
//                "SMITHS #4276",
//                "Supermarkets and Groceries",
//                "PIN Purchase SMITHS.*",
//                1
//        );
//        userRule.setUserId(1L);
//        userRule.setActive(true);
//        userRule.setTransactionType(TransactionType.DEBIT);
//
//        TransactionRule groceryTransaction = createTransactionRule(
//                "SMITHS #4276",
//                "Supermarkets and Groceries",
//                "PIN Purchase SMITHS #4276 5448 DAYBREAK PARK",
//                2  // Different priority
//        );
//
//        categoryRuleMatcher.setUserCategoryRules(List.of(userRule));
//        assertFalse(categoryRuleMatcher.hasUserAssignedPriority(groceryTransaction, List.of(userRule),1L));
//    }
//
//    @Test
//    void testCategorizeTransactionByUserRules_whenTransactionIsNull_thenThrowException(){
//        assertThrows(IllegalArgumentException.class, () ->{
//            categoryRuleMatcher.categorizeTransactionByUserRules(null, 1L);
//        });
//    }
//
//    @Test
//    void testCategorizeTransactionByUserRules_whenUserIdIsInvalid_thenThrowException(){
//        assertThrows(InvalidUserIDException.class, () ->{
//            categoryRuleMatcher.categorizeTransactionByUserRules(createTransaction(), -1L);
//        });
//    }
//
//    @Test
//    void testCategorizeTransactionByUserRules_whenMatchingUserRuleExists_thenReturnMatchingRule() {
//        // Arrange
//        Transaction transaction = createTransaction();
//
//        UserCategoryRule userRule = createUserRule(
//                "WINCO",           // merchantPattern
//                "Supermarkets and Groceries",          // categoryName
//                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",     // descriptionPattern
//                1                    // priority
//        );
//        userRule.setUserId(1L);
//        userRule.setActive(true);
//        userRule.setTransactionType(TransactionType.DEBIT);
//
//        categoryRuleMatcher.setUserCategoryRules(List.of(userRule));
//
//        // Act
//        TransactionRule result = categoryRuleMatcher.categorizeTransactionByUserRules(transaction, 1L);
//
//        // Assert
//        assertNotNull(result);
//        assertEquals("Supermarkets and Groceries", result.getMatchedCategory());
//        assertEquals(1, result.getPriority());
//        assertEquals("Winco Foods", result.getMerchantPattern());
//        assertEquals("PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024", result.getDescriptionPattern());
//    }
//
//    @Test
//    void testCategorizeTransactionByUserRules_whenUserRulesEmpty_thenReturnUncategorized(){
//        Transaction transaction = createTransaction();
//
//        categoryRuleMatcher.setUserCategoryRules(List.of());
//
//        TransactionRule result = categoryRuleMatcher.categorizeTransactionByUserRules(transaction, 1L);
//        assertNotNull(result);
//        assertEquals("Uncategorized", result.getMatchedCategory());
//        assertEquals(4, result.getPriority());
//        assertEquals("PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024", result.getDescriptionPattern());
//    }
//
//    @Test
//    void testCategorizeTransactionByUserRules_withMatchingPriority() {
//        // Arrange
//        Transaction transaction = createTransaction("PIN Purchase WINCO FOODS #15", "WINCO FOODS #15", List.of("Supermarkets And Groceries", "Shops"), "19047000");
//
//        UserCategoryRule userRule = createUserRule(
//                "WINCO FOODS #15",
//                "Groceries",
//                "PIN Purchase WINCO.*",
//                1  // High priority
//        );
//        userRule.setUserId(1L);
//        userRule.setActive(true);
//
//        categoryRuleMatcher.setUserCategoryRules(List.of(userRule));
//
//        // Act
//        TransactionRule result = categoryRuleMatcher.categorizeTransactionByUserRules(transaction, 1L);
//
//        // Assert
//        assertNotNull(result);
//        assertEquals("Groceries", result.getMatchedCategory());
//        assertEquals(1, result.getPriority());
////        assertTrue(categoryRuleMatcher.hasUserAssignedPriority(result, 1L));
//    }
//
//    @Test
//    void testCategorizeTransactionByUserRules_withNonMatchingPriority() {
//        // Arrange
//        Transaction transaction = createTransaction("PIN Purchase WINCO FOODS #15", "", List.of(""), "");
//
//        UserCategoryRule userRule = createUserRule(
//                "WINCO FOODS #15",
//                "Supermarkets And Groceries",
//                "PIN Purchase WINCO.*",
//                5  // Medium priority when transaction would be high priority
//        );
//        userRule.setUserId(1L);
//        userRule.setActive(true);
//
//        categoryRuleMatcher.setUserCategoryRules(List.of(userRule));
//
//        // Act
//        TransactionRule result = categoryRuleMatcher.categorizeTransactionByUserRules(transaction, 1L);
//
//        // Assert
//        assertNotNull(result);
//        assertEquals("Uncategorized", result.getMatchedCategory());
//        assertTrue(categoryRuleMatcher.getUnmatchedRules().contains(result));
//    }

//    @Test
//    void testCategorizeTransaction_whenSystemCategoryRulesEmpty_returnPlaidCategory(){
//        Transaction transaction = createTransaction("PIN Purchase WINCO FOODS #15", "WINCO FOODS #15", List.of("Supermarkets and Groceries", "Shops"), "19047000");
//        categoryRuleMatcher.setSystemCategoryRules(List.of());
//
//        when(plaidCategoryManager.getCategory("Supermarkets and Groceries")).thenReturn(new PlaidCategory("Supermarkets and Groceries", "Shops"));
//
//        TransactionRule result = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertNotNull(result);
//        assertEquals("Supermarkets and Groceries", result.getMatchedCategory());
//        assertEquals(4, result.getPriority());
//        assertEquals("WINCO FOODS #15", result.getMerchantPattern());
//        assertEquals("PIN Purchase WINCO FOODS #15", result.getDescriptionPattern());
//    }
//
//    @Test
//    void testCategorizeTransaction_whenSystemCategoryRulesEmpty_TransactionHasNoDescriptionOrMerchantName_returnPlaidCategory(){
//        Transaction transaction = createTransaction("", "", List.of("Supermarkets and Groceries", "Shops"), "19047000");
//        categoryRuleMatcher.setSystemCategoryRules(List.of());
//
//        when(plaidCategoryManager.getCategory("Supermarkets and Groceries")).thenReturn(new PlaidCategory("Supermarkets and Groceries", "Shops"));
//
//        TransactionRule result = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertNotNull(result);
//        assertEquals("Supermarkets and Groceries", result.getMatchedCategory());
//        assertEquals(1, result.getPriority());
//        assertEquals("", result.getMerchantPattern());
//        assertEquals("", result.getDescriptionPattern());
//    }
//
//    @Test
//    void testCategorizeTransaction_whenSystemCategoryRulesEmpty_TransactionHasDescriptionAndNoMerchantNameAndCategoryId_returnPlaidCategory(){
//        Transaction transaction = createTransaction("PIN Purchase WINCO FOODS #15", "", List.of("Supermarkets and Groceries", "Shops"), "19047000");
//        categoryRuleMatcher.setSystemCategoryRules(List.of());
//
//        when(plaidCategoryManager.getCategory("Supermarkets and Groceries")).thenReturn(new PlaidCategory("Supermarkets and Groceries", "Shops"));
//        TransactionRule result = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertNotNull(result);
//        assertEquals("Supermarkets and Groceries", result.getMatchedCategory());
//        assertEquals(2, result.getPriority());
//        assertEquals("", result.getMerchantPattern());
//    }
//
//    @Test
//    void testCategorizeTransaction_whenSystemCategoryRulesEmpty_TransactionHasOnlyDescription_thenReturnUnmatchedCategory(){
//        Transaction transaction = createTransaction("PIN Purchase WINCO FOODS #15", "", List.of(), "");
//        categoryRuleMatcher.setSystemCategoryRules(List.of());
//
//        when(plaidCategoryManager.getCategory("")).thenReturn(null);
//        TransactionRule result = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertNotNull(result);
//        assertEquals("Uncategorized", result.getMatchedCategory());
//        assertEquals(1, result.getPriority());
//        assertEquals("", result.getMerchantPattern());
//    }
//
//    @Test
//    void testCategorizeTransaction_whenSystemCategoryRulesEmpty_TransactionHasDescriptionAndCategoryId_thenReturnCategory(){
//        Transaction transaction = createTransaction("PIN Purchase WINCO FOODS #15", "", List.of(), "19047000");
//        categoryRuleMatcher.setSystemCategoryRules(List.of());
//
//        when(plaidCategoryManager.getCategory("")).thenReturn(null);
//
//
//        TransactionRule result = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertNotNull(result);
//        assertEquals("Supermarkets and Groceries", result.getMatchedCategory());
//        assertEquals(1, result.getPriority());
//        assertEquals("", result.getMerchantPattern());
//        assertEquals("PIN Purchase WINCO FOODS #15", result.getDescriptionPattern());
//    }
//
//    @Test
//    void testCategorizeTransaction_whenSystemCategoryRulesEmpty_whenTransactionHasNoCriteria_thenReturnUncategorized(){
//        Transaction transaction = createTransaction("", "", List.of(), "");
//        categoryRuleMatcher.setSystemCategoryRules(List.of());
//
//        when(plaidCategoryManager.getCategory("")).thenReturn(null);
//        TransactionRule result = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertNotNull(result);
//        assertEquals("Uncategorized", result.getMatchedCategory());
//        assertEquals(0, result.getPriority());
//        assertEquals("", result.getMerchantPattern());
//        assertEquals("", result.getDescriptionPattern());
//    }

//    @Test
//    void testCategorizeTransaction_withSystemRules_multipleRulesMatchHighestPriority(){
//        Transaction transaction = createTransaction("PIN Purchase WINCO FOODS #15", "WINCO FOODS #15", List.of("Supermarkets and Groceries", "Shops"), "19047000");
//
//        CategoryRule groceriesRule = new CategoryRule();
//        groceriesRule.setCategoryId("19047000");
//        groceriesRule.setTransactionType(TransactionType.CREDIT);
//        groceriesRule.setCategoryName("Supermarkets and Groceries");
//        groceriesRule.setDescriptionPattern("WINCO FOODS.*");
//        groceriesRule.setRecurring(false);
//        groceriesRule.setFrequency("ONCE");
//        groceriesRule.setPriority(4);
//        groceriesRule.setMerchantPattern("WINCO FOODS #15");
//
//        CategoryRule shopsRule = new CategoryRule();
//        shopsRule.setCategoryId("19047001");
//        shopsRule.setTransactionType(TransactionType.CREDIT);
//        shopsRule.setCategoryName("Shops");
//        shopsRule.setDescriptionPattern(".*FOODS.*");
//        shopsRule.setRecurring(false);
//        shopsRule.setPriority(2);
//        shopsRule.setMerchantPattern(".*FOODS.*");
//
//        categoryRuleMatcher.setSystemCategoryRules(List.of(groceriesRule, shopsRule));
//        when(categoryService.findCategoryById("19047000"))
//                .thenReturn(Optional.of(createGroceryCategory()));
//
//        TransactionRule result = categoryRuleMatcher.categorizeTransaction(transaction);
//
//        assertNotNull(result);
//        assertEquals("Supermarkets and Groceries", result.getMatchedCategory());
//        assertEquals(4, result.getPriority());
//        assertEquals("WINCO FOODS #15", result.getMerchantPattern());
//        assertEquals("PIN Purchase WINCO FOODS #15", result.getDescriptionPattern());
//    }

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
                LocalDate.of(2024, 9, 30),
                false
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
                LocalDate.of(2024, 9, 30),
                false
        );
        return transaction;
    }


    private UserCategoryRule createUserRule(String merchant, String category, String description, int priority) {
        UserCategoryRule rule = new UserCategoryRule();
        rule.setMerchantPattern(merchant);
        rule.setCategoryName(category);
        rule.setDescriptionPattern(description);
        rule.setPriority(priority);
        rule.setActive(true);
        rule.setUserId(1L);
        rule.setCreatedDate(LocalDateTime.now());
        return rule;
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


//    @Test
//    void testMatchesRule_whenTransactionIsNull_shouldReturnFalse(){
//        assertFalse(categoryRuleMatcher.matchesRule(null, categoryRule));
//    }
//
//
//    @Test
//    void testMatchesRule_whenCategoryRuleIsNull_shouldReturnFalse() {
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(29.99),
//                "USD",
//                List.of("Groceries"),
//                "category123",
//                LocalDate.of(2024, 10, 1),
//                "groceries",
//                "winco foods",
//                "WINCO FOODS #15 11969 S Carlsbad Way Herrim",
//                false,
//                "transaction123",
//                LocalDate.of(2024, 10, 1),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 1)
//        );
//        assertFalse(categoryRuleMatcher.matchesRule(transaction, null));
//    }

//    @Test
//    void testMatchesRule_whenOnlyMerchantPatternMatches_shouldReturnTrue() {
//        assertTrue(categoryRuleMatcher.matchesRule(createTransactionWithInvalidDescription(), categoryRule));
//    }
//
//    @Test
//    void testMatchesRule_whenOnlyDescriptionPatternMatches_shouldReturnTrue() {
//        assertTrue(categoryRuleMatcher.matchesRule(createTransactionWithDescriptionOnly(), categoryRule));
//    }
//
//    @Test
//    void testMatchesRule_whenBothMerchantAndDescriptionPatternMatch_shouldReturnTrue() {
//        assertTrue(categoryRuleMatcher.matchesRule(createTransaction(), categoryRule));
//    }
//
//    @Test
//    void testMatchesRule_whenNeitherMerchantNorDescriptionPatternMatches_shouldReturnFalse() {
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(120.00),
//                "USD",
//                List.of("Electronics"),
//                "category123",
//                LocalDate.of(2024, 10, 2),
//                "Electronics Purchase",
//                "Best Buy",
//                "Purchase BEST BUY #1234 Electronics",
//                false,
//                "transaction456",
//                LocalDate.of(2024, 10, 2),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 2)
//        );
//        assertFalse(categoryRuleMatcher.matchesRule(transaction, categoryRule));
//    }
//
//    @Test
//    void testMatchesRule_whenPatternPartiallyMatchesDescription_shouldReturnTrue() {
//        // "Supermarkets and Groceries" contains "supermarkets", a partial match
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(25.50),
//                "USD",
//                List.of("Groceries"),
//                "category123",
//                LocalDate.of(2024, 10, 3),
//                "supermarkets and groceries",
//                "other store",
//                "Purchase at Local Supermarket",
//                false,
//                "transaction654",
//                LocalDate.of(2024, 10, 3),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 3)
//        );
//        assertTrue(categoryRuleMatcher.matchesRule(transaction, categoryRule));
//    }
//
//    @Test
//    void testMatchesRule_whenCategoryListMatchesCategoryRuleList_shouldReturnTrue() {
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(25.50),
//                "USD",
//                List.of("Supermarkets and Groceries", "Shops"),
//                "",
//                LocalDate.of(2024, 10, 3),
//                "",
//                "",
//                "",
//                false,
//                "transaction654",
//                LocalDate.of(2024, 10, 3),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 3)
//        );
//        assertTrue(categoryRuleMatcher.matchesRule(transaction, categoryRule));
//    }
//
//    @Test
//    void testMatchesRule_whenCategoryIdMatchesCategoryNameInCategoryRule_shouldReturnTrue() {
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(25.50),
//                "USD",
//                List.of(),
//                "19047000",
//                LocalDate.of(2024, 10, 3),
//                "",
//                "",
//                "",
//                false,
//                "transaction654",
//                LocalDate.of(2024, 10, 3),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 3)
//        );
//
//        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
//        assertTrue(categoryRuleMatcher.matchesRule(transaction, categoryRule));
//    }
//
//    @Test
//    void testMatchesRule_whenTransactionMatchesAllRules_shouldReturnTrue() {
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(15.75),
//                "USD",
//                List.of("Supermarkets and Groceries", "Shops"),
//                "19047000",
//                LocalDate.of(2024, 9, 30),
//                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
//                "Winco Foods",
//                "Winco Foods",
//                false,
//                "transaction123",
//                LocalDate.of(2024, 9, 30),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 9, 30)
//        );
//        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
//        assertTrue(categoryRuleMatcher.matchesRule(transaction, categoryRule));
//    }
//
//    @Test
//    void testCategorizeTransaction_whenTransactionIsNull_thenReturnEmptyString(){
//        String categorizedTransaction = categoryRuleMatcher.categorizeTransaction(null);
//        assertTrue(categorizedTransaction.isEmpty());
//    }
//
//    @Test
//    void testCategorizeTransaction_whenDescriptionInvalid_thenUseOtherPattern(){
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(29.99),
//                "USD",
//                List.of("Supermarkets and Groceries", "Shops"),
//                "19047000",
//                LocalDate.of(2024, 10, 1),
//                "",
//                "Winco Foods",
//                "",
//                false,
//                "transaction123",
//                LocalDate.of(2024, 10, 1),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 1)
//        );
//
//        CategoryRule nonMatchingRule = new CategoryRule();
//        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
//        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
//        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");
//
//        // Populate the systemCategoryRules with a rule that won't match
//        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));
//        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
//
//        String expected = "Supermarkets and Groceries";
//        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertEquals(expected, actual);
//        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
//        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
//    }
//
//    @Test
//    void testCategorizeTransaction_whenMerchantNameIsInvalid_thenUseOtherPattern(){
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(29.99),
//                "USD",
//                List.of("Supermarkets and Groceries", "Shops"),
//                "19047000",
//                LocalDate.of(2024, 10, 1),
//                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
//                "",
//                "Winco Foods",
//                false,
//                "transaction123",
//                LocalDate.of(2024, 10, 1),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 1)
//        );
//
//        CategoryRule nonMatchingRule = new CategoryRule();
//        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
//        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
//        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");
//
//        // Populate the systemCategoryRules with a rule that won't match
//        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));
//
//        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
//        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertEquals("Supermarkets and Groceries", actual);
//        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
//        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
//    }
//
//    @Test
//    void testCategorizeTransaction_whenCategoryIdIsInvalid_thenUseOtherPattern(){
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(29.99),
//                "USD",
//                List.of("Supermarkets and Groceries", "Shops"),
//                "",
//                LocalDate.of(2024, 10, 1),
//                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
//                "Winco Foods",
//                "Winco Foods",
//                false,
//                "transaction123",
//                LocalDate.of(2024, 10, 1),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 1)
//        );
//        CategoryRule nonMatchingRule = new CategoryRule();
//        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
//        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
//        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");
//        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));
//
//        Mockito.when(categoryService.findCategoryById("")).thenReturn(Optional.empty());
//        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
//        System.out.println("Actual value: " + actual);
//        assertEquals("Supermarkets and Groceries", actual);
//        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
//        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
//    }
//
//    @Test
//    void testCategorizeTransaction_whenCategoriesListEmpty_thenUseOtherPattern(){
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(29.99),
//                "USD",
//                List.of(),
//                "19047000",
//                LocalDate.of(2024, 10, 1),
//                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
//                "Winco Foods",
//                "Winco Foods",
//                false,
//                "transaction123",
//                LocalDate.of(2024, 10, 1),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 1)
//        );
//        CategoryRule nonMatchingRule = new CategoryRule();
//        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
//        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
//        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");
//
//        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));
//        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
//        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertEquals("Supermarkets and Groceries", actual);
//        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
//        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
//    }
//
//    @Test
//    void testCategorizeTransaction_whenTransactionCriteriaEmpty_thenReturnUncategorized(){
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(29.99),
//                "USD",
//                List.of(),
//                "",
//                LocalDate.of(2024, 10, 1),
//                "",
//                "",
//                "",
//                false,
//                "transaction123",
//                LocalDate.of(2024, 10, 1),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 1)
//        );
//        CategoryRule nonMatchingRule = new CategoryRule();
//        nonMatchingRule.setCategoryName("Supermarkets and Groceries");
//        nonMatchingRule.setMerchantPattern("Winco Foods");  // Pattern that won't match
//        nonMatchingRule.setDescriptionPattern("foods|groceries|supermarkets");
//
//        categoryRuleMatcher.setSystemCategoryRules(List.of(nonMatchingRule));
//        Mockito.when(categoryService.findCategoryById("")).thenReturn(Optional.empty());
//        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertEquals("Uncategorized", actual);
//        assertTrue(!categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
//        assertTrue(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
//    }
//
//    @Test
//    void testCategorizeTransaction_whenMultipleRulesMatch_thenSelectCorrectRule(){
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(29.99),
//                "USD",
//                List.of("Supermarkets and Groceries", "Shops"),
//                "19047000",
//                LocalDate.of(2024, 10, 1),
//                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
//                "Winco Foods",
//                "Winco Foods",
//                false,
//                "transaction123",
//                LocalDate.of(2024, 10, 1),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 1)
//        );
//
//        CategoryRule matchingRule1 = new CategoryRule();
//        matchingRule1.setCategoryName("Supermarkets and Groceries");
//        matchingRule1.setMerchantPattern("Winco Foods");
//        matchingRule1.setDescriptionPattern("foods|groceries|supermarkets");
//
//        CategoryRule matchingRule2 = new CategoryRule();
//        matchingRule2.setCategoryName("Shops");
//        matchingRule2.setMerchantPattern("Winco");
//        matchingRule2.setDescriptionPattern("PIN Purchase WINCO FOODS");
//
//        categoryRuleMatcher.setSystemCategoryRules(List.of(matchingRule1, matchingRule2));
//        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
//
//        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertEquals("Supermarkets and Groceries", actual);
//        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
//        assertFalse(categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
//    }
//
//    @Test
//    void testCategorizeTransaction_whenCaseInsensitiveMatch_thenMatchCorrectly() {
//        Transaction transaction = new Transaction(
//                "account123",
//                BigDecimal.valueOf(29.99),
//                "USD",
//                List.of("Supermarkets and Groceries", "Shops"),
//                "19047000",
//                LocalDate.of(2024, 10, 1),
//                "PIN Purchase WINCO FOODS #15 11969 S Carlsbad Way Herrim, 09-29-2024",
//                "WINCO FOODS",
//                "",
//                false,
//                "transaction123",
//                LocalDate.of(2024, 10, 1),
//                "http://example.com/logo.png",
//                LocalDate.of(2024, 10, 1)
//        );
//
//        CategoryRule groceriesRule = new CategoryRule();
//        groceriesRule.setCategoryName("Supermarkets and Groceries");
//        groceriesRule.setMerchantPattern("winco");  // Lowercase pattern
//
//        categoryRuleMatcher.setSystemCategoryRules(List.of(groceriesRule));
//        Mockito.when(categoryService.findCategoryById("19047000")).thenReturn(Optional.of(createGroceryCategory()));
//        String actual = categoryRuleMatcher.categorizeTransaction(transaction);
//        assertEquals("Supermarkets and Groceries", actual);
//        assertTrue(categoryRuleMatcher.getMatchedTransactions().containsKey(transaction));
//        assertTrue(!categoryRuleMatcher.getUnmatchedTransactions().contains(transaction));
//    }
//
//    @Test
//    void testCategorizeTransactionByCustomRule_whenTransactionIsNull_thenThrowException() {
//        UserCategoryRule userCategoryRule = new UserCategoryRule();
//        userCategoryRule.setCategoryName("Supermarkets and Groceries");
//        userCategoryRule.setMerchantPattern("winco");
//        assertThrows(IllegalArgumentException.class, () -> {
//            categoryRuleMatcher.categorizeTransactionByCustomRule(null, userCategoryRule);
//        });
//    }
//
//    @Test
//    void testCategorizeTransactionByCustomRule_whenUserCategoryRuleIsNull_thenThrowException() {
//        assertThrows(IllegalArgumentException.class, () -> {
//            categoryRuleMatcher.categorizeTransactionByCustomRule(createTransaction(), null);
//        });
//    }


    private CategoryEntity createGroceryCategory(){
        CategoryEntity categoryEntity = new CategoryEntity();
        categoryEntity.setActive(true);
        categoryEntity.setDescription("Supermarkets and Groceries");
        categoryEntity.setCustom(false);
        categoryEntity.setCategory("Supermarkets and Groceries");
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
                LocalDate.of(2024, 10, 1),
                false
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
                LocalDate.of(2024, 9, 30),
                false
        );
        return transaction;
    }








    @AfterEach
    void tearDown() {
    }
}