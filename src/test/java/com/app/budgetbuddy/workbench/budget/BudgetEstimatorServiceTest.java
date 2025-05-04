package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.workbench.PercentageCalculator;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.cglib.core.Local;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@SpringBootTest
class BudgetEstimatorServiceTest
{
    @MockBean
    private BudgetCategoryQueries budgetCategoryQueries;

    @MockBean
    private PercentageCalculator percentageCalculator;

    @Autowired
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
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenSubBudgetNull_thenReturnEmptyArray()
    {
        CategoryBudgetAmount[] categoryBudgetAmounts = budgetEstimatorService.calculateBudgetCategoryAmount(null);
        assertEquals(0, categoryBudgetAmounts.length);
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenAprilSubBudget_thenReturnCategoryBudgetAmounts()
    {

        // Mock setup
        LocalDate startDate = LocalDate.of(2025, 4, 1);
        LocalDate endDate = LocalDate.of(2025, 4, 30);
        SubBudget subBudget = testSubBudget;

        // Mock CategoryDateInfo

        // Mock category queries
        when(budgetCategoryQueries.getCategoryAmount(eq(1L), eq(startDate), eq(endDate), eq("Rent")))
                .thenReturn(1907.0);
        when(budgetCategoryQueries.getCategoryAmount(eq(1L), eq(startDate), eq(endDate), eq("Utilities")))
                .thenReturn(210.0);
        when(budgetCategoryQueries.getCategoryAmount(eq(1L), eq(startDate), eq(endDate), eq("Insurance")))
                .thenReturn(79.3);
        when(budgetCategoryQueries.getCategoryAmount(eq(1L), eq(startDate), eq(endDate), eq("Gas")))
                .thenReturn(65.2);
        when(budgetCategoryQueries.userHasPayments()).thenReturn(true);
        when(budgetCategoryQueries.userHasSubscriptions()).thenReturn(true);

        // Mock percentage calculator for categories that use percentage

        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Gas")))
                .thenReturn(BigDecimal.valueOf(0.02));
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Groceries")))
                .thenReturn(BigDecimal.valueOf(0.10)); // 8.8%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Payments")))
                .thenReturn(BigDecimal.valueOf(0.12)); // 11.4%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Subscription")))
                .thenReturn(BigDecimal.valueOf(0.05)); // 4.4%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Savings")))
                .thenReturn(BigDecimal.valueOf(0.06)); // 5.6%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Order Out")))
                .thenReturn(BigDecimal.valueOf(0.015)); // 5.27%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Other")))
                .thenReturn(BigDecimal.valueOf(0.02)); // 1.56%

        CategoryBudgetAmount[] expectedCategoryBudgetAmounts = new CategoryBudgetAmount[10];
        CategoryBudgetAmount rentCategoryBudgetAmount = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1907.0));
        CategoryBudgetAmount utilitiesCategoryBudgetAmount = new CategoryBudgetAmount("Utilities", BigDecimal.valueOf(210.0));
        CategoryBudgetAmount insuranceCategoryBudgetAmount = new CategoryBudgetAmount("Insurance", BigDecimal.valueOf(79.3));
        CategoryBudgetAmount gasCategoryBudgetAmount = new CategoryBudgetAmount("Gas", BigDecimal.valueOf(65.3));
        CategoryBudgetAmount groceriesCategoryBudgetAmount = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(326.0));
        CategoryBudgetAmount paymentsCategoryBudgetAmount = new CategoryBudgetAmount("Payments", BigDecimal.valueOf(391.2));
        CategoryBudgetAmount subscriptionsCategoryBudgetAmount = new CategoryBudgetAmount("Subscription", BigDecimal.valueOf(163.0));
        CategoryBudgetAmount ordersCategoryBudgetAmount = new CategoryBudgetAmount("Order Out", BigDecimal.valueOf(48.9));
        CategoryBudgetAmount otherPurchasesCategoryBudgetAmount = new CategoryBudgetAmount("Other", BigDecimal.valueOf(65.3));
        expectedCategoryBudgetAmounts[0] = rentCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[1] = utilitiesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[2] = insuranceCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[3] = gasCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[4] = groceriesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[5] = paymentsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[6] = subscriptionsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[7] = new CategoryBudgetAmount("Savings", BigDecimal.ZERO);
        expectedCategoryBudgetAmounts[8] = ordersCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[9] = otherPurchasesCategoryBudgetAmount;

        CategoryBudgetAmount[] categoryBudgetAmounts = budgetEstimatorService.calculateBudgetCategoryAmount(subBudget);
        assertEquals(expectedCategoryBudgetAmounts.length, categoryBudgetAmounts.length);
        for (int i = 0; i < expectedCategoryBudgetAmounts.length; i++) {
            if (expectedCategoryBudgetAmounts[i] != null && categoryBudgetAmounts[i] != null) {
                assertEquals(expectedCategoryBudgetAmounts[i].getCategory(), categoryBudgetAmounts[i].getCategory(),
                        "Category at index " + i + " doesn't match");
                assertEquals(expectedCategoryBudgetAmounts[i].getBudgetAmount(), categoryBudgetAmounts[i].getBudgetAmount(),
                        "Budget amount for " + expectedCategoryBudgetAmounts[i].getCategory() + " doesn't match");
            } else {
                // Handle case where one of them is null
                if (expectedCategoryBudgetAmounts[i] == null) {
                    assertNull(categoryBudgetAmounts[i], "Expected null at index " + i);
                } else {
                    assertNotNull(categoryBudgetAmounts[i], "Unexpected null at index " + i +
                            " for category " + expectedCategoryBudgetAmounts[i].getCategory());
                }
            }
        }
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenMonthlyIncomeIsZero_thenReturnEmptyArray(){
        SubBudget subBudget = new SubBudget();
        subBudget.setActive(true);
        subBudget.setId(4L);
        subBudget.setBudget(budget);
        subBudget.setAllocatedAmount(BigDecimal.ZERO);
        subBudget.setStartDate(LocalDate.of(2025, 4, 1));
        subBudget.setEndDate(LocalDate.of(2025, 4, 30));

        CategoryBudgetAmount[] categoryBudgetAmounts = budgetEstimatorService.calculateBudgetCategoryAmount(subBudget);
        assertEquals(0, categoryBudgetAmounts.length);
    }

    @Test
    void testCalculateBudgetCategoryAmount_whenNoPaymentsButSubscriptions_thenReturnCategoryBudgetAmounts()
    {
        // Mock setup
        LocalDate startDate = LocalDate.of(2025, 4, 1);
        LocalDate endDate = LocalDate.of(2025, 4, 30);
        SubBudget subBudget = testSubBudget;

        // Mock CategoryDateInfo
        CategoryDateInfo mockCategoryDateInfo = mock(CategoryDateInfo.class);
        mockStatic(CategoryDateInfo.class);
        when(CategoryDateInfo.createCategoryDateInfo(eq(1L), eq(startDate), eq(endDate)))
                .thenReturn(mockCategoryDateInfo);

        // Mock category queries
        when(budgetCategoryQueries.getCategoryAmount(eq(1L), eq(startDate), eq(endDate), eq("Rent")))
                .thenReturn(1907.0);
        when(budgetCategoryQueries.getCategoryAmount(eq(1L), eq(startDate), eq(endDate), eq("Utilities")))
                .thenReturn(210.0);
        when(budgetCategoryQueries.getCategoryAmount(eq(1L), eq(startDate), eq(endDate), eq("Insurance")))
                .thenReturn(79.3);
        when(budgetCategoryQueries.getCategoryAmount(eq(1L), eq(startDate), eq(endDate), eq("Gas")))
                .thenReturn(65.2);
        when(budgetCategoryQueries.userHasPayments()).thenReturn(false);
        when(budgetCategoryQueries.userHasSubscriptions()).thenReturn(true);

        // Mock percentage calculator for categories that use percentage
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Gas")))
                .thenReturn(BigDecimal.valueOf(0.02));
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Groceries")))
                .thenReturn(BigDecimal.valueOf(0.10)); // 8.8%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Payments")))
                .thenReturn(BigDecimal.valueOf(0.12)); // 11.4%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Subscription")))
                .thenReturn(BigDecimal.valueOf(0.05)); // 4.4%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Savings")))
                .thenReturn(BigDecimal.valueOf(0.06)); // 5.6%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Order Out")))
                .thenReturn(BigDecimal.valueOf(0.015)); // 5.27%
        when(percentageCalculator.estimateCategoryPercentage(eq(3260.0), eq("Other")))
                .thenReturn(BigDecimal.valueOf(0.02)); // 1.56%

        CategoryBudgetAmount[] expectedCategoryBudgetAmounts = new CategoryBudgetAmount[10];
        CategoryBudgetAmount rentCategoryBudgetAmount = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1907.0));
        CategoryBudgetAmount utilitiesCategoryBudgetAmount = new CategoryBudgetAmount("Utilities", BigDecimal.valueOf(210.0));
        CategoryBudgetAmount insuranceCategoryBudgetAmount = new CategoryBudgetAmount("Insurance", BigDecimal.valueOf(79.3));
        CategoryBudgetAmount gasCategoryBudgetAmount = new CategoryBudgetAmount("Gas", BigDecimal.valueOf(65.3));
        CategoryBudgetAmount groceriesCategoryBudgetAmount = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(326.0));
        CategoryBudgetAmount subscriptionsCategoryBudgetAmount = new CategoryBudgetAmount("Subscription", BigDecimal.valueOf(163.0));
        CategoryBudgetAmount savingsCategoryBudgetAmount = new CategoryBudgetAmount("Savings", BigDecimal.valueOf(195.6));
        CategoryBudgetAmount ordersCategoryBudgetAmount = new CategoryBudgetAmount("Order Out", BigDecimal.valueOf(48.9));
        CategoryBudgetAmount otherPurchasesCategoryBudgetAmount = new CategoryBudgetAmount("Other", BigDecimal.valueOf(65.3));
        expectedCategoryBudgetAmounts[0] = rentCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[1] = utilitiesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[2] = insuranceCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[3] = gasCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[4] = groceriesCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[5] = new CategoryBudgetAmount("Payments", BigDecimal.ZERO);
        expectedCategoryBudgetAmounts[6] = subscriptionsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[7] = savingsCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[8] = ordersCategoryBudgetAmount;
        expectedCategoryBudgetAmounts[9] = otherPurchasesCategoryBudgetAmount;

        CategoryBudgetAmount[] categoryBudgetAmounts = budgetEstimatorService.calculateBudgetCategoryAmount(subBudget);
        assertEquals(expectedCategoryBudgetAmounts.length, categoryBudgetAmounts.length);
        for (int i = 0; i < expectedCategoryBudgetAmounts.length; i++) {
            if (expectedCategoryBudgetAmounts[i] != null && categoryBudgetAmounts[i] != null) {
                assertEquals(expectedCategoryBudgetAmounts[i].getCategory(), categoryBudgetAmounts[i].getCategory(),
                        "Category at index " + i + " doesn't match");
                assertEquals(expectedCategoryBudgetAmounts[i].getBudgetAmount(), categoryBudgetAmounts[i].getBudgetAmount(),
                        "Budget amount for " + expectedCategoryBudgetAmounts[i].getCategory() + " doesn't match");
            } else {
                // Handle case where one of them is null
                if (expectedCategoryBudgetAmounts[i] == null) {
                    assertNull(categoryBudgetAmounts[i], "Expected null at index " + i);
                } else {
                    assertNotNull(categoryBudgetAmounts[i], "Unexpected null at index " + i +
                            " for category " + expectedCategoryBudgetAmounts[i].getCategory());
                }
            }
        }
    }

    @Test
    void testGetBudgetCategoryAmountByCategory_whenCategoryIsEmpty_thenReturnZero(){
        String category = "";
        CategoryBudgetAmount[] categoryBudgetAmounts = new CategoryBudgetAmount[1];
        categoryBudgetAmounts[0] = new CategoryBudgetAmount("Rent", BigDecimal.ZERO);
        BigDecimal actual = budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
        assertEquals(0, actual.compareTo(BigDecimal.ZERO));
    }

    @Test
    void testGetBudgetCategoryAmountByCategory_whenCategoryBudgetAmountsArrayIsEmpty_thenReturnZero(){
        String category = "Rent";
        CategoryBudgetAmount[] categoryBudgetAmounts = new CategoryBudgetAmount[0];
        BigDecimal actual = budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
        assertEquals(0, actual.compareTo(BigDecimal.ZERO));
    }

    @Test
    void testGetBudgetCategoryAmountByCategory_whenCategoryRent_thenReturnRentAmount(){
        String category = "Rent";
        CategoryBudgetAmount[] categoryBudgetAmounts = new CategoryBudgetAmount[10];
        CategoryBudgetAmount rentCategoryBudgetAmount = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1907.0));
        CategoryBudgetAmount utilitiesCategoryBudgetAmount = new CategoryBudgetAmount("Utilities", BigDecimal.valueOf(210.0));
        CategoryBudgetAmount insuranceCategoryBudgetAmount = new CategoryBudgetAmount("Insurance", BigDecimal.valueOf(79.3));
        CategoryBudgetAmount gasCategoryBudgetAmount = new CategoryBudgetAmount("Gas", BigDecimal.valueOf(65.3));
        CategoryBudgetAmount groceriesCategoryBudgetAmount = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(326.0));
        CategoryBudgetAmount subscriptionsCategoryBudgetAmount = new CategoryBudgetAmount("Subscription", BigDecimal.valueOf(163.0));
        CategoryBudgetAmount savingsCategoryBudgetAmount = new CategoryBudgetAmount("Savings", BigDecimal.valueOf(195.6));
        CategoryBudgetAmount ordersCategoryBudgetAmount = new CategoryBudgetAmount("Order Out", BigDecimal.valueOf(48.9));
        CategoryBudgetAmount otherPurchasesCategoryBudgetAmount = new CategoryBudgetAmount("Other", BigDecimal.valueOf(65.3));
        categoryBudgetAmounts[0] = rentCategoryBudgetAmount;
        categoryBudgetAmounts[1] = utilitiesCategoryBudgetAmount;
        categoryBudgetAmounts[2] = insuranceCategoryBudgetAmount;
        categoryBudgetAmounts[3] = gasCategoryBudgetAmount;
        categoryBudgetAmounts[4] = groceriesCategoryBudgetAmount;
        categoryBudgetAmounts[5] = subscriptionsCategoryBudgetAmount;
        categoryBudgetAmounts[6] = savingsCategoryBudgetAmount;
        categoryBudgetAmounts[7] = ordersCategoryBudgetAmount;
        categoryBudgetAmounts[8] = otherPurchasesCategoryBudgetAmount;

        BigDecimal actual = budgetEstimatorService.getBudgetCategoryAmountByCategory(category, categoryBudgetAmounts);
        assertNotNull(actual);
        assertEquals(BigDecimal.valueOf(1907.0), actual);
    }



    @AfterEach
    void tearDown() {
    }
}