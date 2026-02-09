package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.Category;
import com.app.budgetbuddy.domain.Transaction;
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

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionCategorizerServiceImplTest
{
    @Mock
    private MerchantMatcherService merchantMatcherService;

    @Mock
    private UserCategoryService userCategoryService;

    @Mock
    private AccountService accountService;

    @Mock
    private TransactionRuleService transactionRuleService;

    private TransactionCategorizerServiceImpl transactionCategorizerService;

    private Transaction transaction;

    @BeforeEach
    void setUp() {
        transactionCategorizerService = new TransactionCategorizerServiceImpl(userCategoryService, accountService, transactionRuleService, merchantMatcherService);
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
        transaction.setPrimaryCategory("Food and Drink");
        transaction.setAccountId("e2323232");
        transaction.setSecondaryCategory("Restaurants");
        transaction.setMerchantName("McDonald's");



        // When
        Category result = transactionCategorizerService.categorize(transaction);

        // Then
        assertNotNull(result);
        assertEquals("Restaurants", result.getCategoryName());
    }



    @AfterEach
    void tearDown() {
    }
}