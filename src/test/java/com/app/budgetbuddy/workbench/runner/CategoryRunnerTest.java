package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.CategorySaveData;
import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.services.CSVTransactionService;
import com.app.budgetbuddy.workbench.categories.CategorizerService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mockito;
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


@SpringBootTest
class CategoryRunnerTest
{
    @Autowired
    private CategoryRunner categoryRunner;

    @MockBean
    @Qualifier("csvCategorizer")
    private CategorizerService<TransactionCSV> csvCategorizerService;

    @MockBean
    private CSVTransactionService csvTransactionService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCategorizeCSVTransactionsByRange_whenNoCSVTransactionsFound_thenReturnEmptyList() {
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2025, 11, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 1);

        Mockito.when(csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate))
                .thenReturn(List.of());

        List<TransactionCSV> actual = categoryRunner.categorizeCSVTransactionsByRange(userId, startDate, endDate);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
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

        Mockito.when(csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate))
                .thenReturn(expected);

        Mockito.when(csvCategorizerService.categorize(any(TransactionCSV.class))).thenReturn(CategoryType.GROCERIES);
        Mockito.when(csvCategorizerService.categorize(any(TransactionCSV.class))).thenReturn(CategoryType.RENT);
        Mockito.when(csvCategorizerService.categorize(any(TransactionCSV.class))).thenReturn(CategoryType.INCOME);
        Mockito.when(csvCategorizerService.categorize(any(TransactionCSV.class))).thenReturn(CategoryType.ORDER_OUT);

        TransactionCSV updatedTransaction1 = createCSVTransaction("WINCO FOODS", BigDecimal.valueOf(29.770), "PIN PURCHASE", "Groceries", "WINCO FOODS #15 WINCO11969 S CARLSBAD");
        TransactionCSV updatedTransaction2 = createCSVTransaction("Flexible Finance", BigDecimal.valueOf(1220.030), "Purchase", "Rent", "Flexible Finance Inc.");
        TransactionCSV updatedTransaction3 = createCSVTransaction("L3 TECHNOLOGIES", BigDecimal.valueOf(1956.520), "L3 TECHNOLOGIES PAYROLL", "Income", "L3 TECHNOLOGIES PAYROLL");
        TransactionCSV updatedTransaction4 = createCSVTransaction("OLIVE GARDEN", BigDecimal.valueOf(14.950), "Purchase", "Order Out","OLIVE GARDEN 0021815  SOUTH JORDAN UTUS");

        Mockito.when(csvTransactionService.updateTransactionCSVCategoryAndMerchantName(1L, "Groceries", "WINCO FOODS"))
                        .thenReturn(Optional.of(updatedTransaction1));
        Mockito.when(csvTransactionService.updateTransactionCSVCategoryAndMerchantName(2L, "Rent", "Flexible Finance"))
                        .thenReturn(Optional.of(updatedTransaction2));
        Mockito.when(csvTransactionService.updateTransactionCSVCategoryAndMerchantName(3L, "Income", "L3 TECHNOLOGIES"))
                        .thenReturn(Optional.of(updatedTransaction3));
        Mockito.when(csvTransactionService.updateTransactionCSVCategoryAndMerchantName(4L, "Order Out", "OLIVE GARDEN"))
                .thenReturn(Optional.of(updatedTransaction4));

        List<TransactionCSV> actual = categoryRunner.categorizeCSVTransactionsByRange(userId, startDate, endDate);
        assertNotNull(actual);
        Assertions.assertEquals(expected, actual);
    }

    @Test
    void testCategorizeSingleCSVTransaction_whenCategorySaveDataIsNull_thenReturnEmptyOptional(){
        Optional<TransactionCSV> actual = categoryRunner.categorizeSingleCSVTransaction(null);
        assertTrue(actual.isEmpty());
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