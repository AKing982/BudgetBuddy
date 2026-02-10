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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

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
        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result);
        assertEquals("Shopping", result.getCategoryName());
        assertEquals("USER", result.getCategorizedBy());
        assertEquals(2L, result.getCategoryId());
        assertEquals("19047000", result.getPlaidCategoryId());
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

        TransactionRule rule = new TransactionRule();
        rule.setMerchantRule("WINCO FOODS");
        boolean result = transactionCategorizerService.matches(transaction, rule);
        assertTrue(result);
    }




    @AfterEach
    void tearDown() {
    }
}