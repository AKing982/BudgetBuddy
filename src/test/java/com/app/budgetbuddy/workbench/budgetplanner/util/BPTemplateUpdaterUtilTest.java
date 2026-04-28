package com.app.budgetbuddy.workbench.budgetplanner.util;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class BPTemplateUpdaterUtilTest {

    private BPTemplateUpdaterUtil bpTemplateUpdaterUtil;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCreateUnmatchedBPCategories_whenExistingBPCategoriesIsNull_thenReturnEmptyList(){
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        budgetCategories.add(new BudgetCategory());

        List<BPColumn> columns = new ArrayList<>();
        columns.add(new BPColumn());

        List<BPCategory> actual = BPTemplateUpdaterUtil.createUnmatchedBPCategories(null,budgetCategories, 1L, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateUnmatchedBPCategories_whenExistingBPCategoriesIsEmpty_thenReturnEmptyList(){
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        budgetCategories.add(new BudgetCategory());

        List<BPColumn> columns = new ArrayList<>();
        columns.add(new BPColumn());

        List<BPCategory> actual = BPTemplateUpdaterUtil.createUnmatchedBPCategories(new ArrayList<>(),budgetCategories, 1L, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateUnmatchedBPCategories_whenNewBudgetCategoriesAreNull_thenThrowCatchException_thenReturnEmptyList(){

        List<BPCategory> existingBPCategories = new ArrayList<>();
        existingBPCategories.add(new BPCategory());
        List<BPColumn> columns = createTestColumns();
        Long templateDetailId = 1L;
        List<BPCategory> actual = BPTemplateUpdaterUtil.createUnmatchedBPCategories(existingBPCategories,null, templateDetailId, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateUnmatchedBPCategories_whenNewBudgetCategoriesAreEmpty__thenReturnEmptyList(){
        List<BPCategory> existingBPCategories = new ArrayList<>();
        existingBPCategories.add(new BPCategory());
        List<BPColumn> columns = createTestColumns();
        Long templateDetailId = 1L;
        List<BPCategory> actual = BPTemplateUpdaterUtil.createUnmatchedBPCategories(existingBPCategories,new ArrayList<>(), templateDetailId, columns);
        assertNotNull(actual);
    }

    @Test
    void testCreateUnmatchedBPCategories_whenTemplateDetailIdIsNull_thenThrowException(){
        List<BPCategory> existingBPCategories = new ArrayList<>();
        existingBPCategories.add(new BPCategory());
        List<BPColumn> columns = createTestColumns();
        assertThrows(TemplateDetailException.class, () -> BPTemplateUpdaterUtil.createUnmatchedBPCategories(existingBPCategories,new ArrayList<>(), null, columns));
    }

    @Test
    void testCreateUnmatchedBPCategories_whenBPColumnsIsNull_thenReturnEmptyList(){
        List<BPCategory> existingBPCategories = new ArrayList<>();
        existingBPCategories.add(new BPCategory());
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        budgetCategories.add(new BudgetCategory());
        Long templateDetailId = 1L;
        List<BPCategory> actual = BPTemplateUpdaterUtil.createUnmatchedBPCategories(existingBPCategories,budgetCategories, templateDetailId, null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateUnmatchedBPCategories_whenBPColumnsAreEmpty_thenReturnEmptyList(){
        List<BPCategory> existingBPCategories = new ArrayList<>();
        existingBPCategories.add(new BPCategory());
        List<BudgetCategory> budgetCategories = new ArrayList<>();
        budgetCategories.add(new BudgetCategory());
        Long templateDetailId = 1L;
        List<BPCategory> actual = BPTemplateUpdaterUtil.createUnmatchedBPCategories(existingBPCategories,budgetCategories, templateDetailId, List.of());
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateUnmatchedBPCategories_whenExistingBPCategoriesAreDifferentFromBudgetCategories_thenReturnUnmatchedBPCategories(){
        List<BPCategory> bpCategories = new ArrayList<>();
        BPCategory groceriesBPCategory = new BPCategory();
        groceriesBPCategory.setTemplateDetailId(1L);
        groceriesBPCategory.setName("Groceries");
        groceriesBPCategory.setType(BPType.EXPENSE);
        groceriesBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        groceriesBPCategory.setPlannedAmount(BigDecimal.ZERO);
        groceriesBPCategory.setActual(new BigDecimal("374.00"));
        groceriesBPCategory.setBudgeted(new BigDecimal("400.00"));
        groceriesBPCategory.setColumnIndex(2);
        bpCategories.add(groceriesBPCategory);

        BPCategory rentBPCategory = new BPCategory();
        rentBPCategory.setTemplateDetailId(1L);
        rentBPCategory.setName("Rent");
        rentBPCategory.setType(BPType.BUDGET);
        rentBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        rentBPCategory.setPlannedAmount(new BigDecimal("5000.00"));
        rentBPCategory.setActual(BigDecimal.valueOf(1220.0));
        rentBPCategory.setBudgeted(BigDecimal.valueOf(1927));
        rentBPCategory.setColumnIndex(0);
        bpCategories.add(rentBPCategory);

        BudgetCategory hairCutBudgetCategory = new BudgetCategory();
        hairCutBudgetCategory.setCategoryName("Haircut");
        hairCutBudgetCategory.setBudgetActual(27.00);
        hairCutBudgetCategory.setStartDate(LocalDate.of(2025, 1, 1));
        hairCutBudgetCategory.setEndDate(LocalDate.of(2025, 1, 31));
        hairCutBudgetCategory.setBudgetedAmount(50.0);

        BudgetCategory paymentBudgetCategory = new BudgetCategory();
        paymentBudgetCategory.setCategoryName("Payment");
        paymentBudgetCategory.setBudgetActual(87.95);
        paymentBudgetCategory.setBudgetedAmount(120.00);
        paymentBudgetCategory.setStartDate(LocalDate.of(2025, 1, 1));
        paymentBudgetCategory.setEndDate(LocalDate.of(2025, 1, 31));

        List<BudgetCategory> budgetCategories = List.of(hairCutBudgetCategory, paymentBudgetCategory);

        Long templateDetailId = 1L;
        List<BPColumn> columns = createTestColumns();

        List<BPCategory> expected = new ArrayList<>();
        BPCategory paymentBPCategory = new BPCategory();
        paymentBPCategory.setTemplateDetailId(templateDetailId);
        paymentBPCategory.setName("Payment");
        paymentBPCategory.setType(BPType.BUDGET);
        paymentBPCategory.setBudgeted(BigDecimal.valueOf(120.00));
        paymentBPCategory.setPlannedAmount(BigDecimal.ZERO);
        paymentBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        paymentBPCategory.setActual(BigDecimal.valueOf(87.95));
        paymentBPCategory.setColumnIndex(0);
        expected.add(paymentBPCategory);

        BPCategory haircutBPCategory = new BPCategory();
        haircutBPCategory.setTemplateDetailId(templateDetailId);
        haircutBPCategory.setName("Haircut");
        haircutBPCategory.setType(BPType.BUDGET);
        haircutBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        haircutBPCategory.setActual(BigDecimal.valueOf(27.00));
        haircutBPCategory.setBudgeted(BigDecimal.valueOf(50.0));
        haircutBPCategory.setPlannedAmount(BigDecimal.ZERO);
        haircutBPCategory.setColumnIndex(0);
        expected.add(haircutBPCategory);

        List<BPCategory> actual = BPTemplateUpdaterUtil.createUnmatchedBPCategories(expected,budgetCategories, templateDetailId, columns);
        assertNotNull(actual);
        assertEquals(2, actual.size());
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
    void testCreateUnmatchedBPCategories_whenBPCategoriesMatchOnBudgetCategories_thenReturnEmptyList(){
        List<BPCategory> bpCategories = new ArrayList<>();
        BPCategory groceriesBPCategory = new BPCategory();
        groceriesBPCategory.setTemplateDetailId(1L);
        groceriesBPCategory.setName("Groceries");
        groceriesBPCategory.setType(BPType.EXPENSE);
        groceriesBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        groceriesBPCategory.setPlannedAmount(BigDecimal.ZERO);
        groceriesBPCategory.setActual(new BigDecimal("374.00"));
        groceriesBPCategory.setBudgeted(new BigDecimal("400.00"));

        bpCategories.add(groceriesBPCategory);
        BudgetCategory groceryBudgetCategory = new BudgetCategory();
        groceryBudgetCategory.setCategoryName("Groceries");
        groceryBudgetCategory.setBudgetActual(400.00);
        groceryBudgetCategory.setStartDate(LocalDate.of(2025, 1, 1));
        groceryBudgetCategory.setEndDate(LocalDate.of(2025, 1, 31));
        groceryBudgetCategory.setBudgetedAmount(400.00);

        List<BudgetCategory> budgetCategories = List.of(groceryBudgetCategory);
        Long templateDetailId = 1L;
        List<BPColumn> columns = createTestColumns();
        List<BPCategory> actual = BPTemplateUpdaterUtil.createUnmatchedBPCategories(bpCategories,budgetCategories, templateDetailId, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
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



    @AfterEach
    void tearDown() {
    }
}