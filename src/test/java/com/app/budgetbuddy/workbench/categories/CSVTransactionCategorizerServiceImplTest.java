package com.app.budgetbuddy.workbench.categories;

import com.app.budgetbuddy.domain.CSVTransactionRule;
import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.TransactionRule;
import org.junit.jupiter.api.*;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.util.stream.Stream;

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
    void testCategorize_whenTransactionCSV_hasFLEXFinanceSubscription_thenMatchSubscription(){
        TransactionCSV rentTransactionCSV = new TransactionCSV();
        rentTransactionCSV.setMerchantName("FLEX FINANCE");
        rentTransactionCSV.setTransactionAmount(BigDecimal.valueOf(14.99));
        CategoryType categoryType = transactionCSVCategorizerService.categorize(rentTransactionCSV);
        assertEquals(CategoryType.SUBSCRIPTION, categoryType);
    }

    @ParameterizedTest
    @MethodSource("provideTransactionsForCategorization")
    @DisplayName("Categorize various CSV transactions correctly")
    void testCategorize_withMultipleTransactions(TransactionCSV transactionCSV, CategoryType expectedCategoryType){
        CategoryType categoryType = transactionCSVCategorizerService.categorize(transactionCSV);
        assertEquals(expectedCategoryType, categoryType);
    }


    private static Stream<Arguments> provideTransactionsForCategorization() {
        return Stream.of(
                Arguments.of(
                        createTransaction("FLEX FINANCE", BigDecimal.valueOf(707.0), "Rent payment"),
                        CategoryType.RENT,
                        "Flex Finance with rent amount should categorize as RENT"
                ),
                Arguments.of(createTransaction("FLEX FINANCE", BigDecimal.valueOf(1220), "Rent payment"), CategoryType.RENT, "Flex Finance with rent amount should categorize as RENT"),
                Arguments.of(
                        createTransaction("FLEX FINANCE", BigDecimal.valueOf(14.99), "Subscription fee"),
                        CategoryType.SUBSCRIPTION,
                        "Flex Finance with subscription amount should categorize as SUBSCRIPTION"
                ),
                Arguments.of(
                        createTransaction("OLIVE GARDEN", BigDecimal.valueOf(45.50), "Dinner"),
                        CategoryType.ORDER_OUT,
                        "Olive Garden should categorize as ORDER_OUT"
                ),
                Arguments.of(
                        createTransaction("WINCO FOODS", BigDecimal.valueOf(125.75), "Groceries"),
                        CategoryType.GROCERIES,
                        "WinCo Foods should categorize as GROCERIES"
                ),
                Arguments.of(
                        createTransaction("GREAT CLIPS", BigDecimal.valueOf(18.00), "Haircut"),
                        CategoryType.HAIRCUT,
                        "Great Clips should categorize as HAIRCUT"
                ),
                Arguments.of(
                        createTransaction("STATE FARM", BigDecimal.valueOf(150.00), "Auto insurance"),
                        CategoryType.INSURANCE,
                        "State Farm should categorize as INSURANCE"
                )
        );
    }

    private static TransactionCSV createTransaction(String merchantName, BigDecimal amount, String description) {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName(merchantName);
        transaction.setTransactionAmount(amount);
        transaction.setDescription(description);
        return transaction;
    }

    @Test
    void testCategorize_whenTransactionRulesNotEmpty_thenMatchOnUserRules(){
        CSVTransactionRule

    }

    @AfterEach
    void tearDown() {
    }
}