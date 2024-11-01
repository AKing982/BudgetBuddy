package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionType;
import com.app.budgetbuddy.services.CategoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

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
        List<RecurringTransactionDTO> recurringTransactionDTOS = new ArrayList<>();
        Set<CategoryRule> actual = categoryRuleManager.createCategoryRuleListFromTransactions(transactions, recurringTransactionDTOS);
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

        List<CategoryRule> actual = categoryRuleManager.createCategoryRuleListFromTransactions(transactions);
        assertEquals(expectedCategoryRules, actual);
        for(int i = 0; i < expectedCategoryRules.size(); i++){
            assertEquals(expectedCategoryRules.get(i), actual.get(i));
            assertEquals(expectedCategoryRules.get(i).getCategoryName(), actual.get(i).getCategoryName());
            assertEquals(expectedCategoryRules.get(i).getDescriptionPattern(), actual.get(i).getDescriptionPattern());
            assertEquals(expectedCategoryRules.get(i).getFrequency(), actual.get(i).getFrequency());
            assertEquals(expectedCategoryRules.get(i).isRecurring(), actual.get(i).isRecurring());
        }

    }

    private Transaction createAffirmTransaction() {
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
    private Transaction createAutoZoneTransaction() {
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

    private Transaction createDepositTransfer() {
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

    private Transaction createGroceriesTransaction() {
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

    public CategoryRule createAffirmRule() {
        return new CategoryRule(
                "Financial",         // categoryName
                "Affirm",            // merchantPattern
                "AFFIRM PAY",        // descriptionPattern
                null,                // frequency
                TransactionType.PURCHASE, // transactionType
                false                // isRecurring
        );
    }

    public CategoryRule createAutoZoneRule() {
        return new CategoryRule(
                "Automotive",        // categoryName
                "AutoZone",          // merchantPattern
                null,                // descriptionPattern
                null,                // frequency
                TransactionType.PURCHASE, // transactionType
                false                // isRecurring
        );
    }

    public CategoryRule createWalmartRule() {
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