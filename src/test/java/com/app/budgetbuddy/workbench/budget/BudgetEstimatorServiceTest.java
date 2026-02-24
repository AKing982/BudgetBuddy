package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.PercentageCalculator;
import com.app.budgetbuddy.workbench.subBudget.HistoricalDataEngine;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

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

    @Mock
    private PercentageCalculator percentageCalculator;

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

        budgetEstimatorService = new BudgetEstimatorService(budgetCategoryQueries, percentageCalculator, historicalDataEngine, categoryService);
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
        Mockito.when(historicalDataEngine.getHistoricalMonthHistoryByCategory(6, 1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(Map.of());
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
        List<CategoryEntity> mockCategories = List.of(
                buildCategory("Groceries"),
                buildCategory("Rent")
        );

        Mockito.when(historicalDataEngine.getHistoricalMonthHistoryByCategory(6, 1L, LocalDate.of(2025, 4, 1)))
                .thenReturn(Map.of());

        Mockito.when(categoryService.findAllSystemCategories()).thenReturn(mockCategories);

        // Groceries at 3260 income: slope(-0.000007) * 3260 + 0.12 = 0.09718 * 3260 = 316.81
        // Rent at 3260 income: slope(-0.004) * 3260 + 0.70 = -12.34 + 0.70 = 0 (capped at 0)
        Mockito.when(percentageCalculator.estimateCategoryPercentage(3260.0, "Groceries"))
                .thenReturn(new BigDecimal("0.0972"));
        Mockito.when(percentageCalculator.estimateCategoryPercentage(3260.0, "Rent"))
                .thenReturn(new BigDecimal("0.0000"));

        List<CategoryBudgetAmount> actual = budgetEstimatorService.calculateBudgetCategoryAmount(testSubBudget);
        assertNotNull(actual);
        assertEquals(2, actual.size());

        Map<String, BigDecimal> actualMap = actual.stream()
                .collect(Collectors.toMap(CategoryBudgetAmount::category, CategoryBudgetAmount::budgetAmount));

        assertEquals(new BigDecimal("316.87"), actualMap.get("Groceries")); // 0.0972 * 3260
        assertEquals(new BigDecimal("0.00"), actualMap.get("Rent"));
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
    void testCalculateCategoryBudgetPercentage_whenCategoryIsEmpty_thenReturnEmptyMap(){
        Map<String, Double> actual = budgetEstimatorService.calculateCategoryBudgetPercentage("");
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
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