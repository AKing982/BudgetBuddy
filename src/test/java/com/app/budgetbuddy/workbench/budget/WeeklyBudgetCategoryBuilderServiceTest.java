package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BudgetCategoryException;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.workbench.subBudget.SubBudgetBuilderService;
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
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;

@ExtendWith(MockitoExtension.class)
class WeeklyBudgetCategoryBuilderServiceTest
{
    @Mock
    private BudgetCategoryService budgetCategoryService;

    @Mock
    private BudgetCalculations budgetCalculations;

    @Mock
    private BudgetEstimatorService budgetEstimatorService;

    @Mock
    private SubBudgetBuilderService subBudgetBuilderService;

    @InjectMocks
    private WeeklyBudgetCategoryBuilderService weeklyBudgetCategoryBuilderService;

    private SubBudget testSubBudget;

    private BudgetScheduleRange testRange;

    @BeforeEach
    void setUp() {

        testRange = new BudgetScheduleRange();
        testRange.setId(1L);
        testRange.setStartRange(LocalDate.of(2025, 1, 1));
        testRange.setEndRange(LocalDate.of(2025, 1, 7));

        BudgetSchedule budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetScheduleId(1L);
        budgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        budgetSchedule.setBudgetScheduleRanges(List.of(testRange));

        testSubBudget = new SubBudget();
        testSubBudget.setId(1L);
        testSubBudget.setStartDate(LocalDate.of(2025, 1, 1));
        testSubBudget.setEndDate(LocalDate.of(2025, 1, 31));
        testSubBudget.setAllocatedAmount(BigDecimal.valueOf(3260));
        testSubBudget.setBudgetSchedule(List.of(budgetSchedule));

        Budget budget = new Budget();
        budget.setId(1L);
        budget.setUserId(1L);
        budget.setBudgetAmount(BigDecimal.valueOf(3260));
        testSubBudget.setBudget(budget);
    }

    @Test
    void testGetWeeklyCategorySpending_whenWeekStartIsNull_thenReturnEmptyList(){
        LocalDate weekEnd = LocalDate.of(2025, 1, 7);
        List<TransactionsByCategory> transactionsByCategories = List.of(new TransactionsByCategory());
        List<WeeklyCategorySpending> actual = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(null, weekEnd, transactionsByCategories);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetWeeklyCategorySpending_whenWeekEndIsNull_thenReturnEmptyList(){
        LocalDate weekStart = LocalDate.of(2025, 1, 1);
        List<TransactionsByCategory> transactionsByCategories = List.of(new TransactionsByCategory());
        List<WeeklyCategorySpending> actual = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(weekStart, null, transactionsByCategories);
        assertNotNull(actual);
    }

    @Test
    void testGetWeeklyCategorySpending_whenTransactionsByCategoryIsNull_thenReturnWeeklyCategorySpendingList(){
        LocalDate weekStart = LocalDate.of(2025, 1, 1);
        LocalDate weekEnd = LocalDate.of(2025, 1, 7);
        List<WeeklyCategorySpending> actual = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(weekStart, weekEnd, null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetWeeklyCategorySpending_whenTransactionsByCategoryIsEmpty_thenReturnWeeklyCategorySpendingList(){
        LocalDate weekStart = LocalDate.of(2025, 1, 1);
        LocalDate weekEnd = LocalDate.of(2025, 1, 7);
        List<TransactionsByCategory> transactionsByCategories = List.of();
        List<WeeklyCategorySpending> actual = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(weekStart, weekEnd, transactionsByCategories);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetWeeklyCategorySpending_whenTransactionsByCategoryIsNotEmpty_thenReturnWeeklyCategorySpendingList(){
        LocalDate weekStart = LocalDate.of(2025, 1, 1);
        LocalDate weekEnd = LocalDate.of(2025, 1, 7);
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();

        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(1220));
        List<Transaction> rentTransactions = new ArrayList<>();

        Transaction rentTransaction2 = new Transaction();
        rentTransaction2.setAmount(BigDecimal.valueOf(1220));
        rentTransaction2.setPosted(LocalDate.of(2025, 1, 1));
        rentTransactions.add(rentTransaction2);
        rentCategory.setTransactions(rentTransactions);

        TransactionsByCategory groceriesCategory = new TransactionsByCategory();
        groceriesCategory.setCategoryName("Groceries");
        groceriesCategory.setTotalCategorySpending(BigDecimal.valueOf(142));
        List<Transaction> groceriesTransactions = new ArrayList<>();
        Transaction groceriesTransaction1 = new Transaction();
        groceriesTransaction1.setAmount(BigDecimal.valueOf(63));
        groceriesTransaction1.setPosted(LocalDate.of(2025, 1, 3));

        Transaction groceriesTransaction2 = new Transaction();
        groceriesTransaction2.setAmount(BigDecimal.valueOf(79));
        groceriesTransaction2.setPosted(LocalDate.of(2025, 1, 4));
        groceriesTransactions.add(groceriesTransaction1);
        groceriesTransactions.add(groceriesTransaction2);
        groceriesCategory.setTransactions(groceriesTransactions);

        transactionsByCategories.add(rentCategory);
        transactionsByCategories.add(groceriesCategory);

        List<WeeklyCategorySpending> expected = new ArrayList<>();
        WeeklyCategorySpending weeklyCategorySpending1 = new WeeklyCategorySpending();
        weeklyCategorySpending1.setCategory("Groceries");
        weeklyCategorySpending1.setTransactions(groceriesTransactions);
        weeklyCategorySpending1.setTotalCategorySpending(BigDecimal.valueOf(142));
        weeklyCategorySpending1.setWeekRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));

        WeeklyCategorySpending weeklyCategorySpending2 = new WeeklyCategorySpending();
        weeklyCategorySpending2.setCategory("Rent");
        weeklyCategorySpending2.setTransactions(rentTransactions);
        weeklyCategorySpending2.setTotalCategorySpending(BigDecimal.valueOf(1220));
        weeklyCategorySpending2.setWeekRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));

