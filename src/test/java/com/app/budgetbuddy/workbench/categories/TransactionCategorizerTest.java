package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.domain.TransactionType;
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
                .matchedCategory("Supermarkets and Groceries")
                .descriptionPattern("WINCO FOODS.*")
                .merchantPattern("WINCO.*")
                .priority(4)
                .build();

        CategoryRule groceriesRule = new CategoryRule();
        groceriesRule.setCategoryId("19047000");
        groceriesRule.setTransactionType(TransactionType.CREDIT);
        groceriesRule.setCategoryName("Supermarkets and Groceries");
        groceriesRule.setDescriptionPattern("WINCO FOODS.*");
        groceriesRule.setRecurring(false);
        groceriesRule.setFrequency("ONCE");
        groceriesRule.setPriority(4);
        groceriesRule.setMerchantPattern("WINCO FOODS #15");

        CategoryRule shopsRule = new CategoryRule();
        shopsRule.setCategoryId("19047001");
        shopsRule.setTransactionType(TransactionType.CREDIT);
        shopsRule.setCategoryName("Shops");
        shopsRule.setDescriptionPattern(".*FOODS.*");
        shopsRule.setRecurring(false);
        shopsRule.setPriority(2);
        shopsRule.setMerchantPattern(".*FOODS.*");


        transactionCategoryRuleMatcher.setSystemCategoryRules(List.of(groceriesRule, shopsRule));
        Mockito.when(transactionCategoryRuleMatcher.categorizeTransaction(transaction)).thenReturn(expectedRule);

        List<TransactionRule> actual = transactionCategorizer.categorizeTransactionsBySystemRules(List.of(transaction));
        assertEquals(1, actual.size());
        assertEquals("Supermarkets And Groceries", actual.get(0).getMatchedCategory());
        assertEquals(4, actual.get(0).getPriority());
        assertEquals("PIN PURCHASE WINCO #15", actual.get(0).getDescriptionPattern());
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