package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.AccountNotFoundException;
import com.app.budgetbuddy.exceptions.CategoryException;
import com.app.budgetbuddy.services.AccountService;
import com.app.budgetbuddy.services.UserCategoryService;
import com.app.budgetbuddy.workbench.MerchantMatcherService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionCategorizationEngineTest
{
    @Mock
    private MerchantMatcherService merchantMatcherService;

    @Mock
    private UserCategoryService userCategoryService;

    @Mock
    private AccountService accountService;

    @Mock
    private TransactionRuleService transactionRuleService;

    private TransactionCategorizationEngine transactionCategorizerService;

    private Transaction transaction;

    @BeforeEach
    void setUp() {
        transactionCategorizerService = new TransactionCategorizationEngine(userCategoryService, accountService, transactionRuleService, merchantMatcherService);
    }

    @Test
    void testCategorize_whenTransactionIsNull_thenThrowException() {
        CategoryException exception = assertThrows(CategoryException.class,
                () -> transactionCategorizerService.categorize(null));

        assertEquals("Transaction was found null... Terminating categorization", exception.getMessage());
    }

    @Test
    void testCategorize_whenTransactionHasNoAcctId_thenThrowException() {
        Transaction transaction = new Transaction();
        transaction.setAccountId("");
        transaction.setMerchantName("WINCO");
        transaction.setCategoryId("");
        transaction.setPrimaryCategory("Shops");
        transaction.setSecondaryCategory("Supermarkets and Groceries");

        when(accountService.findByAccountId(anyString())).thenReturn(Optional.empty());
        assertThrows(AccountNotFoundException.class, () -> {
            transactionCategorizerService.categorize(transaction);
        });
    }

    @Test
    void testCategorize_whenTransactionHasZeroPriority_thenReturnUncategorized(){
        Transaction transaction = new Transaction();
        transaction.setAccountId("acct-123");
        transaction.setMerchantName(null);
        transaction.setCategoryId(null);
        transaction.setPrimaryCategory(null);
        transaction.setSecondaryCategory(null);

        Category expected = new  Category();
        expected.setCategoryName("Uncategorized");
        expected.setPlaidCategoryId(null);
        expected.setCategoryId(0L);
        expected.setCategorizedBy("SYSTEM");

        Category actual = transactionCategorizerService.categorize(transaction);
        assertNotNull(actual);
        assertEquals(expected.getCategorizedBy(), actual.getCategorizedBy());
        assertEquals(expected.getPlaidCategoryId(), actual.getPlaidCategoryId());
        assertEquals(expected.getCategoryId(), actual.getCategoryId());
        assertEquals(expected.getCategoryName(), actual.getCategoryName());
    }

    @Test
    void testCategorize_whenTransactionHasPrimaryAndSecondaryCategory_thenReturnCategoryWithHighestPriority() {
        // Given - Highest priority: Primary Category + Secondary Category
        Transaction transaction = new Transaction();
        transaction.setPrimaryCategory("Shops");
        transaction.setAccountId("e2323232");
        transaction.setSecondaryCategory("Supermarkets and Groceries");
        transaction.setMerchantName("WINCO");
        transaction.setCategoryId("19047000");
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId("e2323232");
        accountEntity.setUser(UserEntity.builder().id(1L).build());

        when(accountService.findByAccountId("e2323232")).thenReturn(Optional.of(accountEntity));

        List<TransactionRule> rules = new ArrayList<>();

        when(transactionRuleService.findByUserId(1L)).thenReturn(rules);

        // When
        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result);
        assertEquals("Groceries", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertEquals("19047000", result.getPlaidCategoryId());
        // assertEquals(0L, result.getCategoryId());
    }

    @Test
    void testCategorize_whenTransactionHasOnlyPrimaryCategory_thenReturnCategory(){
        Transaction transaction = new Transaction();
        transaction.setPrimaryCategory("Shops");
        transaction.setAccountId("e2323232");
        transaction.setSecondaryCategory(null);
        transaction.setMerchantName(null);
        transaction.setCategoryId(null);
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId("e2323232");
        accountEntity.setUser(UserEntity.builder().id(1L).build());

        when(accountService.findByAccountId("e2323232")).thenReturn(Optional.of(accountEntity));
        List<TransactionRule> rules = new ArrayList<>();
        when(transactionRuleService.findByUserId(1L)).thenReturn(rules);
        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result);
        assertEquals("Other", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
    }

    @Test
    void testCategorize_whenTransactionHasSecondaryCategoryAndCategoryId_thenReturnCategory(){
        Transaction transaction = new Transaction();
        transaction.setPrimaryCategory(null);
        transaction.setAccountId("e2323232");
        transaction.setSecondaryCategory("Supermarkets and Groceries");
        transaction.setMerchantName(null);
        transaction.setCategoryId("19047000");
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId("e2323232");
        accountEntity.setUser(UserEntity.builder().id(1L).build());

        when(accountService.findByAccountId("e2323232")).thenReturn(Optional.of(accountEntity));
        List<TransactionRule> rules = new ArrayList<>();
        when(transactionRuleService.findByUserId(1L)).thenReturn(rules);
        transactionCategorizerService.initializePlaidCategoryMap();

        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result);
        assertEquals("Groceries", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertEquals("19047000", result.getPlaidCategoryId());
    }

    @Test
    void testCategorize_whenTransactionHasCategoryIdAndPrimaryCategory_thenReturnCategory()
    {
        Transaction transaction = new Transaction();
        transaction.setPrimaryCategory("Payment");
        transaction.setAccountId("e2323232");
        transaction.setSecondaryCategory(null);
        transaction.setMerchantName(null);
        transaction.setCategoryId("16000000");
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId("e2323232");
        accountEntity.setUser(UserEntity.builder().id(1L).build());

        when(accountService.findByAccountId("e2323232")).thenReturn(Optional.of(accountEntity));
        List<TransactionRule> rules = new ArrayList<>();
        when(transactionRuleService.findByUserId(1L)).thenReturn(rules);

        transactionCategorizerService.initializePlaidCategoryMap();

        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result);
        assertEquals("Payment", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertEquals("16000000", result.getPlaidCategoryId());
    }

    @Test
    void testCategorize_whenTransactionHasPrimaryAndSecondary_thenReturnCategory(){
        Transaction transaction = new Transaction();
        transaction.setPrimaryCategory("Shops");
        transaction.setAccountId("e2323232");
        transaction.setSecondaryCategory("Supermarkets and Groceries");
        transaction.setMerchantName(null);
        transaction.setCategoryId(null);
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId("e2323232");
        accountEntity.setUser(UserEntity.builder().id(1L).build());

        when(accountService.findByAccountId("e2323232")).thenReturn(Optional.of(accountEntity));
        List<TransactionRule> rules = new ArrayList<>();
        when(transactionRuleService.findByUserId(1L)).thenReturn(rules);
        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result);
        assertEquals("Groceries", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertEquals("", result.getPlaidCategoryId());
    }

    @Test
    void testCategorize_whenTransactionHasOnlyCategoryId_thenReturnCategory() {
        Transaction transaction = new Transaction();
        transaction.setPrimaryCategory(null);
        transaction.setAccountId("e2323232");
        transaction.setSecondaryCategory(null);
        transaction.setMerchantName(null);
        transaction.setCategoryId("19000000");
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId("e2323232");
        accountEntity.setUser(UserEntity.builder().id(1L).build());

        when(accountService.findByAccountId("e2323232")).thenReturn(Optional.of(accountEntity));
        List<TransactionRule> rules = new ArrayList<>();
        when(transactionRuleService.findByUserId(1L)).thenReturn(rules);
        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result);
        assertEquals("Other", result.getCategoryName());
        assertEquals("SYSTEM", result.getCategorizedBy());
        assertEquals("19000000", result.getPlaidCategoryId());
    }

    @Test
    void testCategorize_whenTransactionMatchesTransactionRule_thenReturnCategory(){
        Transaction transaction = new Transaction();
        transaction.setPrimaryCategory("Shops");
        transaction.setAccountId("e2323232");
        transaction.setSecondaryCategory("Supermarkets and Groceries");
        transaction.setMerchantName("WINCO FOODS");
        transaction.setCategoryId("19047000");
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setId("e2323232");
        accountEntity.setUser(UserEntity.builder().id(1L).build());

        when(accountService.findByAccountId("e2323232")).thenReturn(Optional.of(accountEntity));
        List<TransactionRule> rules = new ArrayList<>();

        TransactionRule wincoFoodsRule = new TransactionRule();
        wincoFoodsRule.setMerchantRule("WINCO FOODS");
        wincoFoodsRule.setActive(true);
        wincoFoodsRule.setUserId(1L);
        wincoFoodsRule.setCategoryName("Shopping");
        wincoFoodsRule.setPriority(2);
        rules.add(wincoFoodsRule);

        when(transactionRuleService.findByUserId(1L)).thenReturn(rules);
        when(userCategoryService.getCategoryIdByNameAndUser("Shopping", 1L))
                .thenReturn(2L);
        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result);
        assertEquals("Shopping", result.getCategoryName());
        assertEquals("USER", result.getCategorizedBy());
        assertEquals(2L, result.getCategoryId());
        assertEquals("19047000", result.getPlaidCategoryId());
    }

    @ParameterizedTest
    @MethodSource("providePlaidTransactions")
    void testCategorize_plaidTransactionsSystemRules( String primaryCategory,
                                           String secondaryCategory,
                                           String categoryId,
                                           String merchantName,
                                           String expectedCategoryName,
                                           String expectedCategorizedBy,
                                           String expectedPlaidCategoryId,
                                           String testDescription){
        Transaction transaction = new Transaction();
        transaction.setAccountId("acct-123");
        transaction.setPrimaryCategory(primaryCategory);
        transaction.setSecondaryCategory(secondaryCategory);
        transaction.setCategoryId(categoryId);
        transaction.setMerchantName(merchantName);
        AccountEntity accountEntity = new AccountEntity();
        accountEntity.setUser(UserEntity.builder().id(1L).build());
        accountEntity.setId("acct-123");

        when(accountService.findByAccountId("acct-123")).thenReturn(Optional.of(accountEntity));
        when(transactionRuleService.findByUserId(1L)).thenReturn(new ArrayList<>());
        transactionCategorizerService.initializePlaidCategoryMap();

        // When
        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result, "Category should not be null");
        assertEquals(expectedCategoryName, result.getCategoryName(),
                "Category name mismatch for: " + testDescription);
        assertEquals(expectedCategorizedBy, result.getCategorizedBy(),
                "CategorizedBy mismatch for: " + testDescription);
        assertEquals(expectedPlaidCategoryId, result.getPlaidCategoryId(),
                "Plaid category ID mismatch for: " + testDescription);

    }

    @ParameterizedTest
    @MethodSource("provideTransactionRuleMatchingScenarios")
    void testMatches_transactionRulePermutations(
            String merchantName,
            String description,
            String name,
            BigDecimal amount,
            String merchantRule,
            String descriptionRule,
            String extendedDescriptionRule,
            double amountMin,
            double amountMax,
            boolean isActive,
            boolean expectedMatch,
            String testDescription
    ) {
        // Given
        Transaction transaction = new Transaction();
        transaction.setMerchantName(merchantName);
        transaction.setDescription(description);
        transaction.setName(name);
        transaction.setAmount(amount);
        transaction.setAccountId("acct-123");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule(merchantRule);
        rule.setDescriptionRule(descriptionRule);
        rule.setExtendedDescriptionRule(extendedDescriptionRule);
        rule.setAmountMin(amountMin);
        rule.setAmountMax(amountMax);
        rule.setActive(isActive);
        rule.setCategoryName("Test Category");

        // When
        boolean result = transactionCategorizerService.matches(transaction, rule);

        // Then
        assertEquals(expectedMatch, result,
                "Match result mismatch for: " + testDescription);
    }

    private static Stream<Arguments> provideTransactionRuleMatchingScenarios() {
        return Stream.of(
                // ========== MERCHANT RULE MATCHING ==========

                // Exact merchant match (case-insensitive)
                Arguments.of(
                        "WINCO FOODS", null, null, new BigDecimal("50.00"),
                        "WINCO FOODS", null, null, 0.0, 0.0, true,
                        true,
                        "Exact merchant match - uppercase"
                ),

                Arguments.of(
                        "winco foods", null, null, new BigDecimal("50.00"),
                        "WINCO FOODS", null, null, 0.0, 0.0, true,
                        true,
                        "Merchant match - case insensitive"
                ),

                Arguments.of(
                        "Winco Foods", null, null, new BigDecimal("50.00"),
                        "winco foods", null, null, 0.0, 0.0, true,
                        true,
                        "Merchant match - mixed case"
                ),

                // Merchant mismatch
                Arguments.of(
                        "SAFEWAY", null, null, new BigDecimal("50.00"),
                        "WINCO FOODS", null, null, 0.0, 0.0, true,
                        false,
                        "Merchant mismatch"
                ),

                // Null merchant name
                Arguments.of(
                        null, null, null, new BigDecimal("50.00"),
                        "WINCO FOODS", null, null, 0.0, 0.0, true,
                        false,
                        "Null merchant name"
                ),

                // Empty merchant rule
                Arguments.of(
                        "WINCO FOODS", null, null, new BigDecimal("50.00"),
                        "", null, null, 0.0, 0.0, true,
                        false,
                        "Empty merchant rule"
                ),

                // Null merchant rule
                Arguments.of(
                        "WINCO FOODS", null, null, new BigDecimal("50.00"),
                        null, null, null, 0.0, 0.0, true,
                        false,
                        "Null merchant rule"
                ),

                // ========== DESCRIPTION RULE MATCHING ==========

                // Exact description match
                Arguments.of(
                        null, "PURCHASE AT STARBUCKS", null, new BigDecimal("5.50"),
                        null, "PURCHASE AT STARBUCKS", null, 0.0, 0.0, true,
                        true,
                        "Exact description match"
                ),

                Arguments.of(
                        null, "purchase at starbucks", null, new BigDecimal("5.50"),
                        null, "PURCHASE AT STARBUCKS", null, 0.0, 0.0, true,
                        true,
                        "Description match - case insensitive"
                ),

                // Description mismatch
                Arguments.of(
                        null, "PURCHASE AT TARGET", null, new BigDecimal("50.00"),
                        null, "PURCHASE AT STARBUCKS", null, 0.0, 0.0, true,
                        false,
                        "Description mismatch"
                ),

                // Null description
                Arguments.of(
                        null, null, null, new BigDecimal("50.00"),
                        null, "PURCHASE AT STARBUCKS", null, 0.0, 0.0, true,
                        false,
                        "Null description"
                ),

                // Empty description rule
                Arguments.of(
                        null, "PURCHASE AT STARBUCKS", null, new BigDecimal("5.50"),
                        null, "", null, 0.0, 0.0, true,
                        false,
                        "Empty description rule"
                ),

                // ========== EXTENDED DESCRIPTION RULE MATCHING ==========

                // Extended rule matches description (contains)
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("29.99"),
                        null, null, "amazon", 0.0, 0.0, true,
                        true,
                        "Extended rule matches description (contains)"
                ),

                // Extended rule matches name (contains)
                Arguments.of(
                        null, "ONLINE PURCHASE", "Amazon Prime Subscription", new BigDecimal("14.99"),
                        null, null, "amazon", 0.0, 0.0, true,
                        true,
                        "Extended rule matches name (contains)"
                ),

                // Extended rule matches both
                Arguments.of(
                        null, "AMAZON MARKETPLACE", "Amazon Order #12345", new BigDecimal("99.99"),
                        null, null, "amazon", 0.0, 0.0, true,
                        true,
                        "Extended rule matches both description and name"
                ),

                // Extended rule case insensitive
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("29.99"),
                        null, null, "AMAZON", 0.0, 0.0, true,
                        true,
                        "Extended rule - case insensitive"
                ),

                // Extended rule no match
                Arguments.of(
                        null, "PURCHASE AT WALMART", "Walmart Grocery", new BigDecimal("50.00"),
                        null, null, "amazon", 0.0, 0.0, true,
                        false,
                        "Extended rule no match"
                ),

                // Extended rule with null description and name
                Arguments.of(
                        null, null, null, new BigDecimal("50.00"),
                        null, null, "amazon", 0.0, 0.0, true,
                        false,
                        "Extended rule with null description and name"
                ),

                // ========== AMOUNT RANGE MATCHING (with Extended Description) ==========

                // Amount within range
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("50.00"),
                        null, null, "amazon", 10.0, 100.0, true,
                        true,
                        "Amount within range"
                ),

                // Amount at minimum boundary
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("10.00"),
                        null, null, "amazon", 10.0, 100.0, true,
                        true,
                        "Amount at minimum boundary"
                ),

                // Amount at maximum boundary
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("100.00"),
                        null, null, "amazon", 10.0, 100.0, true,
                        true,
                        "Amount at maximum boundary"
                ),

                // Amount below range
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("5.00"),
                        null, null, "amazon", 10.0, 100.0, true,
                        false,
                        "Amount below range"
                ),

                // Amount above range
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("150.00"),
                        null, null, "amazon", 10.0, 100.0, true,
                        false,
                        "Amount above range"
                ),

                // No amount restriction (both 0)
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("999.99"),
                        null, null, "amazon", 0.0, 0.0, true,
                        true,
                        "No amount restriction (0,0)"
                ),

                // Null amount
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, null,
                        null, null, "amazon", 10.0, 100.0, true,
                        false,
                        "Null amount fails range check"
                ),

                // ========== INACTIVE RULE ==========

                // Rule is inactive - should not match even with perfect merchant match
                Arguments.of(
                        "WINCO FOODS", null, null, new BigDecimal("50.00"),
                        "WINCO FOODS", null, null, 0.0, 0.0, false,
                        false,
                        "Inactive rule - no match"
                ),

                Arguments.of(
                        null, "PURCHASE AT STARBUCKS", null, new BigDecimal("5.50"),
                        null, "PURCHASE AT STARBUCKS", null, 0.0, 0.0, false,
                        false,
                        "Inactive rule with description - no match"
                ),

                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("29.99"),
                        null, null, "amazon", 0.0, 0.0, false,
                        false,
                        "Inactive rule with extended description - no match"
                ),

                // ========== MULTIPLE RULES (Priority: Merchant > Description > Extended) ==========

                // Merchant rule takes precedence
                Arguments.of(
                        "STARBUCKS", "WRONG DESCRIPTION", null, new BigDecimal("5.50"),
                        "STARBUCKS", "CORRECT DESCRIPTION", null, 0.0, 0.0, true,
                        true,
                        "Merchant match takes precedence over description mismatch"
                ),

                // Description rule when merchant rule is null
                Arguments.of(
                        "RANDOM MERCHANT", "PURCHASE AT STARBUCKS", null, new BigDecimal("5.50"),
                        null, "PURCHASE AT STARBUCKS", null, 0.0, 0.0, true,
                        true,
                        "Description match when no merchant rule"
                ),

                // Extended description when merchant and description rules are null
                Arguments.of(
                        "RANDOM MERCHANT", "RANDOM DESCRIPTION", "Amazon Gift Card", new BigDecimal("50.00"),
                        null, null, "amazon", 0.0, 0.0, true,
                        true,
                        "Extended description match when no merchant/description rules"
                ),

                // All three rules present, merchant matches
                Arguments.of(
                        "STARBUCKS", "COFFEE PURCHASE", "Starbucks Latte", new BigDecimal("5.50"),
                        "STARBUCKS", "WRONG DESC", "wrong", 0.0, 0.0, true,
                        true,
                        "Merchant matches - others don't matter"
                ),

                // ========== EDGE CASES ==========

                // Empty strings
                Arguments.of(
                        "", "", "", new BigDecimal("50.00"),
                        "", "", "", 0.0, 0.0, true,
                        false,
                        "All empty strings"
                ),

                // Whitespace handling
                Arguments.of(
                        "  WINCO FOODS  ", null, null, new BigDecimal("50.00"),
                        "WINCO FOODS", null, null, 0.0, 0.0, true,
                        false,
                        "Merchant with whitespace - exact match required"
                ),

                // Partial merchant name (should fail - requires exact match)
                Arguments.of(
                        "WINCO FOODS #123", null, null, new BigDecimal("50.00"),
                        "WINCO FOODS", null, null, 0.0, 0.0, true,
                        false,
                        "Partial merchant match fails"
                ),

                // Special characters in merchant name
                Arguments.of(
                        "WAL*MART", null, null, new BigDecimal("50.00"),
                        "WAL*MART", null, null, 0.0, 0.0, true,
                        true,
                        "Special characters in merchant name"
                ),

                // Very large amount
                Arguments.of(
                        null, "PURCHASE AT AMAZON.COM", null, new BigDecimal("999999.99"),
                        null, null, "amazon", 0.0, 0.0, true,
                        true,
                        "Very large amount with no restriction"
                ),

                // Negative amount
                Arguments.of(
                        null, "REFUND FROM AMAZON", null, new BigDecimal("-50.00"),
                        null, null, "amazon", -100.0, 0.0, true,
                        true,
                        "Negative amount within range"
                ),

                // Zero amount
                Arguments.of(
                        null, "PENDING TRANSACTION", null, new BigDecimal("0.00"),
                        null, null, "pending", 0.0, 100.0, true,
                        true,
                        "Zero amount at minimum boundary"
                ),

                // ========== REAL-WORLD SCENARIOS ==========

                // Coffee shop rule
                Arguments.of(
                        "STARBUCKS STORE #1234", null, null, new BigDecimal("6.75"),
                        "STARBUCKS STORE #1234", null, null, 0.0, 0.0, true,
                        true,
                        "Real-world: Coffee shop with store number"
                ),

                // Gas station with amount range
                Arguments.of(
                        null, "SHELL GAS STATION", null, new BigDecimal("45.00"),
                        null, null, "shell", 20.0, 100.0, true,
                        true,
                        "Real-world: Gas station with typical fill-up amount"
                ),

                // Subscription service
                Arguments.of(
                        null, "RECURRING PAYMENT", "Netflix Subscription", new BigDecimal("15.99"),
                        null, null, "netflix", 10.0, 20.0, true,
                        true,
                        "Real-world: Netflix subscription"
                ),

                // Grocery store with various formats
                Arguments.of(
                        null, "WINCO FOODS #89", "Grocery Purchase", new BigDecimal("127.45"),
                        null, null, "winco", 0.0, 0.0, true,
                        true,
                        "Real-world: Grocery store purchase"
                ),

                // Online marketplace
                Arguments.of(
                        null, "AMZN Mktp US", "Amazon.com order", new BigDecimal("83.47"),
                        null, null, "amzn", 0.0, 0.0, true,
                        true,
                        "Real-world: Amazon marketplace format"
                )
        );
    }


    private static Stream<Arguments> providePlaidTransactions() {
        return Stream.of(
                // ========== Priority 1: Primary + Secondary + CategoryId ==========
                Arguments.of(
                        "Shops", "Supermarkets and Groceries", "19047000", "WINCO",
                        "Groceries", "SYSTEM", "19047000",
                        "Priority 1: All fields - Groceries"
                ),

                Arguments.of(
                        "Food and Drink", "Restaurants", "13005000", "Chipotle",
                        "Order Out", "SYSTEM", "13005000",
                        "Priority 1: All fields - Restaurants"
                ),

                Arguments.of(
                        "Travel", "Airlines and Aviation Services", "22001000", "Delta",
                        "Trip", "SYSTEM", "22001000",
                        "Priority 1: All fields - Travel"
                ),

                // ========== Priority 2: Primary + Secondary (no CategoryId) ==========
                Arguments.of(
                        "Shops", "Supermarkets and Groceries", null, "Safeway",
                        "Groceries", "SYSTEM", "",
                        "Priority 2: Primary + Secondary - Groceries"
                ),

                Arguments.of(
                        "Food and Drink", "Restaurants", null, "McDonald's",
                        "Order Out", "SYSTEM", "",
                        "Priority 2: Primary + Secondary - Restaurants"
                ),

                Arguments.of(
                        "Travel", "Airlines and Aviation Services", null, "United",
                        "Trip", "SYSTEM", "",
                        "Priority 2: Primary + Secondary - Airlines"
                ),

                // ========== Priority 5: Secondary + CategoryId (no Primary) ==========
                Arguments.of(
                        null, "Supermarkets and Groceries", "19047000", "",
                        "Groceries", "SYSTEM", "19047000",
                        "Priority 5: Secondary + CategoryId - Groceries"
                ),

                // ========== Priority 6: Primary + CategoryId (no Secondary) ==========
                Arguments.of(
                        "Payment", null, "16000000", null,
                        "Payment", "SYSTEM", "16000000",
                        "Priority 6: Primary + CategoryId - Payment"
                ),

                Arguments.of(
                        "Transfer", null, "21001000", null,
                        "Transfer", "SYSTEM", "21001000",
                        "Priority 6: Primary + CategoryId - Transfer (21001000)"
                ),

                Arguments.of(
                        "Transfer", null, "21002000", null,
                        "Transfer", "SYSTEM", "21002000",
                        "Priority 6: Primary + CategoryId - Transfer (21002000)"
                ),

                Arguments.of(
                        "Transfer", null, "21005000", null,
                        "Transfer", "SYSTEM", "21005000",
                        "Priority 6: Primary + CategoryId - Transfer (21005000)"
                ),

                // ========== Priority 7: Primary only ==========
                Arguments.of(
                        "Shops", null, null, null,
                        "Other", "SYSTEM", "",
                        "Priority 7: Primary only - Shops"
                ),

                Arguments.of(
                        "Food and Drink", null, null, null,
                        "Order Out", "SYSTEM", "",
                        "Priority 7: Primary only - Food and Drink"
                ),

                Arguments.of(
                        "Travel", null, null, null,
                        "Trip", "SYSTEM", "",
                        "Priority 7: Primary only - Travel"
                ),

                Arguments.of(
                        "Payment", null, null, null,
                        "Payment", "SYSTEM", "",
                        "Priority 7: Primary only - Payment"
                ),

                Arguments.of(
                        "Transfer", null, null, null,
                        "Transfer", "SYSTEM", "",
                        "Priority 7: Primary only - Transfer"
                ),

                Arguments.of(
                        "Recreation", null, null, null,
                        "Other", "SYSTEM", "",
                        "Priority 7: Primary only - Recreation"
                ),

                Arguments.of(
                        "Healthcare", null, null, null,
                        "Other", "SYSTEM", "",
                        "Priority 7: Primary only - Healthcare"
                ),

                Arguments.of(
                        "Service", null, null, null,
                        "Other", "SYSTEM", "",
                        "Priority 7: Primary only - Service"
                ),

                // ========== Priority 8: Secondary only ==========
                Arguments.of(
                        null, "Supermarkets and Groceries", null, null,
                        "Groceries", "SYSTEM", "",
                        "Priority 8: Secondary only - Groceries"
                ),

                Arguments.of(
                        null, "Restaurants", null, null,
                        "Order Out", "SYSTEM", "",
                        "Priority 8: Secondary only - Restaurants"
                ),

                Arguments.of(
                        null, "Gas Stations", null, null,
                        "Gas", "SYSTEM", "",
                        "Priority 8: Secondary only - Gas"
                ),

                Arguments.of(
                        null, "Utilities", null, null,
                        "Utilities", "SYSTEM", "",
                        "Priority 8: Secondary only - Utilities"
                ),

                Arguments.of(
                        null, "Airlines and Aviation Services", null, null,
                        "Trip", "SYSTEM", "",
                        "Priority 8: Secondary only - Airlines"
                ),

                Arguments.of(
                        null, "Public Transportation Services", null, null,
                        "Trip", "SYSTEM", "",
                        "Priority 8: Secondary only - Public Transit"
                ),

                Arguments.of(
                        null, "Gyms and Fitness Centers", null, null,
                        "Subscription", "SYSTEM", "",
                        "Priority 8: Secondary only - Gym"
                ),

                Arguments.of(
                        null, "Pharmacies", null, null,
                        "Other", "SYSTEM", "",
                        "Priority 8: Secondary only - Pharmacy"
                ),

                Arguments.of(
                        null, "Pets", null, null,
                        "Pet", "SYSTEM", "",
                        "Priority 8: Secondary only - Pets"
                ),

                Arguments.of(
                        null, "Rent", null, null,
                        "Rent", "SYSTEM", "",
                        "Priority 8: Secondary only - Rent"
                ),

                Arguments.of(
                        null, "Insurance", null, null,
                        "Insurance", "SYSTEM", "",
                        "Priority 8: Secondary only - Insurance"
                ),

//                Arguments.of(
//                        null, "Electric", null, null,
//                        "Electric", "SYSTEM", "",
//                        "Priority 8: Secondary only - Electric"
//                ),

                Arguments.of(
                        null, "Subscription", null, null,
                        "Subscription", "SYSTEM", "",
                        "Priority 8: Secondary only - Subscription"
                ),

                Arguments.of(
                        null, "Payroll", null, null,
                        "Income", "SYSTEM", "",
                        "Priority 8: Secondary only - Payroll"
                ),

//                Arguments.of(
//                        null, "Deposit", null, null,
//                        "Deposit", "SYSTEM", "",
//                        "Priority 8: Secondary only - Deposit"
//                ),
//
//                Arguments.of(
//                        null, "Withdrawal", null, null,
//                        "Withdrawal", "SYSTEM", "",
//                        "Priority 8: Secondary only - Withdrawal"
//                ),

                Arguments.of(
                        null, "Internal Account Transfer", null, null,
                        "Transfer", "SYSTEM", "",
                        "Priority 8: Secondary only - Internal Transfer"
                ),

                Arguments.of(
                        null, "Refund", null, null,
                        "Refund", "SYSTEM", "",
                        "Priority 8: Secondary only - Refund"
                ),

                // ========== Priority 9: CategoryId only ==========
                Arguments.of(
                        null, null, "13005000", null,
                        "Order Out", "SYSTEM", "13005000",
                        "Priority 9: CategoryId only - Order Out (13005000)"
                ),

                Arguments.of(
                        null, null, "13001000", null,
                        "Order Out", "SYSTEM", "13001000",
                        "Priority 9: CategoryId only - Order Out (13001000)"
                ),

                Arguments.of(
                        null, null, "13000000", null,
                        "Order Out", "SYSTEM", "13000000",
                        "Priority 9: CategoryId only - Order Out (13000000)"
                ),

                Arguments.of(
                        null, null, "21001000", null,
                        "Transfer", "SYSTEM", "21001000",
                        "Priority 9: CategoryId only - Transfer (21001000)"
                ),

                Arguments.of(
                        null, null, "21002000", null,
                        "Transfer", "SYSTEM", "21002000",
                        "Priority 9: CategoryId only - Transfer (21002000)"
                ),

                Arguments.of(
                        null, null, "21004000", null,
                        "Transfer", "SYSTEM", "21004000",
                        "Priority 9: CategoryId only - Transfer (21004000)"
                ),

                Arguments.of(
                        null, null, "21005000", null,
                        "Transfer", "SYSTEM", "21005000",
                        "Priority 9: CategoryId only - Transfer (21005000)"
                ),

                Arguments.of(
                        null, null, "22002000", null,
                        "Trip", "SYSTEM", "22002000",
                        "Priority 9: CategoryId only - Trip (22002000)"
                ),

                Arguments.of(
                        null, null, "22001000", null,
                        "Trip", "SYSTEM", "22001000",
                        "Priority 9: CategoryId only - Trip (22001000)"
                ),

                // ========== Priority 0: Uncategorized ==========
                Arguments.of(
                        null, null, null, null,
                        "Uncategorized", "SYSTEM", null,
                        "Priority 0: All fields null"
                ),

                Arguments.of(
                        "", "", "", "",
                        "Uncategorized", "SYSTEM", null,
                        "Priority 0: All fields empty"
                )

                // ========== Edge Cases: Unknown values ==========
//                Arguments.of(
//                        "Unknown Primary", null, null, null,
//                        "Uncategorized", "SYSTEM", "",
//                        "Edge case: Unknown primary category"
//                ),
//
//                Arguments.of(
//                        null, "Unknown Secondary", null, null,
//                        "Uncategorized", "SYSTEM", "",
//                        "Edge case: Unknown secondary category"
//                ),
//
//                Arguments.of(
//                        null, null, "99999999", null,
//                        "Uncategorized", "SYSTEM", "99999999",
//                        "Edge case: Unknown categoryId"
//                )
        );
    }


    @Test
    void testMatches_whenTransactionIsNull_thenReturnFalse(){
        TransactionRule rule = new TransactionRule();
        boolean result = transactionCategorizerService.matches(null, rule);
        assertFalse(result);
    }

    @Test
    void testMatches_whenTransactionRuleIsNull_thenReturnFalse(){
        Transaction transaction = new Transaction();
        boolean result = transactionCategorizerService.matches(transaction, null);
        assertFalse(result);
    }

    @Test
    void testMatches_whenTransactionMatchesRule_thenReturnTrue(){
        Transaction transaction = new Transaction();
        transaction.setMerchantName("WINCO FOODS");
        transaction.setAccountId("acct-123");
        transaction.setDescription("");
        transaction.setPrimaryCategory("Shops");

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO FOODS");
        rule.setActive(true);
        boolean result = transactionCategorizerService.matches(transaction, rule);
        assertTrue(result);
    }



    @AfterEach
    void tearDown() {
    }
}