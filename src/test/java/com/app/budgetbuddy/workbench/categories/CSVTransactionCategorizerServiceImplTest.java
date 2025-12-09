package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.TransactionCSV;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;

import static org.junit.Assert.assertEquals;

@SpringBootTest
class CSVTransactionCategorizerServiceImplTest
{

    @Autowired
    @Qualifier("CSVTransactionCategorizerServiceImpl")
    private CategorizerService<TransactionCSV> transactionCSVCategorizerService;

    @MockBean
    private TransactionRuleService transactionRuleService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCategorize_whenTransactionCSVIsNull(){
        CategoryType categoryType = transactionCSVCategorizerService.categorize(null);
        Assertions.assertEquals(CategoryType.UNCATEGORIZED, categoryType);
    }

    @Test
    void testCategorize_whenTransactionCSV_hasWINCOTransaction_thenMatchGroceries(){
        TransactionCSV wincoTransactionCSV = new TransactionCSV();
        wincoTransactionCSV.setMerchantName("WINCO FOODS");
        wincoTransactionCSV.setTransactionAmount(BigDecimal.valueOf(75.00));
        CategoryType categoryType = transactionCSVCategorizerService.categorize(wincoTransactionCSV);
        assertEquals(CategoryType.GROCERIES, categoryType);
    }

    @Test
    void testCategorize_whenTransactionCSV_hasRentTransaction_thenMatchRent(){
        TransactionCSV rentTransactionCSV = new TransactionCSV();
        rentTransactionCSV.setMerchantName("FLEX FINANCE");
        rentTransactionCSV.setTransactionAmount(BigDecimal.valueOf(707.0));
        CategoryType categoryType = transactionCSVCategorizerService.categorize(rentTransactionCSV);
        assertEquals(CategoryType.RENT, categoryType);
    }

    @Test
    void testCategorize_whenTransactionCSV_hasWINCOTransaction_MatchOnUserRuleGroceries(){

    }

    @AfterEach
    void tearDown() {
    }
}