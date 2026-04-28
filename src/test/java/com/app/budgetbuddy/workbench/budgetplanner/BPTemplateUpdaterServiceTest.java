package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BudgetCategoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BPTemplateUpdaterServiceTest
{
    @Mock
    private BPCategoryService bpCategoryService;

    @Mock
    private BudgetCategoryService budgetCategoryService;

    @InjectMocks
    private BPTemplateUpdaterService bpTemplateUpdaterService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testUpdateBPCategories_whenTemplateDetailNull_thenThrowException(){
        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(null, 1L, false);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateBPCategories_whenNoExistingBPCategoriesFound_thenReturnEmptyList(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setTemplateId(1L);
        templateDetail.setId(1L);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

        when(bpCategoryService.getCategoriesByTemplateDetailId(1L))
                .thenReturn(new ArrayList<>());

        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(templateDetail, 1L, false);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateBPCategories_whenBPCategoryIsNull_thenReturnBPCategories(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setId(1L);
        templateDetail.setTemplateId(1L);
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

        Long userId = 1L;
        boolean isIncomeTemplate = false;

        // getCategoriesByTemplateDetailId returns a list containing a null entry
        List<BPCategory> existingCategories = new ArrayList<>();
        existingCategories.add(null);

        when(bpCategoryService.getCategoriesByTemplateDetailId(1L))
                .thenReturn(existingCategories);

        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(
                templateDetail, userId, isIncomeTemplate);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateBPCategories_whenMultipleBPCategoriesWithOneNull_thenReturnUpdatedBPCategories(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setId(1L);
        templateDetail.setTemplateId(1L);
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

        Long userId = 1L;
        boolean isIncomeTemplate = false;

        BPCategory incomeCategory = new BPCategory();
        incomeCategory.setTemplateDetailId(1L);
        incomeCategory.setName("Income");
        incomeCategory.setType(BPType.INCOME);
        incomeCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        incomeCategory.setPlannedAmount(new BigDecimal("5000.0"));
        incomeCategory.setActual(BigDecimal.ZERO); // zero → will be updated
        incomeCategory.setBudgeted(BigDecimal.ZERO);
        incomeCategory.setColumnIndex(0);

        BPCategory expensesCategory = new BPCategory();
        expensesCategory.setTemplateDetailId(1L);
        expensesCategory.setName("Expenses");
        expensesCategory.setType(BPType.EXPENSE);
        expensesCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        expensesCategory.setPlannedAmount(new BigDecimal("3500.0"));
        expensesCategory.setActual(BigDecimal.ZERO); // zero → will be updated
        expensesCategory.setBudgeted(BigDecimal.ZERO);
        expensesCategory.setColumnIndex(1);

        // Mixed list — null entry should be skipped cleanly
        List<BPCategory> existingCategories = new ArrayList<>();
        existingCategories.add(incomeCategory);
        existingCategories.add(null);
        existingCategories.add(expensesCategory);

        BudgetCategory incomeBudgetCategory = new BudgetCategory();
        incomeBudgetCategory.setCategoryName("Income");
        incomeBudgetCategory.setBudgetActual(5000.0);

        BudgetCategory expensesBudgetCategory = new BudgetCategory();
        expensesBudgetCategory.setCategoryName("Expenses");
        expensesBudgetCategory.setBudgetActual(3200.0);

        when(bpCategoryService.getCategoriesByTemplateDetailId(1L))
                .thenReturn(existingCategories);
        when(budgetCategoryService.getBudgetCategoriesByDateRange(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31),
                userId))
                .thenReturn(List.of(incomeBudgetCategory, expensesBudgetCategory));

        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(
                templateDetail, userId, isIncomeTemplate);

        assertNotNull(actual);
        // null entry skipped — only the two valid updated categories returned
        assertEquals(2, actual.size());

        BPCategory actualIncome = actual.get(0);
        assertEquals("Income", actualIncome.getName());
        assertEquals(BPType.INCOME, actualIncome.getType());
        assertEquals(new BigDecimal("5000.0"), actualIncome.getActual());
        assertEquals(1L, actualIncome.getTemplateDetailId());

        BPCategory actualExpenses = actual.get(1);
        assertEquals("Expenses", actualExpenses.getName());
        assertEquals(BPType.EXPENSE, actualExpenses.getType());
        assertEquals(new BigDecimal("3200.0"), actualExpenses.getActual());
        assertEquals(1L, actualExpenses.getTemplateDetailId());
    }

    @Test
    void testUpdateBPCategories_whenBPCategoryDateRangeIsNull_thenSkipAndReturnRemainingUpdatedBPCategories(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setId(1L);
        templateDetail.setTemplateId(1L);
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

        Long userId = 1L;
        boolean isIncomeTemplate = false;

        BPCategory categoryWithNullRange = new BPCategory();
        categoryWithNullRange.setTemplateDetailId(1L);
        categoryWithNullRange.setName("Expenses");
        categoryWithNullRange.setType(BPType.EXPENSE);
        categoryWithNullRange.setRange(null); // <-- null range, should be skipped
        categoryWithNullRange.setPlannedAmount(new BigDecimal("3500.0"));
        categoryWithNullRange.setActual(BigDecimal.ZERO);
        categoryWithNullRange.setBudgeted(BigDecimal.ZERO);
        categoryWithNullRange.setColumnIndex(0);

        BPCategory incomeCategory = new BPCategory();
        incomeCategory.setTemplateDetailId(1L);
        incomeCategory.setName("Income");
        incomeCategory.setType(BPType.INCOME);
        incomeCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        incomeCategory.setPlannedAmount(new BigDecimal("5000.0"));
        incomeCategory.setActual(BigDecimal.ZERO); // zero → will be updated
        incomeCategory.setBudgeted(BigDecimal.ZERO);
        incomeCategory.setColumnIndex(1);

        BPCategory savingsCategory = new BPCategory();
        savingsCategory.setTemplateDetailId(1L);
        savingsCategory.setName("Savings");
        savingsCategory.setType(BPType.BUDGET);
        savingsCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        savingsCategory.setPlannedAmount(new BigDecimal("500.0"));
        savingsCategory.setActual(BigDecimal.ZERO); // zero → will be updated
        savingsCategory.setBudgeted(BigDecimal.ZERO);
        savingsCategory.setColumnIndex(2);

        // null range sits in the middle — valid categories on either side still processed
        List<BPCategory> existingCategories = new ArrayList<>();
        existingCategories.add(incomeCategory);
        existingCategories.add(categoryWithNullRange);
        existingCategories.add(savingsCategory);

        BudgetCategory incomeBudgetCategory = new BudgetCategory();
        incomeBudgetCategory.setCategoryName("Income");
        incomeBudgetCategory.setBudgetActual(5000.0);

        BudgetCategory savingsBudgetCategory = new BudgetCategory();
        savingsBudgetCategory.setCategoryName("Savings");
        savingsBudgetCategory.setBudgetActual(450.0);

        when(bpCategoryService.getCategoriesByTemplateDetailId(1L))
                .thenReturn(existingCategories);
        when(budgetCategoryService.getBudgetCategoriesByDateRange(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31),
                userId))
                .thenReturn(List.of(incomeBudgetCategory, savingsBudgetCategory));

        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(
                templateDetail, userId, isIncomeTemplate);

        assertNotNull(actual);
        // null range skipped — only the two valid updated categories returned
        assertEquals(2, actual.size());

        BPCategory actualIncome = actual.get(0);
        assertEquals("Income", actualIncome.getName());
        assertEquals(BPType.INCOME, actualIncome.getType());
        assertEquals(new BigDecimal("5000.0"), actualIncome.getActual());
        assertEquals(1L, actualIncome.getTemplateDetailId());

        BPCategory actualSavings = actual.get(1);
        assertEquals("Savings", actualSavings.getName());
        assertEquals(BPType.BUDGET, actualSavings.getType());
        assertEquals(new BigDecimal("450.0"), actualSavings.getActual());
        assertEquals(1L, actualSavings.getTemplateDetailId());
    }

    @Test
    void testUpdateBPCategories_whenValidIncomeTemplate_thenReturnBPCategories(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setTemplateId(1L);
        templateDetail.setId(1L);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

        Long userId = 1L;
        boolean isIncomeTemplate = true;
        List<BPCategory> expected = new ArrayList<>();
        BPCategory rentBPCategory = new BPCategory();
        rentBPCategory.setTemplateDetailId(templateDetail.getId());
        rentBPCategory.setName("Rent");
        rentBPCategory.setType(BPType.BUDGET);
        rentBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        rentBPCategory.setPlannedAmount(new BigDecimal("5000.00"));
        rentBPCategory.setActual(BigDecimal.valueOf(1220.0));
        rentBPCategory.setBudgeted(BigDecimal.valueOf(1927));
        rentBPCategory.setColumnIndex(0);
        expected.add(rentBPCategory);

        BPCategory incomeBPCategory = new BPCategory();
        incomeBPCategory.setTemplateDetailId(templateDetail.getId());
        incomeBPCategory.setName("Income");
        incomeBPCategory.setType(BPType.INCOME);
        incomeBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        incomeBPCategory.setPlannedAmount(BigDecimal.ZERO);
        incomeBPCategory.setActual(new BigDecimal("1988.00"));
        incomeBPCategory.setBudgeted(new BigDecimal("4000.00"));
        incomeBPCategory.setColumnIndex(1);
        expected.add(incomeBPCategory);

        BPCategory groceriesBPCategory = new BPCategory();
        groceriesBPCategory.setTemplateDetailId(templateDetail.getId());
        groceriesBPCategory.setName("Groceries");
        groceriesBPCategory.setType(BPType.EXPENSE);
        groceriesBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        groceriesBPCategory.setPlannedAmount(BigDecimal.ZERO);
        groceriesBPCategory.setActual(new BigDecimal("374.00"));
        groceriesBPCategory.setBudgeted(new BigDecimal("400.00"));
        groceriesBPCategory.setColumnIndex(2);
        expected.add(groceriesBPCategory);

        BudgetCategory incomeBudgetCategory = new BudgetCategory();
        incomeBudgetCategory.setCategoryName("Income");
        incomeBudgetCategory.setBudgetActual(2012.03);

        BudgetCategory groceriesBudgetCategory = new BudgetCategory();
        groceriesBudgetCategory.setCategoryName("Groceries");
        groceriesBudgetCategory.setBudgetActual(120.25);
        groceriesBudgetCategory.setStartDate(LocalDate.of(2024, 1, 1));
        groceriesBudgetCategory.setEndDate(LocalDate.of(2024, 1, 7));

        BudgetCategory rentBudgetCategory = new BudgetCategory();
        rentBudgetCategory.setCategoryName("Rent");
        rentBudgetCategory.setBudgetActual(707.0);
        rentBudgetCategory.setStartDate(LocalDate.of(2024, 1, 1));
        rentBudgetCategory.setEndDate(LocalDate.of(2024, 1, 7));
        rentBudgetCategory.setSubBudgetId(1L);


        List<BudgetCategory> budgetCategories = List.of(
                incomeBudgetCategory,
                groceriesBudgetCategory,
                rentBudgetCategory
        );

        when(bpCategoryService.getCategoriesByTemplateDetailId(1L))
                .thenReturn(expected);

        // isIncomeTemplate=true → uses getBudgetCategorySpendingByDateRangeOverlaps
        when(budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31),
                userId))
                .thenReturn(budgetCategories);

        List<BPCategory> updatedBPCategories = new ArrayList<>();
        BPCategory updatedIncomeBPCategory = new BPCategory();
        updatedIncomeBPCategory.setTemplateDetailId(templateDetail.getId());
        updatedIncomeBPCategory.setName("Income");
        updatedIncomeBPCategory.setType(BPType.INCOME);
        updatedIncomeBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        updatedIncomeBPCategory.setPlannedAmount(BigDecimal.ZERO);
        updatedIncomeBPCategory.setActual(new BigDecimal("4000.03"));
        updatedIncomeBPCategory.setBudgeted(new BigDecimal("4000.00"));
        updatedIncomeBPCategory.setColumnIndex(1);
        updatedBPCategories.add(updatedIncomeBPCategory);

        BPCategory updatedGroceriesBPCategory = new BPCategory();
        updatedGroceriesBPCategory.setTemplateDetailId(templateDetail.getId());
        updatedGroceriesBPCategory.setName("Groceries");
        updatedGroceriesBPCategory.setType(BPType.EXPENSE);
        updatedGroceriesBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        updatedGroceriesBPCategory.setPlannedAmount(BigDecimal.ZERO);
        updatedGroceriesBPCategory.setActual(new BigDecimal("494.25"));
        updatedGroceriesBPCategory.setBudgeted(new BigDecimal("400.00"));
        updatedGroceriesBPCategory.setColumnIndex(2);
        updatedBPCategories.add(updatedGroceriesBPCategory);

        BPCategory updatedRentBPCategory = new BPCategory();
        updatedRentBPCategory.setTemplateDetailId(templateDetail.getId());
        updatedRentBPCategory.setName("Rent");
        updatedRentBPCategory.setType(BPType.BUDGET);
        updatedRentBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        updatedRentBPCategory.setPlannedAmount(new BigDecimal("5000.00"));
        updatedRentBPCategory.setActual(BigDecimal.valueOf(1927.00));
        updatedRentBPCategory.setBudgeted(BigDecimal.valueOf(1927));
        updatedRentBPCategory.setColumnIndex(0);
        updatedBPCategories.add(updatedRentBPCategory);


        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(templateDetail, userId, isIncomeTemplate);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            BPCategory actualCategory = actual.get(i);
            BPCategory expectedCategory = expected.get(i);
            assertEquals(expectedCategory.getName(), actualCategory.getName());
            assertEquals(expectedCategory.getType(), actualCategory.getType());
            assertEquals(expectedCategory.getRange(), actualCategory.getRange());
            assertEquals(expectedCategory.getPlannedAmount(), actualCategory.getPlannedAmount());
            assertEquals(expectedCategory.getActual(), actualCategory.getActual());
            assertEquals(expectedCategory.getBudgeted(), actualCategory.getBudgeted());
            assertEquals(expectedCategory.getColumnIndex(), actualCategory.getColumnIndex());
            assertEquals(expectedCategory.getTemplateDetailId(), actualCategory.getTemplateDetailId());
        }
    }

    @Test
    void testUpdateBPCategories_whenBPCategoriesNoMatchOnBudgetCategories_thenReturnEmptyList(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setTemplateId(1L);
        templateDetail.setId(1L);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

        Long userId = 1L;
        boolean isIncomeTemplate = true;
        List<BPCategory> expected = new ArrayList<>();
        BPCategory rentBPCategory = new BPCategory();
        rentBPCategory.setTemplateDetailId(templateDetail.getId());
        rentBPCategory.setName("Rent");
        rentBPCategory.setType(BPType.BUDGET);
        rentBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        rentBPCategory.setPlannedAmount(new BigDecimal("5000.00"));
        rentBPCategory.setActual(BigDecimal.valueOf(1220.0));
        rentBPCategory.setBudgeted(BigDecimal.valueOf(1927));
        rentBPCategory.setColumnIndex(0);
        expected.add(rentBPCategory);

        BPCategory incomeBPCategory = new BPCategory();
        incomeBPCategory.setTemplateDetailId(templateDetail.getId());
        incomeBPCategory.setName("Income");
        incomeBPCategory.setType(BPType.INCOME);
        incomeBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        incomeBPCategory.setPlannedAmount(BigDecimal.ZERO);
        incomeBPCategory.setActual(new BigDecimal("1988.00"));
        incomeBPCategory.setBudgeted(new BigDecimal("4000.00"));
        incomeBPCategory.setColumnIndex(1);
        expected.add(incomeBPCategory);

        BPCategory groceriesBPCategory = new BPCategory();
        groceriesBPCategory.setTemplateDetailId(templateDetail.getId());
        groceriesBPCategory.setName("Groceries");
        groceriesBPCategory.setType(BPType.EXPENSE);
        groceriesBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        groceriesBPCategory.setPlannedAmount(BigDecimal.ZERO);
        groceriesBPCategory.setActual(new BigDecimal("374.00"));
        groceriesBPCategory.setBudgeted(new BigDecimal("400.00"));
        groceriesBPCategory.setColumnIndex(2);
        expected.add(groceriesBPCategory);

        when(bpCategoryService.getCategoriesByTemplateDetailId(1L))
            .thenReturn(expected);

        BudgetCategory hairCutBudgetCategory = new BudgetCategory();
        hairCutBudgetCategory.setCategoryName("Haircut");
        hairCutBudgetCategory.setBudgetActual(27.00);

        BudgetCategory paymentBudgetCategory = new BudgetCategory();
        paymentBudgetCategory.setCategoryName("Payment");
        paymentBudgetCategory.setBudgetActual(87.95);
        paymentBudgetCategory.setStartDate(LocalDate.of(2024, 1, 1));
        paymentBudgetCategory.setEndDate(LocalDate.of(2024, 1, 7));

        List<BudgetCategory> budgetCategories = List.of(hairCutBudgetCategory, paymentBudgetCategory);

        when(budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31),
                userId))
                .thenReturn(budgetCategories);

        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(templateDetail, userId, isIncomeTemplate);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateBPCategories_whenExistingBPCategoryAmountIsNull_thenReturnUpdatedBPCategoryList(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setTemplateId(1L);
        templateDetail.setId(1L);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

        Long userId = 1L;
        boolean isIncomeTemplate = false;
        BPCategory expensesCategory = new BPCategory();
        expensesCategory.setTemplateDetailId(1L);
        expensesCategory.setName("Expenses");
        expensesCategory.setType(BPType.EXPENSE);
        expensesCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        expensesCategory.setPlannedAmount(new BigDecimal("3500.0"));
        expensesCategory.setActual(null); // <-- null triggers update
        expensesCategory.setBudgeted(BigDecimal.ZERO);
        expensesCategory.setColumnIndex(0);
        List<BPCategory> existingCategories = List.of(expensesCategory);
        BudgetCategory expensesBudgetCategory = new BudgetCategory();
        expensesBudgetCategory.setCategoryName("Expenses");
        expensesBudgetCategory.setBudgetActual(3200.0); // incoming non-zero value

        when(bpCategoryService.getCategoriesByTemplateDetailId(1L))
                .thenReturn(existingCategories);
        when(budgetCategoryService.getBudgetCategoriesByDateRange(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31),
                userId))
                .thenReturn(List.of(expensesBudgetCategory));

        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(
                templateDetail, userId, isIncomeTemplate);

        assertNotNull(actual);
        assertEquals(1, actual.size());
        // null existing → replaced with incoming value
        assertEquals(new BigDecimal("3200.0"), actual.get(0).getActual());
        assertEquals("Expenses", actual.get(0).getName());
        assertEquals(BPType.EXPENSE, actual.get(0).getType());
        assertEquals(1L, actual.get(0).getTemplateDetailId());
    }

    @Test
    void testUpdateBPCategories_whenExistingBPCategoryActualIsZero_thenReturnUpdatedBPCategoryList(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setTemplateId(1L);
        templateDetail.setId(1L);

        Long userId = 1L;
        boolean isIncomeTemplate = false;
        BPCategory savingsCategory = new BPCategory();
        savingsCategory.setTemplateDetailId(1L);
        savingsCategory.setName("Savings");
        savingsCategory.setType(BPType.BUDGET);
        savingsCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        savingsCategory.setPlannedAmount(new BigDecimal("50.00"));
        savingsCategory.setActual(BigDecimal.ZERO); // <-- zero triggers update
        savingsCategory.setBudgeted(BigDecimal.ZERO);
        savingsCategory.setColumnIndex(0);
        List<BPCategory> existingCategories = List.of(savingsCategory);

        BudgetCategory savingsBudgetCategory = new BudgetCategory();
        savingsBudgetCategory.setCategoryName("Savings");
        savingsBudgetCategory.setBudgetActual(450.0); // incoming non-zero value

        when(bpCategoryService.getCategoriesByTemplateDetailId(1L))
                .thenReturn(existingCategories);
        when(budgetCategoryService.getBudgetCategoriesByDateRange(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31),
                userId))
                .thenReturn(List.of(savingsBudgetCategory));

        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(
                templateDetail, userId, isIncomeTemplate);

        assertNotNull(actual);
        assertEquals(1, actual.size());
        // zero existing → replaced with incoming value
        assertEquals(new BigDecimal("450.0"), actual.get(0).getActual());
        assertEquals("Savings", actual.get(0).getName());
        assertEquals(BPType.BUDGET, actual.get(0).getType());
        assertEquals(1L, actual.get(0).getTemplateDetailId());
    }

    @Test
    void testUpdateBPCategories_whenExistingBPCategoryActualIsEqual_thenReturnUpdatedBPCategoryList(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setId(1L);
        templateDetail.setTemplateId(1L);
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

        Long userId = 1L;
        boolean isIncomeTemplate = false;

        // Category whose actual matches incoming exactly — should NOT be added to result
        BPCategory unchangedCategory = new BPCategory();
        unchangedCategory.setTemplateDetailId(1L);
        unchangedCategory.setName("Income");
        unchangedCategory.setType(BPType.INCOME);
        unchangedCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        unchangedCategory.setPlannedAmount(new BigDecimal("5000.0"));
        unchangedCategory.setActual(new BigDecimal("5000.0")); // existing == incoming → no update
        unchangedCategory.setBudgeted(BigDecimal.ZERO);
        unchangedCategory.setColumnIndex(0);

        // Category whose actual differs from incoming — should be added to result
        BPCategory changedCategory = new BPCategory();
        changedCategory.setTemplateDetailId(1L);
        changedCategory.setName("Expenses");
        changedCategory.setType(BPType.EXPENSE);
        changedCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        changedCategory.setPlannedAmount(new BigDecimal("3500.0"));
        changedCategory.setActual(new BigDecimal("3000.0")); // existing differs from incoming
        changedCategory.setBudgeted(BigDecimal.ZERO);
        changedCategory.setColumnIndex(0);

        List<BPCategory> existingCategories = List.of(unchangedCategory, changedCategory);

        BudgetCategory incomeBudgetCategory = new BudgetCategory();
        incomeBudgetCategory.setCategoryName("Income");
        incomeBudgetCategory.setBudgetActual(5000.00); // matches existing → skipped

        BudgetCategory expensesBudgetCategory = new BudgetCategory();
        expensesBudgetCategory.setCategoryName("Expenses");
        expensesBudgetCategory.setBudgetActual(3200.0); // differs from existing → updated

        when(bpCategoryService.getCategoriesByTemplateDetailId(1L))
                .thenReturn(existingCategories);
        when(budgetCategoryService.getBudgetCategoriesByDateRange(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31),
                userId))
                .thenReturn(List.of(incomeBudgetCategory, expensesBudgetCategory));

        List<BPCategory> actual = bpTemplateUpdaterService.updateBPCategories(
                templateDetail, userId, isIncomeTemplate);

        assertNotNull(actual);
        // Only the changed category is returned — unchanged income is excluded
        assertEquals(1, actual.size());
        assertEquals("Expenses", actual.get(0).getName());
        assertEquals(new BigDecimal("3200.0"), actual.get(0).getActual());
        assertEquals(BPType.EXPENSE, actual.get(0).getType());
        assertEquals(1L, actual.get(0).getTemplateDetailId());

    }

    @Test
    void testUpdateBPCategories_whenIsIncomeTemplateFalse_thenReturnBPCategories(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setTemplateId(1L);
        templateDetail.setId(1L);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

    }

    private List<BPColumn> createTestColumns() {
        List<BPColumn> columns = new ArrayList<>();

        columns.add(BPColumn.builder()
                .columnIndex(0)
                .dateRange(new DateRange(
                        LocalDate.of(2025, 1, 1),
                        LocalDate.of(2025, 1, 31)))
                .period(Period.MONTHLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(1)
                .dateRange(new DateRange(
                        LocalDate.of(2025, 2, 1),
                        LocalDate.of(2025, 2, 28)))
                .period(Period.MONTHLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(2)
                .dateRange(new DateRange(
                        LocalDate.of(2025, 3, 1),
                        LocalDate.of(2025, 3, 31)))
                .period(Period.MONTHLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        return columns;
    }

    private List<BPGridRow> createTestGridRows() {
        List<BPGridRow> rows = new ArrayList<>();

        // Income row — one cell per column
        rows.add(new BPGridRow(
                "Income",
                BPType.INCOME,
                List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("5000.00"),
                                new BigDecimal("5000.00"),
                                BigDecimal.ZERO, true, false),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("5000.00"),
                                new BigDecimal("5000.00"),
                                BigDecimal.ZERO,
                                false, true),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("5200.00"),
                                new BigDecimal("5000.00"),
                                BigDecimal.ZERO,false, true)
                )
        ));

        // Expenses row
        rows.add(new BPGridRow(
                "Expenses",
                BPType.EXPENSE,
                List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("3200.00"),
                                new BigDecimal("3500.00"),
                                BigDecimal.ZERO,false, true),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("3600.00"),
                                new BigDecimal("3500.00"),
                                BigDecimal.ZERO,false, true),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("3100.00"),
                                new BigDecimal("3500.00"),
                                BigDecimal.ZERO,false, true)
                )
        ));

        // Balance row — isBalance = true
        rows.add(new BPGridRow(
                "Balance",
                BPType.BALANCE,
                List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("1800.00"),
                                new BigDecimal("1500.00"),
                                BigDecimal.ZERO,true, false),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("1400.00"),
                                new BigDecimal("1500.00"),
                                BigDecimal.ZERO, true, false),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("2100.00"),
                                new BigDecimal("1500.00"),
                                BigDecimal.ZERO, true, false)
                )
        ));

        // Savings row
        rows.add(new BPGridRow(
                "Savings",
                BPType.BUDGET,
                List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("500.00"),
                                new BigDecimal("500.00"),
                                BigDecimal.ZERO,false, true),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("300.00"),
                                new BigDecimal("500.00"),
                                BigDecimal.ZERO, false, true),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("600.00"),
                                new BigDecimal("500.00"),
                                BigDecimal.ZERO,false, true)
                )
        ));

        return rows;
    }

    private BPLayoutGrid createTestBPLayoutGrid() {
        return new BPLayoutGrid(createTestColumns(), createTestGridRows());
    }


    @AfterEach
    void tearDown() {
    }
}