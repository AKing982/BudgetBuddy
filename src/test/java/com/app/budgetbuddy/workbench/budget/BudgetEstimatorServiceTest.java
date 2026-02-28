package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.PercentageCalculator;
import com.app.budgetbuddy.workbench.subBudget.HistoricalDataEngine;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cglib.core.Local;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

import static org.assertj.core.api.AssertionsForClassTypes.assertThat;
import static org.assertj.core.api.AssertionsForClassTypes.within;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BudgetEstimatorServiceTest
{
    @Mock
    private BudgetCategoryQueries budgetCategoryQueries;

    @Mock
    private HistoricalDataEngine historicalDataEngine;

    @Mock
    private CategoryService categoryService;

    private BudgetEstimatorService budgetEstimatorService;

    private SubBudget testSubBudget;

    private Budget budget;

    @BeforeEach
    void setUp() {
        testSubBudget = new SubBudget();
        testSubBudget.setYear(2025);
        testSubBudget.setStartDate(LocalDate.of(2025, 4, 1));
        testSubBudget.setEndDate(LocalDate.of(2025, 4, 30));
        testSubBudget.setSubSavingsTarget(BigDecimal.valueOf(208));
        testSubBudget.setSubSavingsAmount(BigDecimal.valueOf(120));
        testSubBudget.setAllocatedAmount(BigDecimal.valueOf(3260));
        testSubBudget.setActive(true);
        testSubBudget.setId(4L);
        testSubBudget.setSpentOnBudget(BigDecimal.valueOf(1603));

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setStatus("Active");
        budgetSchedule.setPeriodType(Period.MONTHLY);
        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 30)));
        budgetSchedule.setSubBudgetId(testSubBudget.getId());
        budgetSchedule.setBudgetScheduleId(4L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
        budgetSchedule.setTotalPeriods(4);
        testSubBudget.setBudgetSchedule(List.of(budgetSchedule));

        budget = new Budget();
        budget.setId(1L);
        budget.setIncome(BigDecimal.valueOf(51000));
        budget.setBudgetName("2025 Year Budget");
        budget.setStartDate(LocalDate.of(2025, 1, 1));
        budget.setEndDate(LocalDate.of(2025, 12, 31));
        budget.setBudgetAmount(BigDecimal.valueOf(51000));
        budget.setUserId(1L);

        testSubBudget.setBudget(budget);

        budgetEstimatorService = new BudgetEstimatorService(budgetCategoryQueries, historicalDataEngine, categoryService);
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenSubBudgetIsNull_thenReturnEmptyArray(){
        List<CategoryBudgetAmount> actual = budgetEstimatorService.calculateBudgetCategoryAmount(null);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenHistoricalDataNull_thenReturnEmptyArray(){
        Mockito.when(historicalDataEngine.getHistoricalMonthHistoryByCategory(6, 1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(null);
        List<CategoryBudgetAmount> actual = budgetEstimatorService.calculateBudgetCategoryAmount(testSubBudget);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenValidSubBudget_thenReturnCategoryBudgetAmountArray(){
        Mockito.when(historicalDataEngine.getHistoricalMonthHistoryByCategory(6, 1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(Map.of(
                        "Groceries", List.of(
                                new MonthHistory(YearMonth.of(2025, 3), 150.00, 200.00, 57.14, 350.00, 75.00, 100.00),
                                new MonthHistory(YearMonth.of(2025, 2), 300.00, 100.00, 25.00, 400.00, 150.00, 50.00)
                        ),
                        "Payment", List.of(
                                new MonthHistory(YearMonth.of(2025, 3), -50.00, 250.00, 125.00, 200.00, -25.00, 125.00),
                                new MonthHistory(YearMonth.of(2025, 2), 80.00, 120.00, 60.00, 200.00, 40.00, 60.00)
                        )
                ));

        List<CategoryBudgetAmount> expected = List.of(
                new CategoryBudgetAmount("Groceries", new BigDecimal("412.50")),
                new CategoryBudgetAmount("Payment", new BigDecimal("220.00"))
        );

        List<CategoryBudgetAmount> actual = budgetEstimatorService.calculateBudgetCategoryAmount(testSubBudget);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        Map<String, BigDecimal> actualMap = actual.stream()
                .collect(Collectors.toMap(CategoryBudgetAmount::category, CategoryBudgetAmount::budgetAmount));

        assertEquals(new BigDecimal("412.50"), actualMap.get("Groceries"));
        assertEquals(new BigDecimal("220.00"), actualMap.get("Payment"));
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenNoHistoricalData_thenReturnEmptyArray(){
        Mockito.when(historicalDataEngine.getHistoricalTransactionCategories(1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(new HistoricalTransactionsByCategories(Collections.emptyList(), 0));

        List<CategoryBudgetAmount> actual = budgetEstimatorService.calculateBudgetCategoryAmount(testSubBudget);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenTotalBudgetedIsNegative_thenSkipCategory(){
        Mockito.when(historicalDataEngine.getHistoricalMonthHistoryByCategory(6, 1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(Map.of(
                        "Groceries", List.of(
                                new MonthHistory(YearMonth.of(2025, 3), 150.00, 200.00, 57.14, -350.00, 75.00, 100.00),
                                new MonthHistory(YearMonth.of(2025, 2), 300.00, 100.00, 25.00, 400.00, 150.00, 50.00)
                        ),
                        "Payment", List.of(
                                new MonthHistory(YearMonth.of(2025, 3), -50.00, 250.00, 125.00, 200.00, -25.00, 125.00),
                                new MonthHistory(YearMonth.of(2025, 2), 80.00, 120.00, 60.00, 200.00, 40.00, 60.00)
                        )
                ));

        List<CategoryBudgetAmount> expected = List.of(
                new CategoryBudgetAmount("Groceries", new BigDecimal("440.00")),
                new CategoryBudgetAmount("Payment", new BigDecimal("220.00")));
        List<CategoryBudgetAmount> actual = budgetEstimatorService.calculateBudgetCategoryAmount(testSubBudget);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        Map<String, BigDecimal> actualMap = actual.stream()
                .collect(Collectors.toMap(CategoryBudgetAmount::category, CategoryBudgetAmount::budgetAmount));

        assertEquals(new BigDecimal("220.00"), actualMap.get("Payment"));
        assertEquals(new BigDecimal("400.0"), actualMap.get("Groceries"));
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenHistoricalKeyEmpty_thenReturnSkipCategory(){
        Mockito.when(historicalDataEngine.getHistoricalMonthHistoryByCategory(6, 1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(Map.of(
                        "", List.of(
                                new MonthHistory(YearMonth.of(2025, 3), 150.00, 200.00, 57.14, 350.00, 75.00, 100.00),
                                new MonthHistory(YearMonth.of(2025, 2), 300.00, 100.00, 25.00, 400.00, 150.00, 50.00)
                        ),
                        "Payment", List.of(
                                new MonthHistory(YearMonth.of(2025, 3), -50.00, 250.00, 125.00, 200.00, -25.00, 125.00),
                                new MonthHistory(YearMonth.of(2025, 2), 80.00, 120.00, 60.00, 200.00, 40.00, 60.00)
                        )
                ));
        List<CategoryBudgetAmount> expected = List.of(
                new CategoryBudgetAmount("Payment", new BigDecimal("220.00")));
        List<CategoryBudgetAmount> actual = budgetEstimatorService.calculateBudgetCategoryAmount(testSubBudget);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());

        Map<String, BigDecimal> actualMap = actual.stream()
                .collect(Collectors.toMap(CategoryBudgetAmount::category, CategoryBudgetAmount::budgetAmount));

        assertEquals(new BigDecimal("220.00"), actualMap.get("Payment"));
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenNoHistoricalData_returnFallback(){
        TransactionsByCategory groceries = new TransactionsByCategory();
        groceries.setCategoryName("Groceries");
        groceries.setTotalCategorySpending(BigDecimal.valueOf(2700));

        TransactionsByCategory rent = new TransactionsByCategory();
        rent.setCategoryName("Rent");
        rent.setTotalCategorySpending(BigDecimal.valueOf(11502));

        Mockito.when(historicalDataEngine.getHistoricalMonthHistoryByCategory(6, 1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(Map.of());

        Mockito.when(historicalDataEngine.getHistoricalTransactionCategories(1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(new HistoricalTransactionsByCategories(List.of(groceries, rent), 6));

        List<CategoryBudgetAmount> actual = budgetEstimatorService.calculateBudgetCategoryAmount(testSubBudget);
        assertNotNull(actual);
        assertEquals(2, actual.size());

        Map<String, BigDecimal> actualMap = actual.stream()
                .collect(Collectors.toMap(CategoryBudgetAmount::category, CategoryBudgetAmount::budgetAmount));

        assertEquals(new BigDecimal("450.0"), actualMap.get("Groceries")); // 0.0972 * 3260
        assertEquals(new BigDecimal("1917.0"), actualMap.get("Rent"));
    }

    @Test
    void testGetBudgetCategoryAmountByCategory_whenCategoryIsEmpty_thenReturnZero(){
        String category = "";
        List<CategoryBudgetAmount> categoryBudgetAmounts = List.of(new CategoryBudgetAmount(category, BigDecimal.ZERO));
        BigDecimal actual = budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
        assertEquals(BigDecimal.ZERO, actual);
    }

    @Test
    void testGetBudgetCategoryAmountByCategory_whenCategoryBudgetAmountsIsEmpty_thenReturnZero(){
        String category = "Rent";
        List<CategoryBudgetAmount> categoryBudgetAmounts = new ArrayList<>();
        BigDecimal actual = budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
        assertEquals(BigDecimal.ZERO, actual);
    }

    @Test
    void testGetBudgetCategoryAmountByCategory_whenValidData_thenReturnBudgetAmount(){
        String category = "Rent";
        List<CategoryBudgetAmount> categoryBudgetAmounts = List.of(new CategoryBudgetAmount(category, BigDecimal.valueOf(1920)));
        BigDecimal actual = budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
        assertEquals(BigDecimal.valueOf(1920), actual);
    }

    @Test
    void testCalculateCategoryBudget_whenCategoryIsEmpty_thenReturnEmptyMap(){
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        BigDecimal budgetedAmount = BigDecimal.valueOf(3260);
        int numOfMonths = 6;
        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgetedAmount, numOfMonths);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCalculateCategoryBudget_whenTransactionsByCategoriesIsNull_thenReturnEmptyMap(){
        List<TransactionsByCategory> transactionsByCategories = null;
        BigDecimal budgetedAmount = BigDecimal.valueOf(3260);
        int numOfMonths = 6;
        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgetedAmount, numOfMonths);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCalculateCategoryBudget_whenBudgetAmountIsNull_thenThrowException(){
        BigDecimal budgetAmount = null;
        int numOfMonths = 6;
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        transactionsByCategories.add(mock(TransactionsByCategory.class));
        assertThrows(DataException.class, () -> {
            budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgetAmount, numOfMonths);
        });
    }



    @Test
    void testCalculateCategoryBudget_whenNeedsCategoriesForSixMonths_thenReturnBudgetMap(){
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(11502));

        TransactionsByCategory groceryCategory = new TransactionsByCategory();
        groceryCategory.setCategoryName("Groceries");
        groceryCategory.setTotalCategorySpending(BigDecimal.valueOf(2400));

        TransactionsByCategory utilitiesCategory = new TransactionsByCategory();
        utilitiesCategory.setCategoryName("Utilities");
        utilitiesCategory.setTotalCategorySpending(BigDecimal.valueOf(762));

        TransactionsByCategory insurance = new TransactionsByCategory();
        insurance.setCategoryName("Insurance");
        insurance.setTotalCategorySpending(BigDecimal.valueOf(450));

        transactionsByCategories.add(rentCategory);
        transactionsByCategories.add(groceryCategory);
        transactionsByCategories.add(utilitiesCategory);
        transactionsByCategories.add(insurance);

        int numOfMonths = 6;
        BigDecimal budgetAmount = BigDecimal.valueOf(3095.08);
        Map<String, Double> expected = new HashMap<>();
        expected.put("Rent", 1917.0);
        expected.put("Groceries", 400.0);
        expected.put("Utilities", 127.0);
        expected.put("Insurance", 75.0);

        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgetAmount, numOfMonths);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Rent"), actual.get("Rent"));
        assertEquals(expected.get("Groceries"), actual.get("Groceries"));
        assertEquals(expected.get("Utilities"), actual.get("Utilities"));
        assertEquals(expected.get("Insurance"), actual.get("Insurance"));
        assertEquals(expected.keySet(), actual.keySet());
    }

    @Test
    void testCalculateCategoryBudget_whenOnlyWantsCategories_thenReturnBudgetMap(){
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory paymentCategory = new TransactionsByCategory();
        paymentCategory.setCategoryName("Payment");
        paymentCategory.setTotalCategorySpending(BigDecimal.valueOf(1500));

        TransactionsByCategory subscriptionCategory = new TransactionsByCategory();
        subscriptionCategory.setCategoryName("Subscription");
        subscriptionCategory.setTotalCategorySpending(BigDecimal.valueOf(450));

        TransactionsByCategory orderOutCategory = new TransactionsByCategory();
        orderOutCategory.setCategoryName("Order Out");
        orderOutCategory.setTotalCategorySpending(BigDecimal.valueOf(510));

        TransactionsByCategory gasCategory = new TransactionsByCategory();
        gasCategory.setCategoryName("Gas");
        gasCategory.setTotalCategorySpending(BigDecimal.valueOf(240));

        transactionsByCategories.add(paymentCategory);
        transactionsByCategories.add(subscriptionCategory);
        transactionsByCategories.add(orderOutCategory);
        transactionsByCategories.add(gasCategory);
        int numOfMonths = 6;
        BigDecimal budgetAmount = BigDecimal.valueOf(3095.08);
        Map<String, Double> expected = new HashMap<>();
        expected.put("Payment", 250.0);
        expected.put("Subscription", 75.0);
        expected.put("Order Out", 85.0);
        expected.put("Gas", 40.0);

        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgetAmount, numOfMonths);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Payment"), actual.get("Payment"));
        assertEquals(expected.get("Subscription"), actual.get("Subscription"));
        assertEquals(expected.get("Order Out"), actual.get("Order Out"));
        assertEquals(expected.get("Gas"), actual.get("Gas"));
        assertEquals(expected.keySet(), actual.keySet());
    }

    @Test
    void testCalculateCategoryBudgetPercentage_whenMixOfWantAndNeedCategories_thenReturnMap(){
        BigDecimal budgetAmount = BigDecimal.valueOf(3095.08);
        int numOfMonths = 6;
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();

        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(11502));

        TransactionsByCategory groceryCategory = new TransactionsByCategory();
        groceryCategory.setCategoryName("Groceries");
        groceryCategory.setTotalCategorySpending(BigDecimal.valueOf(2700));

        TransactionsByCategory paymentCategory = new TransactionsByCategory();
        paymentCategory.setCategoryName("Payment");
        paymentCategory.setTotalCategorySpending(BigDecimal.valueOf(1440));

        transactionsByCategories.add(rentCategory);
        transactionsByCategories.add(groceryCategory);
        transactionsByCategories.add(paymentCategory);

        Map<String, Double> expected = new HashMap<>();
        expected.put("Rent", 1917.0);
        expected.put("Groceries", 450.0);
        expected.put("Payment", 145.62);

        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgetAmount, numOfMonths);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Rent"), actual.get("Rent"));
        assertEquals(expected.get("Groceries"), actual.get("Groceries"));
        assertEquals(expected.get("Payment"), actual.get("Payment"));
        assertEquals(expected.keySet(), actual.keySet());
    }

    @Test
    void testCalculateCategoryBudget_whenExcludedCategories_thenSkipExcludedCategories(){
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory depositCategory = new TransactionsByCategory();
        depositCategory.setCategoryName("Deposit");
        depositCategory.setTotalCategorySpending(BigDecimal.valueOf(-11796));

        TransactionsByCategory withdrawalCategory = new TransactionsByCategory();
        withdrawalCategory.setCategoryName("Withdrawal");
        withdrawalCategory.setTotalCategorySpending(BigDecimal.valueOf(-11796));

        transactionsByCategories.add(depositCategory);
        transactionsByCategories.add(withdrawalCategory);

        int numOfMonths = 6;
        BigDecimal budgetAmount = BigDecimal.valueOf(3095.08);
        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgetAmount, numOfMonths);
        assertNotNull(actual);
        assertEquals(0, actual.size());
    }

    @Test
    void testCalculateCategoryBudget_whenLowBudgetAmountAndMixCategories_thenReturnMap(){
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(11502));

        TransactionsByCategory groceryCategory = new TransactionsByCategory();
        groceryCategory.setCategoryName("Groceries");
        groceryCategory.setTotalCategorySpending(BigDecimal.valueOf(2700));

        TransactionsByCategory paymentCategory = new TransactionsByCategory();
        paymentCategory.setCategoryName("Payment");
        paymentCategory.setTotalCategorySpending(BigDecimal.valueOf(1440));

        TransactionsByCategory utilitiesCategory = new TransactionsByCategory();
        utilitiesCategory.setCategoryName("Utilities");
        utilitiesCategory.setTotalCategorySpending(BigDecimal.valueOf(762));

        TransactionsByCategory depositCategory = new TransactionsByCategory();
        depositCategory.setCategoryName("Deposit");
        depositCategory.setTotalCategorySpending(BigDecimal.valueOf(-11796));

        transactionsByCategories.add(rentCategory);
        transactionsByCategories.add(groceryCategory);
        transactionsByCategories.add(paymentCategory);
        transactionsByCategories.add(utilitiesCategory);
        transactionsByCategories.add(depositCategory);

        int numOfMonths = 6;
        BigDecimal budgetAmount = BigDecimal.valueOf(2345.60);
        Map<String, Double> expected = new HashMap<>();
        expected.put("Rent", 1917.0);
        expected.put("Groceries", 301.6);
        expected.put("Payment", 0.0);
        expected.put("Utilities", 127.0);

        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgetAmount, numOfMonths);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Rent"), actual.get("Rent"));
        assertEquals(expected.get("Groceries"), actual.get("Groceries"));
        assertEquals(expected.get("Payment"), actual.get("Payment"));
        assertEquals(expected.get("Utilities"), actual.get("Utilities"));
    }

    @Test
    void testCalculateCategoryBudget_whenLowBudgetAndManyMixCategories_thenReturnMap(){
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(7668));

        TransactionsByCategory groceryCategory = new TransactionsByCategory();
        groceryCategory.setCategoryName("Groceries");
        groceryCategory.setTotalCategorySpending(BigDecimal.valueOf(1800));

        TransactionsByCategory paymentCategory = new TransactionsByCategory();
        paymentCategory.setCategoryName("Payment");
        paymentCategory.setTotalCategorySpending(BigDecimal.valueOf(1000));

        TransactionsByCategory gasCategory = new TransactionsByCategory();
        gasCategory.setCategoryName("Gas");
        gasCategory.setTotalCategorySpending(BigDecimal.valueOf(320));

        TransactionsByCategory utilitiesCategory = new TransactionsByCategory();
        utilitiesCategory.setCategoryName("Utilities");
        utilitiesCategory.setTotalCategorySpending(BigDecimal.valueOf(508));

        TransactionsByCategory incomeCategory = new TransactionsByCategory();
        incomeCategory.setCategoryName("Income");
        incomeCategory.setTotalCategorySpending(BigDecimal.valueOf(15368));

        TransactionsByCategory subscriptionCategory = new TransactionsByCategory();
        subscriptionCategory.setCategoryName("Subscription");
        subscriptionCategory.setTotalCategorySpending(BigDecimal.valueOf(300));

        TransactionsByCategory orderOutCategory = new TransactionsByCategory();
        orderOutCategory.setCategoryName("Order Out");
        orderOutCategory.setTotalCategorySpending(BigDecimal.valueOf(260));

        TransactionsByCategory hairCutCategory = new TransactionsByCategory();
        hairCutCategory.setCategoryName("Haircut");
        hairCutCategory.setTotalCategorySpending(BigDecimal.valueOf(104));

        TransactionsByCategory gasBillCategory = new TransactionsByCategory();
        gasBillCategory.setCategoryName("Gas Bill");
        gasBillCategory.setTotalCategorySpending(BigDecimal.valueOf(166));

        TransactionsByCategory electricityCategory = new TransactionsByCategory();
        electricityCategory.setCategoryName("Electric");
        electricityCategory.setTotalCategorySpending(BigDecimal.valueOf(231));

        transactionsByCategories.add(rentCategory);
        transactionsByCategories.add(groceryCategory);
        transactionsByCategories.add(paymentCategory);
        transactionsByCategories.add(gasCategory);
        transactionsByCategories.add(utilitiesCategory);
        transactionsByCategories.add(incomeCategory);
        transactionsByCategories.add(subscriptionCategory);
        transactionsByCategories.add(orderOutCategory);
        transactionsByCategories.add(hairCutCategory);
        transactionsByCategories.add(gasBillCategory);
        transactionsByCategories.add(electricityCategory);

        int numOfMonths = 4;
        BigDecimal budgetAmount = BigDecimal.valueOf(2345.60);
        Map<String, Double> expected = new HashMap<>();
        expected.put("Rent", 1917.0);
        expected.put("Groceries", 96.35);
        expected.put("Payment", 0.0);
        expected.put("Gas", 35.0);
        expected.put("Utilities", 127.0);
        expected.put("Income", 3842.0);
        expected.put("Subscription", 0.0);
        expected.put("Order Out", 0.0);
        expected.put("Haircut", 26.0);
        expected.put("Gas Bill", 41.5);
        expected.put("Electric", 57.75);
        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgetAmount, numOfMonths);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Rent"), actual.get("Rent"));
        assertEquals(expected.get("Groceries"), actual.get("Groceries"));
        assertEquals(expected.get("Payment"), actual.get("Payment"));
        assertEquals(expected.get("Utilities"), actual.get("Utilities"));
        assertEquals(expected.get("Income"), actual.get("Income"));
        assertEquals(expected.get("Subscription"), actual.get("Subscription"));
        assertEquals(expected.get("Order Out"), actual.get("Order Out"));
        assertEquals(expected.get("Haircut"), actual.get("Haircut"));
        assertEquals(expected.get("Gas Bill"), actual.get("Gas Bill"));
        assertEquals(expected.get("Electric"), actual.get("Electric"));
    }

    @Test
    void testCalculateCategoryBudget_whenNumberOfMonthsFourAndMixCategories_thenReturnMap(){
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(7668));

        TransactionsByCategory groceryCategory = new TransactionsByCategory();
        groceryCategory.setCategoryName("Groceries");
        groceryCategory.setTotalCategorySpending(BigDecimal.valueOf(1800));

        TransactionsByCategory paymentCategory = new TransactionsByCategory();
        paymentCategory.setCategoryName("Payment");
        paymentCategory.setTotalCategorySpending(BigDecimal.valueOf(580));

        TransactionsByCategory gasCategory = new TransactionsByCategory();
        gasCategory.setCategoryName("Gas");
        gasCategory.setTotalCategorySpending(BigDecimal.valueOf(320));

        TransactionsByCategory utilitiesCategory = new TransactionsByCategory();
        utilitiesCategory.setCategoryName("Utilities");
        utilitiesCategory.setTotalCategorySpending(BigDecimal.valueOf(508));

        transactionsByCategories.add(rentCategory);
        transactionsByCategories.add(groceryCategory);
        transactionsByCategories.add(paymentCategory);
        transactionsByCategories.add(gasCategory);
        transactionsByCategories.add(utilitiesCategory);

        int numOfMonths = 4;
        BigDecimal budgeted = BigDecimal.valueOf(3095.08);
        Map<String, Double> expected = new HashMap<>();
        expected.put("Rent", 1917.00);
        expected.put("Groceries", 450.00);
        expected.put("Payment", 104.22);
        expected.put("Utilities", 127.00);
        expected.put("Gas", 80.00);

        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgeted, numOfMonths);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Rent"), actual.get("Rent"));
        assertEquals(expected.get("Groceries"), actual.get("Groceries"));
        assertEquals(expected.get("Payment"), actual.get("Payment"));
        assertEquals(expected.get("Utilities"), actual.get("Utilities"));
        assertEquals(expected.get("Gas"), actual.get("Gas"));
    }

    @Test
    void testCalculateCategoryBudget_whenNumberOfMonthsFourAndIncomeCategory_thenReturnMap(){
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Income");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(15368));

        transactionsByCategories.add(rentCategory);

        int numOfMonths = 4;
        BigDecimal budgeted = BigDecimal.valueOf(3095.08);
        Map<String, Double> expected = new HashMap<>();
        expected.put("Income", 3842.0);

        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgeted, numOfMonths);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Income").doubleValue(), actual.get("Income").doubleValue());
    }

    @Test
    void testCalculateCategoryBudget_whenNumMonthsFourAndManyCategories_thenReturnMap(){
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(7668));

        TransactionsByCategory groceryCategory = new TransactionsByCategory();
        groceryCategory.setCategoryName("Groceries");
        groceryCategory.setTotalCategorySpending(BigDecimal.valueOf(1800));

        TransactionsByCategory paymentCategory = new TransactionsByCategory();
        paymentCategory.setCategoryName("Payment");
        paymentCategory.setTotalCategorySpending(BigDecimal.valueOf(1000));

        TransactionsByCategory gasCategory = new TransactionsByCategory();
        gasCategory.setCategoryName("Gas");
        gasCategory.setTotalCategorySpending(BigDecimal.valueOf(320));

        TransactionsByCategory utilitiesCategory = new TransactionsByCategory();
        utilitiesCategory.setCategoryName("Utilities");
        utilitiesCategory.setTotalCategorySpending(BigDecimal.valueOf(508));

        TransactionsByCategory incomeCategory = new TransactionsByCategory();
        incomeCategory.setCategoryName("Income");
        incomeCategory.setTotalCategorySpending(BigDecimal.valueOf(15368));

        TransactionsByCategory subscriptionCategory = new TransactionsByCategory();
        subscriptionCategory.setCategoryName("Subscription");
        subscriptionCategory.setTotalCategorySpending(BigDecimal.valueOf(300));

        TransactionsByCategory orderOutCategory = new TransactionsByCategory();
        orderOutCategory.setCategoryName("Order Out");
        orderOutCategory.setTotalCategorySpending(BigDecimal.valueOf(260));

        TransactionsByCategory hairCutCategory = new TransactionsByCategory();
        hairCutCategory.setCategoryName("Haircut");
        hairCutCategory.setTotalCategorySpending(BigDecimal.valueOf(104));

        TransactionsByCategory gasBillCategory = new TransactionsByCategory();
        gasBillCategory.setCategoryName("Gas Bill");
        gasBillCategory.setTotalCategorySpending(BigDecimal.valueOf(166));

        TransactionsByCategory electricityCategory = new TransactionsByCategory();
        electricityCategory.setCategoryName("Electric");
        electricityCategory.setTotalCategorySpending(BigDecimal.valueOf(231));

        transactionsByCategories.add(rentCategory);
        transactionsByCategories.add(groceryCategory);
        transactionsByCategories.add(paymentCategory);
        transactionsByCategories.add(gasCategory);
        transactionsByCategories.add(utilitiesCategory);
        transactionsByCategories.add(incomeCategory);
        transactionsByCategories.add(subscriptionCategory);
        transactionsByCategories.add(orderOutCategory);
        transactionsByCategories.add(hairCutCategory);
        transactionsByCategories.add(gasBillCategory);
        transactionsByCategories.add(electricityCategory);

        int numOfMonths = 4;
        BigDecimal budgeted = BigDecimal.valueOf(3095.08);
        Map<String, Double> expected = new HashMap<>();
        expected.put("Rent", 1917.00);
        expected.put("Groceries", 450.00);
        expected.put("Payment", 50.7);
        expected.put("Utilities", 127.00);
        expected.put("Gas", 80.0);
        expected.put("Income", 3842.0);
        expected.put("Subscription", 15.21);
        expected.put("Order Out", 13.18);
        expected.put("Haircut", 5.27);
        expected.put("Gas Bill", 41.50);
        expected.put("Electric", 57.75);

        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudget(transactionsByCategories, budgeted, numOfMonths);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertEquals(expected.get("Rent"), actual.get("Rent"));
        assertEquals(expected.get("Groceries"), actual.get("Groceries"));
        assertEquals(expected.get("Payment"), actual.get("Payment"));
        assertEquals(expected.get("Utilities"), actual.get("Utilities"));
        assertEquals(expected.get("Gas"), actual.get("Gas"));
        assertEquals(expected.get("Income"), actual.get("Income"));
        assertEquals(expected.get("Subscription"), actual.get("Subscription"));
        assertEquals(expected.get("Order Out"), actual.get("Order Out"));
        assertEquals(expected.get("Haircut"), actual.get("Haircut"));
        assertEquals(expected.get("Gas Bill"), actual.get("Gas Bill"));
        assertEquals(expected.get("Electric"), actual.get("Electric"));
    }

    @Test
    @DisplayName("Income budgeted amount should reflect single month average, not accumulated total")
    void calculateBudgetCategoryAmount_incomeShouldNotAccumulate()
    {
        // History months must be BEFORE the subBudget startDate of 2025-04-01
        List<MonthHistory> incomeHistory = List.of(
                new MonthHistory(YearMonth.of(2025, 3), 0.0, 0.0, 0.0, 4200.0, 0.0, 0.0),
                new MonthHistory(YearMonth.of(2025, 2), 0.0, 0.0, 0.0, 4150.0, 0.0, 0.0),
                new MonthHistory(YearMonth.of(2025, 1), 0.0, 0.0, 0.0, 4250.0, 0.0, 0.0)
        );

        Map<String, List<MonthHistory>> historyMap = new HashMap<>();
        historyMap.put("Income", incomeHistory);

        // Match exactly what calculateBudgetCategoryAmount passes: (6, userId=1L, startDate=2025-04-01)
        when(historicalDataEngine.getHistoricalMonthHistoryByCategory(
                6, 1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(historyMap);

        // Act
        List<CategoryBudgetAmount> result = budgetEstimatorService
                .calculateBudgetCategoryAmount(testSubBudget);

        // Assert
        CategoryBudgetAmount incomeBudget = result.stream()
                .filter(c -> c.category().equalsIgnoreCase("Income"))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Income category not found in result"));

        // (4200 + 4150 + 4250) / 3 = 4200, * 1.10 = 4620.00
        BigDecimal expectedAverage = new BigDecimal("4200.00");
        BigDecimal expectedWithMarkup = expectedAverage
                .multiply(new BigDecimal("1.10"))
                .setScale(2, RoundingMode.HALF_UP);

        assertThat(incomeBudget.budgetAmount())
                .isCloseTo(expectedWithMarkup, within(new BigDecimal("1.00")))
                .isLessThan(new BigDecimal("5000.00"))
                .isNotEqualTo(new BigDecimal("14193.41"));
    }


    private CategoryEntity buildCategory(String name) {
        CategoryEntity entity = new CategoryEntity();
        entity.setCategory(name);
        entity.setActive(true);
        return entity;
    }

    private List<CategoryEntity> buildCategories() {
        return List.of(
                buildCategory("Rent"), buildCategory("Order Out"), buildCategory("Groceries"),
                buildCategory("Subscription"), buildCategory("Other"), buildCategory("Electric"),
                buildCategory("Payment"), buildCategory("Haircut"), buildCategory("Trip"),
                buildCategory("Gas Bill"), buildCategory("Gas"), buildCategory("Insurance"),
                buildCategory("Phone Insurance"), buildCategory("Utilities"), buildCategory("Mortgage"),
                buildCategory("Deposit"), buildCategory("Coffee"), buildCategory("Income"),
                buildCategory("Pet"), buildCategory("Refund"), buildCategory("Transfer"),
                buildCategory("Withdrawal")
        );
    }


    @AfterEach
    void tearDown() {
    }
}