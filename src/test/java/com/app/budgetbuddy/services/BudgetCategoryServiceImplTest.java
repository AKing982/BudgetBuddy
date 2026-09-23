package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.BudgetCategory;
import com.app.budgetbuddy.domain.BudgetCategorySpending;
import com.app.budgetbuddy.repositories.BudgetCategoryRepository;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import com.app.budgetbuddy.repositories.TransactionCategoryRepository;
import com.app.budgetbuddy.workbench.converter.BudgetCategoryConverter;
import com.app.budgetbuddy.workbench.converter.BudgetCategoryModelConverter;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BudgetCategoryServiceImplTest {

    @Mock
    private BudgetCategoryRepository budgetCategoryRepository;

    @Mock
    private BudgetCategoryConverter budgetCategoryConverter;

    @Mock
    private TransactionCategoryRepository transactionCategoryRepository;

    @Mock
    private BudgetCategoryModelConverter budgetCategoryModelConverter;

    @Mock
    private SubBudgetRepository subBudgetRepository;

    @InjectMocks
    private BudgetCategoryServiceImpl budgetCategoryService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testGetBudgetCategorySpendingByDateRangeOverlaps_whenRequireSalaryIsTrue_thenReturnSalaryBudgetCategories(){
        boolean requireSalary = true;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 1, 7);
        LocalDate endDate = LocalDate.of(2026, 1, 31);

        List<BudgetCategory> expected = new ArrayList<>();
        BudgetCategory incomeCategory = new BudgetCategory();
        incomeCategory.setCategoryName("Salary");
        incomeCategory.setStartDate(LocalDate.of(2026, 1, 7));
        incomeCategory.setEndDate(endDate);
        incomeCategory.setId(1L);
        incomeCategory.setBudgetedAmount(3928.0);
        incomeCategory.setBudgetActual(0.0);
        expected.add(incomeCategory);

        List<BudgetCategorySpending> budgetCategorySpending = new ArrayList<>();
        BudgetCategorySpending incomeCategorySpending = new BudgetCategorySpending("Income", 1L, 0.0, 3928.0, startDate, endDate);
        budgetCategorySpending.add(incomeCategorySpending);
        when(transactionCategoryRepository.findIncomeSpendingByDateRangeAndUserId(any(LocalDate.class), any(LocalDate.class), anyLong()))
                .thenReturn(budgetCategorySpending);

        List<BudgetCategory> actual = budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(startDate, endDate, userId, requireSalary);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < actual.size(); i++)
        {
            assertEquals(expected.get(i).getBudgetActual(), actual.get(i).getBudgetActual());
            assertEquals(expected.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
            assertEquals(expected.get(i).getCategoryName(), actual.get(i).getCategoryName());
            assertEquals(expected.get(i).getStartDate(), actual.get(i).getStartDate());
            assertEquals(expected.get(i).getEndDate(), actual.get(i).getEndDate());
            assertEquals(expected.get(i).getId(), expected.get(i).getId());
        }
    }

    @Test
    void testGetBudgetCategorySpendingByDateRangeOverlaps_whenRequireSalaryOnlyIsFalse_thenReturnBudgetCategories(){
        boolean requireSalary = false;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 7);

        List<BudgetCategory> expected = new ArrayList<>();
        BudgetCategory incomeCategory = new BudgetCategory();
        incomeCategory.setBudgetActual(0.0);
        incomeCategory.setCategoryName("Salary");
        incomeCategory.setBudgetedAmount(3928.0);
        incomeCategory.setStartDate(startDate);
        incomeCategory.setEndDate(endDate);
        incomeCategory.setId(2L);
        incomeCategory.setUserId(userId);

        BudgetCategory groceryCategory = new BudgetCategory();
        groceryCategory.setBudgetActual(128.2);
        groceryCategory.setBudgetedAmount(220.0);
        groceryCategory.setCategoryName("Groceries");
        groceryCategory.setStartDate(startDate);
        groceryCategory.setEndDate(endDate);
        groceryCategory.setUserId(userId);
        groceryCategory.setId(3L);

        BudgetCategory gasCategory = new BudgetCategory();
        gasCategory.setBudgetActual(32.02);
        gasCategory.setBudgetedAmount(50.5);
        gasCategory.setCategoryName("Gas");
        gasCategory.setStartDate(startDate);
        gasCategory.setEndDate(endDate);
        gasCategory.setId(4L);
        gasCategory.setUserId(userId);

        expected.add(incomeCategory);
        expected.add(gasCategory);
        expected.add(groceryCategory);

        List<BudgetCategorySpending> budgetCategorySpendingList = new ArrayList<>();
        BudgetCategorySpending groceryCategorySpending = new BudgetCategorySpending("Groceries", 128.2, 220.0, startDate, endDate);
        BudgetCategorySpending gasCategorySpending = new BudgetCategorySpending("Gas", 32.02, 50.5, startDate, endDate);
        BudgetCategorySpending incomeCategorySpending = new BudgetCategorySpending("Income", 0.0, 3928.0, startDate, endDate);
        budgetCategorySpendingList.add(incomeCategorySpending);
        budgetCategorySpendingList.add(gasCategorySpending);
        budgetCategorySpendingList.add(groceryCategorySpending);
        when(transactionCategoryRepository.findSpendingByDateRangeAndUserId(startDate, endDate, userId))
                .thenReturn(budgetCategorySpendingList);

        List<BudgetCategory> actual = budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(startDate, endDate, userId, requireSalary);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < actual.size(); i++)
        {
            assertEquals(expected.get(i).getBudgetActual(), actual.get(i).getBudgetActual());
            assertEquals(expected.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
            assertEquals(expected.get(i).getCategoryName(), actual.get(i).getCategoryName());
            assertEquals(expected.get(i).getStartDate(), actual.get(i).getStartDate());
            assertEquals(expected.get(i).getEndDate(), actual.get(i).getEndDate());
        }
    }

    @Test
    void testGetBudgetCategorySpendingByDateRangeOverlaps_whenBudgetCategorySpendingCriteriaIsNull_thenSkipAndReturnBudgetCategories(){
        boolean requireSalaryOnly = false;
        Long userId = 1L;
        LocalDate startDate = LocalDate.of(2026, 1, 1);
        LocalDate endDate = LocalDate.of(2026, 1, 7);

        List<BudgetCategory> expected = new ArrayList<>();
        BudgetCategory incomeCategory = new BudgetCategory();
        incomeCategory.setBudgetActual(0.0);
        incomeCategory.setCategoryName("Salary");
        incomeCategory.setBudgetedAmount(3928.0);
        incomeCategory.setStartDate(startDate);
        incomeCategory.setEndDate(endDate);
        incomeCategory.setId(2L);
        incomeCategory.setUserId(userId);

        BudgetCategory groceryCategory = new BudgetCategory();
        groceryCategory.setBudgetActual(128.2);
        groceryCategory.setBudgetedAmount(220.0);
        groceryCategory.setCategoryName("Groceries");
        groceryCategory.setStartDate(startDate);
        groceryCategory.setEndDate(endDate);
        groceryCategory.setUserId(userId);
        groceryCategory.setId(3L);

        BudgetCategory gasCategory = new BudgetCategory();
        gasCategory.setBudgetActual(32.02);
        gasCategory.setBudgetedAmount(50.5);
        gasCategory.setCategoryName("Gas");
        gasCategory.setStartDate(startDate);
        gasCategory.setEndDate(endDate);
        gasCategory.setId(4L);
        gasCategory.setUserId(userId);

        expected.add(incomeCategory);
        expected.add(gasCategory);
        List<BudgetCategorySpending> budgetCategorySpendingList = new ArrayList<>();
        BudgetCategorySpending groceryCategorySpending = new BudgetCategorySpending("Groceries", null, null, startDate, null);
        BudgetCategorySpending gasCategorySpending = new BudgetCategorySpending("Gas", 32.02, 50.5, startDate, endDate);
        BudgetCategorySpending incomeCategorySpending = new BudgetCategorySpending("Income", 0.0, 3928.0, startDate, endDate);
        budgetCategorySpendingList.add(incomeCategorySpending);
        budgetCategorySpendingList.add(groceryCategorySpending);
        budgetCategorySpendingList.add(gasCategorySpending);

        when(transactionCategoryRepository.findSpendingByDateRangeAndUserId(startDate, endDate, userId))
                .thenReturn(budgetCategorySpendingList);

        List<BudgetCategory> actual = budgetCategoryService.getBudgetCategorySpendingByDateRangeOverlaps(startDate, endDate, userId, requireSalaryOnly);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < actual.size(); i++)
        {
            assertEquals(expected.get(i).getBudgetActual(), actual.get(i).getBudgetActual());
            assertEquals(expected.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
            assertEquals(expected.get(i).getCategoryName(), actual.get(i).getCategoryName());
            assertEquals(expected.get(i).getStartDate(), actual.get(i).getStartDate());
            assertEquals(expected.get(i).getEndDate(), actual.get(i).getEndDate());
        }
    }


    @AfterEach
    void tearDown() {
    }
}