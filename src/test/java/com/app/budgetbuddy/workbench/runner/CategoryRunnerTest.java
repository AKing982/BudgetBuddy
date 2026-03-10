package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.categories.CategorizationEngine;
import com.app.budgetbuddy.workbench.categories.TransactionCategoryBuilder;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;


@ExtendWith(MockitoExtension.class)
class CategoryRunnerTest
{

    private CategoryRunner categoryRunner;

    @Mock
    private TransactionCategoryBuilder transactionCategoryBuilder;

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

        categoryRunner = new CategoryRunner(csvTransactionService, userLogService, subBudgetService, transactionService, transactionCategoryBuilder, transactionCategoryService);
    }

    @Test
    void testCategorizeCSVTransactionsByRange_whenNoCSVTransactionsFound_thenReturnEmptyList() {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 11, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 1);

        SubBudget subBudget = SubBudget.builder()
                .id(1L)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Mockito.when(subBudgetService.getSubBudgetsByUserIdAndDateRange(userId, startDate, endDate))
                .thenReturn(List.of(subBudget));

        Mockito.when(csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, 500))
                .thenReturn(Collections.emptyList());

        categoryRunner.categorizeCSVTransactionsByRange(userId, startDate, endDate);

        Mockito.verify(csvTransactionService).findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, 500);
        Mockito.verify(transactionCategoryBuilder, Mockito.never()).build(any(), any());
        Mockito.verify(transactionCategoryService, Mockito.never()).saveAll(any());
    }

    @Test
    void testCategorizeCSVTransactionsByRange_whenCSVTransactionsFound_thenReturnCategorizedTransactions() {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 11, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 1);

        TransactionCSV transaction1 = createCSVTransaction(BigDecimal.valueOf(29.770), "PIN PURCHASE", "WINCO FOODS #15 WINCO11969 S CARLSBAD");
        TransactionCSV transaction2 = createCSVTransaction(BigDecimal.valueOf(1220.030), "Purchase", "Flexible Finance Inc.");
        TransactionCSV transaction3 = createCSVTransaction(BigDecimal.valueOf(1956.520), "L3 TECHNOLOGIES PAYROLL", "L3 TECHNOLOGIES PAYROLL");
        TransactionCSV transaction4 = createCSVTransaction(BigDecimal.valueOf(14.950), "Purchase", "OLIVE GARDEN 0021815   SOUTH JORDAN UTUS");

        List<TransactionCSV> csvTransactions = List.of(transaction1, transaction2, transaction3, transaction4);

        SubBudget subBudget = SubBudget.builder()
                .id(1L)
                .startDate(startDate)
                .endDate(endDate)
                .build();

        Mockito.when(subBudgetService.getSubBudgetsByUserIdAndDateRange(userId, startDate, endDate))
                .thenReturn(List.of(subBudget));

        Mockito.when(csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, 500))
                .thenReturn(csvTransactions);

        TransactionCategory tc1 = TransactionCategory.builder().build();
        TransactionCategory tc2 = TransactionCategory.builder().build();
        TransactionCategory tc3 = TransactionCategory.builder().build();
        TransactionCategory tc4 = TransactionCategory.builder().build();
        List<TransactionCategory> categorizedTransactions = List.of(tc1, tc2, tc3, tc4);

        Mockito.when(transactionCategoryBuilder.build(csvTransactions, List.of(subBudget)))
                .thenReturn(categorizedTransactions);

        categoryRunner.categorizeCSVTransactionsByRange(userId, startDate, endDate);

        Mockito.verify(subBudgetService).getSubBudgetsByUserIdAndDateRange(userId, startDate, endDate);
        Mockito.verify(csvTransactionService).findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, 500);
        Mockito.verify(transactionCategoryBuilder).build(csvTransactions, List.of(subBudget));
        Mockito.verify(transactionCategoryService).saveAll(categorizedTransactions);
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