        expected.add(weeklyCategorySpending2);
        expected.add(weeklyCategorySpending1);

        List<WeeklyCategorySpending> actual = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(weekStart, weekEnd, transactionsByCategories);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++){
            WeeklyCategorySpending expectedWeeklyCategorySpending = expected.get(i);
            WeeklyCategorySpending actualWeeklyCategorySpending = actual.get(i);
            assertEquals(expectedWeeklyCategorySpending.getCategory(), actualWeeklyCategorySpending.getCategory());
            assertEquals(expectedWeeklyCategorySpending.getTransactions(), actualWeeklyCategorySpending.getTransactions());
            assertEquals(expectedWeeklyCategorySpending.getTotalCategorySpending(), actualWeeklyCategorySpending.getTotalCategorySpending());
            assertEquals(expectedWeeklyCategorySpending.getWeekRange(), actualWeeklyCategorySpending.getWeekRange());
        }
    }

    @Test
    void testGetWeeklyCategorySpending_whenCategoryHasEmptyTransactions_thenReturnEmptyList(){
        LocalDate weekStart = LocalDate.of(2025, 1, 1);
        LocalDate weekEnd = LocalDate.of(2025, 1, 7);
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(1220));
        rentCategory.setTransactions(new ArrayList<>());
        transactionsByCategories.add(rentCategory);
        List<WeeklyCategorySpending> actual = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(weekStart, weekEnd, transactionsByCategories);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testGetWeeklyCategorySpending_whenTransactionHasNullAmount_thenSkipTransaction(){
        LocalDate weekStart = LocalDate.of(2025, 1, 1);
        LocalDate weekEnd = LocalDate.of(2025, 1, 7);
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(1220));
        List<Transaction> rentTransactions = new ArrayList<>();
        Transaction rentTransaction1 = new Transaction();
        rentTransaction1.setAmount(null);

        Transaction rentTransaction2 = new Transaction();
        rentTransaction2.setAmount(BigDecimal.valueOf(1220));
        rentTransaction2.setPosted(LocalDate.of(2025, 1, 1));
        rentTransactions.add(rentTransaction1);
        rentTransactions.add(rentTransaction2);
        rentCategory.setTransactions(rentTransactions);
        transactionsByCategories.add(rentCategory);

        List<WeeklyCategorySpending> expected = new ArrayList<>();
        WeeklyCategorySpending weeklyCategorySpending1 = new WeeklyCategorySpending();
        weeklyCategorySpending1.setCategory("Rent");
        weeklyCategorySpending1.setTransactions(rentTransactions);
        weeklyCategorySpending1.setTotalCategorySpending(BigDecimal.valueOf(1220));
        weeklyCategorySpending1.setWeekRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));

        expected.add(weeklyCategorySpending1);

        List<WeeklyCategorySpending> actual = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(weekStart, weekEnd, transactionsByCategories);
        assertNotNull(actual);
        assertEquals(1, actual.size());
        for(int i = 0; i < expected.size(); i++){
            WeeklyCategorySpending expectedWeeklyCategorySpending = expected.get(i);
            WeeklyCategorySpending actualWeeklyCategorySpending = actual.get(i);
            assertEquals(expectedWeeklyCategorySpending.getCategory(), actualWeeklyCategorySpending.getCategory());
            assertEquals(expectedWeeklyCategorySpending.getTransactions(), actualWeeklyCategorySpending.getTransactions());
            assertEquals(expectedWeeklyCategorySpending.getTotalCategorySpending(), actualWeeklyCategorySpending.getTotalCategorySpending());
            assertEquals(expectedWeeklyCategorySpending.getWeekRange(), actualWeeklyCategorySpending.getWeekRange());
        }
    }

    @Test
    void testGetWeeklyCategorySpending_whenTransactionIsNull_thenSkipTransaction(){
        LocalDate weekStart = LocalDate.of(2025, 1, 1);
        LocalDate weekEnd = LocalDate.of(2025, 1, 7);
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(1220));
        List<Transaction> rentTransactions = new ArrayList<>();
        rentTransactions.add(null);
        Transaction rentTransaction2 = new Transaction();
        rentTransaction2.setAmount(BigDecimal.valueOf(1220));
        rentTransaction2.setPosted(LocalDate.of(2025, 1, 1));
        rentTransactions.add(rentTransaction2);
        rentCategory.setTransactions(rentTransactions);
        transactionsByCategories.add(rentCategory);

        List<WeeklyCategorySpending> expected = new ArrayList<>();
        WeeklyCategorySpending weeklyCategorySpending1 = new WeeklyCategorySpending();
        weeklyCategorySpending1.setCategory("Rent");
        weeklyCategorySpending1.setTransactions(rentTransactions);
        weeklyCategorySpending1.setTotalCategorySpending(BigDecimal.valueOf(1220));
        weeklyCategorySpending1.setWeekRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));
        expected.add(weeklyCategorySpending1);

        List<WeeklyCategorySpending> actual = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(weekStart, weekEnd, transactionsByCategories);
        assertNotNull(actual);
        assertEquals(1, actual.size());
        for(int i = 0; i < expected.size(); i++){
            WeeklyCategorySpending expectedWeeklyCategorySpending = expected.get(i);
            WeeklyCategorySpending actualWeeklyCategorySpending = actual.get(i);
            assertEquals(expectedWeeklyCategorySpending.getCategory(), actualWeeklyCategorySpending.getCategory());
            assertEquals(expectedWeeklyCategorySpending.getTransactions(), actualWeeklyCategorySpending.getTransactions());
            assertEquals(expectedWeeklyCategorySpending.getTotalCategorySpending(), actualWeeklyCategorySpending.getTotalCategorySpending());
            assertEquals(expectedWeeklyCategorySpending.getWeekRange(), actualWeeklyCategorySpending.getWeekRange());
        }
    }

    @Test
    void testGetWeeklyCategorySpending_whenTransactionListIsNull_thenSkipTransactionCategory(){
        LocalDate weekStart = LocalDate.of(2025, 1, 1);
        LocalDate weekEnd = LocalDate.of(2025, 1, 7);
        List<TransactionsByCategory> transactionsByCategories = new ArrayList<>();
        TransactionsByCategory rentCategory = new TransactionsByCategory();
        rentCategory.setCategoryName("Rent");
        rentCategory.setTotalCategorySpending(BigDecimal.valueOf(1220));
        rentCategory.setTransactions(null);

        TransactionsByCategory groceriesCategory = new TransactionsByCategory();
        groceriesCategory.setCategoryName("Groceries");
        groceriesCategory.setTotalCategorySpending(BigDecimal.valueOf(63));
        List<Transaction> groceriesTransactions = new ArrayList<>();
        Transaction groceriesTransaction1 = new Transaction();
        groceriesTransaction1.setAmount(BigDecimal.valueOf(63));
        groceriesTransaction1.setPosted(LocalDate.of(2025, 1, 3));
        groceriesTransactions.add(groceriesTransaction1);
        groceriesCategory.setTransactions(groceriesTransactions);

        transactionsByCategories.add(rentCategory);
        transactionsByCategories.add(groceriesCategory);

        List<WeeklyCategorySpending> expected = new ArrayList<>();
        WeeklyCategorySpending weeklyCategorySpending1 = new WeeklyCategorySpending();
        weeklyCategorySpending1.setCategory("Groceries");
        weeklyCategorySpending1.setTransactions(groceriesTransactions);
        weeklyCategorySpending1.setTotalCategorySpending(BigDecimal.valueOf(63));
        weeklyCategorySpending1.setWeekRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));

        expected.add(weeklyCategorySpending1);

        List<WeeklyCategorySpending> actual = weeklyBudgetCategoryBuilderService.getWeeklyCategorySpending(weekStart, weekEnd, transactionsByCategories);
        assertNotNull(actual);
        assertEquals(1, actual.size());
        for(int i = 0; i < expected.size(); i++) {
            WeeklyCategorySpending expectedWeeklyCategorySpending = expected.get(i);
            WeeklyCategorySpending actualWeeklyCategorySpending = actual.get(i);
            assertEquals(expectedWeeklyCategorySpending.getCategory(), actualWeeklyCategorySpending.getCategory());
            assertEquals(expectedWeeklyCategorySpending.getTransactions(), actualWeeklyCategorySpending.getTransactions());
            assertEquals(expectedWeeklyCategorySpending.getTotalCategorySpending(), actualWeeklyCategorySpending.getTotalCategorySpending());
            assertEquals(expectedWeeklyCategorySpending.getWeekRange(), actualWeeklyCategorySpending.getWeekRange());
        }
    }

    @Test
    void testBuildBudgetCategoryList_whenWeeklyBudgetCategoryCriteriaListIsEmpty_thenReturnEmptyList(){
        List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = new ArrayList<>();
        List<BudgetCategory> actual = weeklyBudgetCategoryBuilderService.buildBudgetCategoryList(weeklyBudgetCategoryCriteriaList);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildBudgetCategoryList_whenWeeklyBudgetCategoryCriteriaListIsNull_thenReturnEmptyList(){
        List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = null;
        List<BudgetCategory> actual = weeklyBudgetCategoryBuilderService.buildBudgetCategoryList(weeklyBudgetCategoryCriteriaList);
        assertNotNull(actual);
    }

    @Test
    void testBuildBudgetCategoryList_whenWeeklyBudgetCategoryCriteriaNotEmpty_thenReturnBudgetCategoryList()
    {
        WeeklyBudgetCategoryCriteria weeklyBudgetCategoryCriteria1 = new WeeklyBudgetCategoryCriteria();
        weeklyBudgetCategoryCriteria1.setCategory("Rent");
        weeklyBudgetCategoryCriteria1.setSubBudget(testSubBudget);
        weeklyBudgetCategoryCriteria1.setActive(true);

        WeeklyCategorySpending rentWeeklyCategorySpending = new WeeklyCategorySpending();
        rentWeeklyCategorySpending.setCategory("Rent");
        rentWeeklyCategorySpending.setWeekRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));
        List<Transaction> rentTransactions = new ArrayList<>();
        Transaction rentTransaction1 = new Transaction();
        rentTransactions.add(rentTransaction1);
        rentTransaction1.setAmount(BigDecimal.valueOf(1220));
        rentTransaction1.setPosted(LocalDate.of(2025, 1, 3));
        rentWeeklyCategorySpending.setTransactions(rentTransactions);
        rentWeeklyCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(1220));
        weeklyBudgetCategoryCriteria1.setWeeklyCategorySpending(rentWeeklyCategorySpending);

        WeeklyBudgetCategoryCriteria weeklyBudgetCategoryCriteria2 = new WeeklyBudgetCategoryCriteria();
        weeklyBudgetCategoryCriteria2.setCategory("Groceries");
        weeklyBudgetCategoryCriteria2.setSubBudget(testSubBudget);
        weeklyBudgetCategoryCriteria2.setActive(true);

        WeeklyCategorySpending groceriesCategorySpending = new WeeklyCategorySpending();
        groceriesCategorySpending.setCategory("Groceries");
        groceriesCategorySpending.setWeekRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)));

        List<Transaction> groceriesTransactions = new ArrayList<>();
        Transaction groceriesTransaction1 = new Transaction();
        groceriesTransaction1.setAmount(BigDecimal.valueOf(63));
        groceriesTransaction1.setPosted(LocalDate.of(2025, 1, 3));
        groceriesTransactions.add(groceriesTransaction1);
        groceriesCategorySpending.setTransactions(groceriesTransactions);
        groceriesCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(63));
        weeklyBudgetCategoryCriteria2.setWeeklyCategorySpending(groceriesCategorySpending);

        List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = new ArrayList<>();
        weeklyBudgetCategoryCriteriaList.add(weeklyBudgetCategoryCriteria1);
        weeklyBudgetCategoryCriteriaList.add(weeklyBudgetCategoryCriteria2);

        List<BudgetCategory> expected = new ArrayList<>();
        BudgetCategory rentBudgetCategory = new BudgetCategory();
        rentBudgetCategory.setBudgetActual(1220.0);
        rentBudgetCategory.setBudgetedAmount(1917.0);
        rentBudgetCategory.setCategoryName("Rent");
        rentBudgetCategory.setOverSpendingAmount(0.0);
        rentBudgetCategory.setSubBudgetId(1L);
        rentBudgetCategory.setStartDate(LocalDate.of(2025, 1, 1));
        rentBudgetCategory.setEndDate(LocalDate.of(2025, 1, 7));
        rentBudgetCategory.setTransactions(rentTransactions);
        rentBudgetCategory.setIsActive(true);

        BudgetCategory groceriesBudgetCategory = new BudgetCategory();
        groceriesBudgetCategory.setBudgetActual(63.0);
        groceriesBudgetCategory.setBudgetedAmount(450.0);
        groceriesBudgetCategory.setCategoryName("Groceries");
        groceriesBudgetCategory.setOverSpendingAmount(0.0);
        groceriesBudgetCategory.setStartDate(LocalDate.of(2025, 1, 1));
        groceriesBudgetCategory.setEndDate(LocalDate.of(2025, 1, 7));
        groceriesBudgetCategory.setTransactions(groceriesTransactions);
        groceriesBudgetCategory.setIsActive(true);

        expected.add(rentBudgetCategory);
        expected.add(groceriesBudgetCategory);

        List<CategoryBudgetAmount> categoryBudgetAmountList = new ArrayList<>();
        CategoryBudgetAmount rentBudgetAmount = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1917));
        CategoryBudgetAmount groceriesBudgetAmount = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(450));
        categoryBudgetAmountList.add(rentBudgetAmount);
        categoryBudgetAmountList.add(groceriesBudgetAmount);

        Mockito.when(budgetEstimatorService.calculateBudgetCategoryAmount(testSubBudget))
                .thenReturn(categoryBudgetAmountList);

        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory("Rent", categoryBudgetAmountList))
                .thenReturn(BigDecimal.valueOf(1917));

        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory("Groceries", categoryBudgetAmountList))
                .thenReturn(BigDecimal.valueOf(450));

        List<BudgetCategory> actual = weeklyBudgetCategoryBuilderService.buildBudgetCategoryList(weeklyBudgetCategoryCriteriaList);
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++){
            BudgetCategory actualBudgetCategory = actual.get(i);
            BudgetCategory expectedBudgetCategory = expected.get(i);
            assertEquals(expectedBudgetCategory.getBudgetActual(), actualBudgetCategory.getBudgetActual());
            assertEquals(expectedBudgetCategory.getBudgetedAmount(), actualBudgetCategory.getBudgetedAmount());
            assertEquals(expectedBudgetCategory.getCategoryName(), actualBudgetCategory.getCategoryName());
            assertEquals(expectedBudgetCategory.getOverSpendingAmount(), actualBudgetCategory.getOverSpendingAmount());
            assertEquals(expectedBudgetCategory.getStartDate(), actualBudgetCategory.getStartDate());
            assertEquals(expectedBudgetCategory.getEndDate(), actualBudgetCategory.getEndDate());
            assertEquals(expectedBudgetCategory.getTransactions(), actualBudgetCategory.getTransactions());
            assertEquals(expectedBudgetCategory.getIsActive(), actualBudgetCategory.getIsActive());
        }
    }

    @Test
    void testBuildBudgetCategoryList_whenWeeklyCategorySpendingIsNull_thenReturnEmptyList(){
        WeeklyBudgetCategoryCriteria weeklyBudgetCategoryCriteria1 = new WeeklyBudgetCategoryCriteria();
        weeklyBudgetCategoryCriteria1.setCategory("Rent");
        weeklyBudgetCategoryCriteria1.setSubBudget(testSubBudget);
        weeklyBudgetCategoryCriteria1.setActive(true);
        weeklyBudgetCategoryCriteria1.setWeeklyCategorySpending(null);

        List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = new ArrayList<>();
        weeklyBudgetCategoryCriteriaList.add(weeklyBudgetCategoryCriteria1);

        List<BudgetCategory> actual = weeklyBudgetCategoryBuilderService.buildBudgetCategoryList(weeklyBudgetCategoryCriteriaList);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildBudgetCategoryList_whenDuplicateBudgetCategories_thenReturnUniqueBudgetCategories(){

    }

    @Test
    void testBuildBudgetCategoryList_whenWeeklySpendingExceedsBudgetedAmount_thenReturnOverspendingAmount(){

    }

    @Test
    void testUpdateWeeklyBudgetCategories_whenExistingBudgetCategoriesIsNull_thenReturnEmptyList(){
        List<BudgetCategory> existingBudgetCategories = null;
        List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = List.of(new WeeklyBudgetCategoryCriteria());
        List<BudgetCategory> actual = weeklyBudgetCategoryBuilderService.updateWeeklyBudgetCategories(existingBudgetCategories, weeklyBudgetCategoryCriteriaList);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateWeeklyBudgetCategories_whenExistingBudgetCategoriesIsEmpty_thenReturnEmptyList(){
        List<BudgetCategory> existingBudgetCategories = new ArrayList<>();
        List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = List.of(new WeeklyBudgetCategoryCriteria());
        List<BudgetCategory> actual = weeklyBudgetCategoryBuilderService.updateWeeklyBudgetCategories(existingBudgetCategories, weeklyBudgetCategoryCriteriaList);
        assertNotNull(actual);
    }

    @Test
    void testUpdateWeeklyBudgetCategories_whenWeeklyBudgetCategoryCriteriaListIsNull_thenReturnEmptyList(){
        List<BudgetCategory> existingBudgetCategories = new ArrayList<>();
        List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = null;
        List<BudgetCategory> actual = weeklyBudgetCategoryBuilderService.updateWeeklyBudgetCategories(existingBudgetCategories, weeklyBudgetCategoryCriteriaList);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testUpdateWeeklyBudgetCategories_whenWeeklyBudgetCategoryCriteriaListIsEmpty_thenReturnEmptyList(){
        List<BudgetCategory> existingBudgetCategories = List.of(new BudgetCategory());
        List<WeeklyBudgetCategoryCriteria> weeklyBudgetCategoryCriteriaList = new ArrayList<>();
        List<BudgetCategory> actual = weeklyBudgetCategoryBuilderService.updateWeeklyBudgetCategories(existingBudgetCategories, weeklyBudgetCategoryCriteriaList);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @AfterEach
    void tearDown() {
    }
}