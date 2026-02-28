package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.ExpenseCategory;
import com.app.budgetbuddy.domain.IncomeCategory;
import com.app.budgetbuddy.domain.SavingsCategory;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.SubBudgetService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class SubBudgetMonthOverviewServiceImplTest {


    @Mock
    private BudgetCategoryService transactionCategoryService;

    @Mock
    private SubBudgetService subBudgetService;

    @Mock
    private EntityManager entityManager;

    @Mock
    private TypedQuery<Object[]> mockQuery;

    @InjectMocks
    private SubBudgetMonthOverviewServiceImpl subBudgetMonthOverviewService;

    private final Long subBudgetId = 1L;
    private final LocalDate startDate = LocalDate.of(2025, 2, 1);
    private final LocalDate endDate = LocalDate.of(2025, 2, 28);

    @BeforeEach
    void setUp() {
    }

    @Test
    void testLoadIncomeCategory_whenNullSubBudgetId_thenReturnEmpty()
    {
        Optional<IncomeCategory> actual = subBudgetMonthOverviewService.loadIncomeCategory(null, startDate, endDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testLoadIncomeCategory_whenNullStartDate_thenReturnEmpty()
    {
        Optional<IncomeCategory> actual = subBudgetMonthOverviewService.loadIncomeCategory(subBudgetId, null, endDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testLoadIncomeCategory_whenNullEndDate_thenReturnEmpty()
    {
        Optional<IncomeCategory> actual = subBudgetMonthOverviewService.loadIncomeCategory(subBudgetId, startDate, null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testLoadIncomeCategory_whenNoResultsFound_thenReturnEmpty()
    {
        Mockito.when(entityManager.createQuery(Mockito.anyString(), Mockito.eq(Object[].class)))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.setParameter(Mockito.anyString(), Mockito.any()))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.getResultList())
                .thenReturn(Collections.emptyList());

        Optional<IncomeCategory> actual = subBudgetMonthOverviewService.loadIncomeCategory(subBudgetId, startDate, endDate);
        assertTrue(actual.isEmpty());
    }


    @Test
    void testLoadIncomeCategory_whenValidData_thenReturnIncomeCategory()
    {
        BigDecimal budgetedIncome = new BigDecimal("3260.00");
        double actualIncome = 1970.50;
        double remainingIncome = 1289.50;
        Object[] row = {budgetedIncome, actualIncome, remainingIncome};
        List<Object[]> results = new ArrayList<>();
        results.add(row);

        Mockito.when(entityManager.createQuery(Mockito.anyString(), Mockito.eq(Object[].class)))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.setParameter(Mockito.anyString(), Mockito.any()))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.getResultList())
                .thenReturn(results);

        Optional<IncomeCategory> actual = subBudgetMonthOverviewService.loadIncomeCategory(subBudgetId, startDate, endDate);

        assertTrue(actual.isPresent());
        assertEquals(budgetedIncome, actual.get().getBudgetedIncome());
        assertEquals(BigDecimal.valueOf(actualIncome), actual.get().getActualBudgetedIncome());
        assertEquals(BigDecimal.valueOf(remainingIncome), actual.get().getRemainingIncome());
    }

    @Test
    void testLoadIncomeCategory_whenStartDateIsFirstOfMonth_thenAdjustsDateAndIncludesPreviousSubBudget()
    {
        LocalDate firstOfMonth = LocalDate.of(2025, 2, 1);
        BigDecimal budgetedIncome = new BigDecimal("3260.00");
        Object[] row = {budgetedIncome, 1970.50, 1289.50};
        List<Object[]> results = new ArrayList<>();
        results.add(row);

        Mockito.when(entityManager.createQuery(Mockito.anyString(), Mockito.eq(Object[].class)))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.setParameter(Mockito.anyString(), Mockito.any()))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.getResultList())
                .thenReturn(results);

        Optional<IncomeCategory> actual = subBudgetMonthOverviewService.loadIncomeCategory(subBudgetId, firstOfMonth, endDate);
        assertTrue(actual.isPresent());
        // Verify the query was called with adjusted date (Jan 29) and both subBudgetIds
        Mockito.verify(mockQuery).setParameter("adjustedStartDate", firstOfMonth.minusDays(3));
        Mockito.verify(mockQuery).setParameter("subBudgetIds", List.of(subBudgetId, subBudgetId - 1));
    }

    @Test
    void testLoadExpenseCategory_whenNullParameters_thenReturnEmpty()
    {
        assertTrue(subBudgetMonthOverviewService.loadExpenseCategory(null, startDate, endDate).isEmpty());
        assertTrue(subBudgetMonthOverviewService.loadExpenseCategory(subBudgetId, null, endDate).isEmpty());
        assertTrue(subBudgetMonthOverviewService.loadExpenseCategory(subBudgetId, startDate, null).isEmpty());
    }

    @Test
    void testLoadExpenseCategory_whenNoResultsFound_thenReturnEmpty()
    {
        Mockito.when(entityManager.createQuery(Mockito.anyString(), Mockito.eq(Object[].class)))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.setParameter(Mockito.anyString(), Mockito.any()))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.getResultList())
                .thenReturn(Collections.emptyList());

        assertTrue(subBudgetMonthOverviewService.loadExpenseCategory(subBudgetId, startDate, endDate).isEmpty());
    }

    @Test
    void testLoadExpenseCategory_whenValidData_thenReturnExpenseCategory()
    {
        BigDecimal budgeted = new BigDecimal("3260.00");
        Double actual = 1500.00;
        Object[] row = {budgeted, actual};
        List<Object[]> results = new ArrayList<>();
        results.add(row);

        Mockito.when(entityManager.createQuery(Mockito.anyString(), Mockito.eq(Object[].class)))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.setParameter(Mockito.anyString(), Mockito.any()))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.getResultList())
                .thenReturn(results);

        Optional<ExpenseCategory> result = subBudgetMonthOverviewService.loadExpenseCategory(subBudgetId, startDate, endDate);

        assertTrue(result.isPresent());
        assertEquals(budgeted, result.get().getBudgetedExpenses());
        assertEquals(BigDecimal.valueOf(actual), result.get().getActualExpenses());
        assertEquals(startDate, result.get().getStartDate());
        assertEquals(endDate, result.get().getEndDate());
        assertTrue(result.get().isActive());
    }

    // ─── loadSavingsCategory ──────────────────────────────────────────────────

    @Test
    void testLoadSavingsCategory_whenNullParameters_thenReturnEmpty()
    {
        assertTrue(subBudgetMonthOverviewService.loadSavingsCategory(null, startDate, endDate).isEmpty());
        assertTrue(subBudgetMonthOverviewService.loadSavingsCategory(subBudgetId, null, endDate).isEmpty());
        assertTrue(subBudgetMonthOverviewService.loadSavingsCategory(subBudgetId, startDate, null).isEmpty());
    }

    @Test
    void testLoadSavingsCategory_whenValidData_thenReturnSavingsCategory()
    {
        Double targetAmount = 500.00;
        Double totalSaved = 200.00;
        Double remainingToSave = 300.00;
        Object[] row = {targetAmount, totalSaved, remainingToSave};
        List<Object[]> results = new ArrayList<>();
        results.add(row);

        Mockito.when(entityManager.createQuery(Mockito.anyString(), Mockito.eq(Object[].class)))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.setParameter(Mockito.anyString(), Mockito.any()))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.getResultList())
                .thenReturn(results);

        Optional<SavingsCategory> result = subBudgetMonthOverviewService.loadSavingsCategory(subBudgetId, startDate, endDate);

        assertTrue(result.isPresent());
        assertEquals(BigDecimal.valueOf(targetAmount),    result.get().getBudgetedSavingsTarget());
        assertEquals(BigDecimal.valueOf(totalSaved),      result.get().getActualSavedAmount());
        assertEquals(BigDecimal.valueOf(remainingToSave), result.get().getRemainingToSave());
        assertTrue(result.get().isActive());
        assertEquals(startDate, result.get().getStartDate());
        assertEquals(endDate,   result.get().getEndDate());
    }

    // ─── loadTopExpenseCategories ─────────────────────────────────────────────

    @Test
    void testLoadTopExpenseCategories_whenNullParameters_thenReturnEmptyList()
    {
        assertTrue(subBudgetMonthOverviewService.loadTopExpenseCategories(null, startDate, endDate).isEmpty());
        assertTrue(subBudgetMonthOverviewService.loadTopExpenseCategories(1L, null, endDate).isEmpty());
        assertTrue(subBudgetMonthOverviewService.loadTopExpenseCategories(1L, startDate, null).isEmpty());
    }

    @Test
    void testLoadTopExpenseCategories_whenValidData_thenReturnTopFiveCategories()
    {
        List<Object[]> rows = List.of(
                new Object[]{"Groceries", 450.00, 380.00, 70.00},
                new Object[]{"Rent",      1917.00, 1917.00, 0.00},
                new Object[]{"Payment",   240.00, 284.00, -44.00},
                new Object[]{"Gas",       82.00,  52.00,  30.00},
                new Object[]{"Utilities", 127.00, 134.00, -7.00}
        );

        Mockito.when(entityManager.createQuery(Mockito.anyString(), Mockito.eq(Object[].class)))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.setParameter(Mockito.anyString(), Mockito.any()))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.setMaxResults(5))
                .thenReturn(mockQuery);
        Mockito.when(mockQuery.getResultList())
                .thenReturn(rows);

        List<ExpenseCategory> result = subBudgetMonthOverviewService.loadTopExpenseCategories(1L, startDate, endDate);

        assertNotNull(result);
        assertEquals(5, result.size());
        assertEquals("Groceries", result.get(0).getCategory());
    }




    @AfterEach
    void tearDown() {
    }
}