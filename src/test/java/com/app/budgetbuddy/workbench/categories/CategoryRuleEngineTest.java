package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryRule;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.services.TransactionLoaderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class CategoryRuleEngineTest {

    @Mock
    private CategoryRuleCreator categoryRuleCreator;

    @Mock
    private TransactionCategorizer transactionCategorizer;

    @Mock
    private TransactionLoaderService transactionLoaderService;

    @InjectMocks
    private CategoryRuleEngine categoryRuleEngine;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
    }

//    @Test
//    void testGetCategorizedTransactionsWithSystemRules_whenTransactionsIsEmpty(){
//        List<Transaction> transactionList = new ArrayList<>();
//        Map<Transaction, CategoryRule> categorizedTransactionsSystemRules = categoryRuleEngine.getCategorizedTransactionsWithSystemRules(transactionList);
//        assertTrue(categorizedTransactionsSystemRules.isEmpty());
//    }

    @Test
    void testGetCategorizedTransactionsWithSystemRules_whenTransactionsIsNotEmpty(){

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