package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetGoalsService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class DailyBudgetCategoryBuilderServiceTest
{
    @MockBean
    private BudgetCategoryService budgetCategoryService;

    @MockBean
    private BudgetCalculations budgetCalculations;

    @MockBean
    private BudgetEstimatorService budgetEstimatorService;

    @MockBean
    private SubBudgetGoalsService subBudgetGoalsService;

    @Autowired
    private DailyBudgetCategoryBuilderService dailyBudgetCategoryBuilderService;

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
    void testBuildDailyBudgetCategoryList_whenDailyBudgetCategoryCriteriaNull_thenReturnEmptyList()
    {
        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.buildDailyBudgetCategoryList(null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildDailyBudgetCategoryList_whenValidDate_thenReturnBudgetCategory(){
        DailyBudgetCategoryCriteria dailyBudgetCategoryCriteria = new DailyBudgetCategoryCriteria();
        dailyBudgetCategoryCriteria.setActive(true);
        dailyBudgetCategoryCriteria.setDate(LocalDate.of(2025, 4, 16));
        dailyBudgetCategoryCriteria.setSubBudget(testSubBudget);

        DailyCategorySpending dailyCategorySpending = new DailyCategorySpending();
        dailyCategorySpending.setCategory("Rent");
        dailyCategorySpending.setCategorySpending(BigDecimal.valueOf(707));
        dailyCategorySpending.setCurrentDate(LocalDate.of(2025, 4, 16));
        dailyCategorySpending.setTransactions(List.of(createRentTransaction(BigDecimal.valueOf(707))));
        dailyBudgetCategoryCriteria.setCategorySpendingByDate(List.of(dailyCategorySpending));

        List<BudgetCategory> expected = new ArrayList<>();
        BudgetCategory rentBudgetCategory = new BudgetCategory();
        rentBudgetCategory.setBudgetActual(707.0);
        rentBudgetCategory.setBudgetedAmount(707.0);
        rentBudgetCategory.setCategoryName("Rent");
        rentBudgetCategory.setStartDate(LocalDate.of(2025, 4, 16));
        rentBudgetCategory.setEndDate(LocalDate.of(2025, 4, 30));
        rentBudgetCategory.setSubBudgetId(testSubBudget.getId());
        rentBudgetCategory.setIsActive(true);
        rentBudgetCategory.setOverSpent(false);
        rentBudgetCategory.setOverSpendingAmount(0.0);
        expected.add(rentBudgetCategory);

        List<BudgetCategory> actual = dailyBudgetCategoryBuilderService.buildDailyBudgetCategoryList(dailyBudgetCategoryCriteria);
        assertNotNull(actual);
        for(int i = 0; i < expected.size(); i++)
        {
            BudgetCategory budgetCategory = actual.get(i);
            BudgetCategory expectedBudgetCategory = expected.get(i);
            assertEquals(expectedBudgetCategory.getId(), budgetCategory.getId());
            assertEquals(expectedBudgetCategory.getBudgetActual(), budgetCategory.getBudgetActual());
            assertEquals(expectedBudgetCategory.getBudgetedAmount(), budgetCategory.getBudgetedAmount());
            assertEquals(expectedBudgetCategory.getCategoryName(), budgetCategory.getCategoryName());
            assertEquals(expectedBudgetCategory.getStartDate(), budgetCategory.getStartDate());
            assertEquals(expectedBudgetCategory.getEndDate(), budgetCategory.getEndDate());
            assertEquals(expectedBudgetCategory.getSubBudgetId(), budgetCategory.getSubBudgetId());
            assertEquals(expectedBudgetCategory.getTransactions().size(), budgetCategory.getTransactions().size());
        }
    }

    private Transaction createRentTransaction(BigDecimal amount)
    {
        Transaction transaction = new Transaction();
        transaction.setAmount(amount);
        transaction.setTransactionId("e2e2e2e2e2");
        transaction.setPosted(LocalDate.of(2025, 4, 16));
        transaction.setMerchantName("Flex Finance");
        transaction.setPending(false);
        transaction.setAuthorizedDate(LocalDate.of(2025, 4, 16));
        transaction.setDescription("Purchase FLEX FINANCE");
        transaction.setCategories(List.of("Financial", "Service"));
        transaction.setAccountId("vBbQarwL0Yu8YD8EjxOMFNN0LwQ16LCkg0Roo");
        return transaction;
    }

    @AfterEach
    void tearDown() {
    }
}