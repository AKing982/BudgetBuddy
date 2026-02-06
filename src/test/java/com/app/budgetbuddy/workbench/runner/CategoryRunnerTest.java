package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.categories.CategorizerService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;


@ExtendWith(MockitoExtension.class)
class CategoryRunnerTest
{

    private CategoryRunner categoryRunner;

    @Mock
    private CategorizerService<TransactionCSV> csvCategorizerService;

    @Mock
    private CSVTransactionService csvTransactionService;

    @Mock
    private UserLogService userLogService;

    @Mock
    private SubBudgetService subBudgetService;

    @Mock
    private TransactionService transactionService;

    @Mock
    private TransactionCategoryService transactionCategoryService;

    @BeforeEach
    void setUp() {

        categoryRunner = new CategoryRunner(csvCategorizerService, csvTransactionService, userLogService, subBudgetService, transactionService, transactionCategoryService);
    }

    @Test
    void testCategorizeCSVTransactionsByRange_whenNoCSVTransactionsFound_thenReturnEmptyList() {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 11, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 1);

        int pageNum = 30;
        Mockito.when(csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, pageNum))
                .thenReturn(List.of());

        categoryRunner.categorizeCSVTransactionsByRange(userId, startDate, endDate);
    }

    @Test
    void testCategorizeCSVTransactionsByRange_whenCSVTransactionsFound_thenReturnCategorizedTransactions()
    {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 11, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 1);

        TransactionCSV transaction1 = createCSVTransaction(BigDecimal.valueOf(29.770), "PIN PURCHASE", "WINCO FOODS #15 WINCO11969 S CARLSBAD");
        TransactionCSV transaction2 = createCSVTransaction(BigDecimal.valueOf(1220.030), "Purchase", "Flexible Finance Inc.");
        TransactionCSV transaction3 = createCSVTransaction( BigDecimal.valueOf(1956.520), "L3 TECHNOLOGIES PAYROLL", "L3 TECHNOLOGIES PAYROLL");
        TransactionCSV transaction4 = createCSVTransaction(BigDecimal.valueOf(14.950), "Purchase", "OLIVE GARDEN 0021815   SOUTH JORDAN UTUS");

        List<TransactionCSV> expected = createExpectedCSVTransactions();
        expected.add(transaction1);
        expected.add(transaction2);
        expected.add(transaction3);
        expected.add(transaction4);

        int pageNum = 30;
        Mockito.when(csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, pageNum))
                .thenReturn(expected);

        Category groceriesCategory = Category.builder()
                        .categoryId(1L)
                        .categorizedBy("SYSTEM")
                        .categoryName("Groceries")
                        .categorizedDate(LocalDate.of(2025, 10, 1))
                        .build();
        Category rentCategory = Category.builder()
                        .categorizedBy("SYSTEM")
                        .categorizedDate(LocalDate.of(2025, 10, 1))
                        .categoryId(2L)
                        .categoryName("Rent")
                        .build();
        Category incomeCategory = Category.builder()
                        .categorizedBy("SYSTEM")
                        .categoryName("Income")
                        .categorizedDate(LocalDate.of(2025, 10, 1))
                        .categoryId(3L)
                        .build();
        Category orderOut = Category.builder()
                        .categorizedBy("SYSTEM")
                        .categoryId(4L)
                        .categoryName("Order Out")
                        .categorizedDate(LocalDate.of(2025, 10, 1))
                        .build();
        Mockito.when(csvCategorizerService.categorize(any(TransactionCSV.class))).thenReturn(groceriesCategory);
        Mockito.when(csvCategorizerService.categorize(any(TransactionCSV.class))).thenReturn(rentCategory);
        Mockito.when(csvCategorizerService.categorize(any(TransactionCSV.class))).thenReturn(incomeCategory);
        Mockito.when(csvCategorizerService.categorize(any(TransactionCSV.class))).thenReturn(orderOut);



        categoryRunner.categorizeCSVTransactionsByRange(userId, startDate, endDate);
    }

    @Test
    void testCategorizeSingleCSVTransaction_whenCategorySaveDataIsNull_thenReturnEmptyOptional(){
        categoryRunner.categorizeSingleCSVTransaction(null);
    }

    @Test
    void testCategorizeSingleCSVTransaction_whenUncategorizedCSVTransactionNewCategory_thenReturnCategorized(){
        CategorySaveData categorySaveData = new CategorySaveData("csv-540-704", "Other", null, false, false);
        TransactionCSV amazon = createCSVTransaction("AMAZON", BigDecimal.valueOf(67.640), "Purchase", "Uncategorized", "AMAZON MKTPL*");

    }

    private List<TransactionCSV> createExpectedCSVTransactions()
    {
        List<TransactionCSV> transactionCSVS = new ArrayList<>();
        TransactionCSV wincoTransaction = createCSVTransaction("WINCO FOODS", BigDecimal.valueOf(29.770), "PIN PURCHASE", "Groceries", "WINCO FOODS #15 WINCO11969 S CARLSBAD");
        TransactionCSV rentTransaction = createCSVTransaction("Flexible Finance", BigDecimal.valueOf(1220.030), "Purchase", "Rent", "Flexible Finance Inc.");
        TransactionCSV l3Income = createCSVTransaction("L3 TECHNOLOGIES", BigDecimal.valueOf(1956.520), "L3 TECHNOLOGIES PAYROLL", "Income", "L3 TECHNOLOGIES PAYROLL");
        TransactionCSV oliveGarden = createCSVTransaction("OLIVE GARDEN", BigDecimal.valueOf(14.950), "Purchase", "Order Out", "OLIVE GARDEN 0021815   SOUTH JORDAN UTUS");
        transactionCSVS.add(wincoTransaction);
        transactionCSVS.add(rentTransaction);
        transactionCSVS.add(l3Income);
        transactionCSVS.add(oliveGarden);
        return transactionCSVS;
    }

    private static TransactionCSV createCSVTransaction(String merchantName, BigDecimal amount, String description, String category, String extendedDescription) {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setMerchantName(merchantName);
        transaction.setTransactionAmount(amount);
        transaction.setTransactionDate(LocalDate.of(2025, 11, 1));
        transaction.setCategory(category);
        transaction.setExtendedDescription(extendedDescription);
        transaction.setDescription(description);
        return transaction;
    }

    private static TransactionCSV createCSVTransaction(BigDecimal amount, String description, String extendedDescription) {
        TransactionCSV transaction = new TransactionCSV();
        transaction.setTransactionAmount(amount);
        transaction.setTransactionDate(LocalDate.of(2025, 11, 1));
        transaction.setExtendedDescription(extendedDescription);
        transaction.setDescription(description);
        return transaction;
    }


    @AfterEach
    void tearDown() {
    }
}