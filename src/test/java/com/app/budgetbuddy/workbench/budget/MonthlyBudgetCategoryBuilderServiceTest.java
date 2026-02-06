//package com.app.budgetbuddy.workbench.budget;
//
//import com.app.budgetbuddy.domain.*;
//import com.app.budgetbuddy.exceptions.BudgetCategoryException;
//import com.app.budgetbuddy.services.BudgetCategoryService;
//import com.app.budgetbuddy.services.SubBudgetGoalsService;
//import lombok.extern.slf4j.Slf4j;
//import org.jetbrains.annotations.NotNull;
//import org.junit.jupiter.api.AfterEach;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.mockito.Mock;
//import org.mockito.Mockito;
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.boot.test.context.SpringBootTest;
//import org.springframework.boot.test.mock.mockito.MockBean;
//
//import java.math.BigDecimal;
//import java.math.RoundingMode;
//import java.time.LocalDate;
//import java.time.LocalDateTime;
//import java.util.ArrayList;
//import java.util.Collections;
//import java.util.Comparator;
//import java.util.List;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.ArgumentMatchers.eq;
//
//@SpringBootTest
//@Slf4j
//class MonthlyBudgetCategoryBuilderServiceTest
//{
//    @MockBean
//    private BudgetCategoryService budgetCategoryService;
//
//    @MockBean
//    private BudgetCalculations budgetCalculations;
//
//    @MockBean
//    private BudgetEstimatorService budgetEstimatorService;
//
//    @MockBean
//    private SubBudgetGoalsService subBudgetGoalsService;
//
//    @Autowired
//    private MonthlyBudgetCategoryBuilderService monthlyBudgetCategoryBuilderService;
//
//    private SubBudget testSubBudget;
//
//    private Budget budget;
//
//    private SubBudgetGoals subBudgetGoals;
//
//    @BeforeEach
//    void setUp() {
//        testSubBudget = new SubBudget();
//        testSubBudget.setYear(2025);
//        testSubBudget.setStartDate(LocalDate.of(2025, 4, 1));
//        testSubBudget.setEndDate(LocalDate.of(2025, 4, 30));
//        testSubBudget.setSubSavingsTarget(BigDecimal.valueOf(208));
//        testSubBudget.setSubSavingsAmount(BigDecimal.valueOf(120));
//        testSubBudget.setAllocatedAmount(BigDecimal.valueOf(3260));
//        testSubBudget.setActive(true);
//        testSubBudget.setId(4L);
//        testSubBudget.setSpentOnBudget(BigDecimal.valueOf(1603));
//
//        BudgetSchedule budgetSchedule = new BudgetSchedule();
//        budgetSchedule.setStatus("Active");
//        budgetSchedule.setPeriodType(Period.MONTHLY);
//        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 30)));
//        budgetSchedule.setSubBudgetId(testSubBudget.getId());
//        budgetSchedule.setBudgetScheduleId(4L);
//        budgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
//        budgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
//        budgetSchedule.setTotalPeriods(4);
//        budgetSchedule.setBudgetScheduleRanges(createAprilBudgetScheduleRanges());
//        testSubBudget.setBudgetSchedule(List.of(budgetSchedule));
//
//        budget = new Budget();
//        budget.setId(1L);
//        budget.setIncome(BigDecimal.valueOf(51000));
//        budget.setBudgetName("2025 Year Budget");
//        budget.setStartDate(LocalDate.of(2025, 1, 1));
//        budget.setEndDate(LocalDate.of(2025, 12, 31));
//        budget.setBudgetAmount(BigDecimal.valueOf(51000));
//        budget.setUserId(1L);
//
//        subBudgetGoals = new SubBudgetGoals();
//        subBudgetGoals.setSubBudgetId(testSubBudget.getId());
//        subBudgetGoals.setGoalId(1L);
//        subBudgetGoals.setSubBudgetId(4L);
//        subBudgetGoals.setSavingsTarget(BigDecimal.valueOf(208));
//        subBudgetGoals.setStatus(GoalStatus.IN_PROGRESS);
//        subBudgetGoals.setContributedAmount(BigDecimal.valueOf(97));
//        subBudgetGoals.setRemaining(BigDecimal.valueOf(111));
//        subBudgetGoals.setGoalScore(BigDecimal.valueOf(53.3));
//
//        testSubBudget.setBudget(budget);
//    }
//
//    @Test
//    void testGetMonthlyCategorySpending_whenCategoryTransactionsIsNull_thenReturnEmptyList(){
//        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
//        BudgetScheduleRange budgetScheduleRange = new BudgetScheduleRange();
//        budgetScheduleRanges.add(budgetScheduleRange);
//
//        List<MonthlyCategorySpending> actual = monthlyBudgetCategoryBuilderService.getCategorySpending(null, budgetScheduleRanges);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testGetMonthlyCategorySpending_whenBudgetScheduleRangeIsNull_thenReturnEmptyList(){
//        List<TransactionsByCategory> transactionsByCategory = new ArrayList<>();
//        TransactionsByCategory categoryTransaction = new TransactionsByCategory();
//        transactionsByCategory.add(categoryTransaction);
//
//        List<MonthlyCategorySpending> actual = monthlyBudgetCategoryBuilderService.getCategorySpending(transactionsByCategory, null);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testGetMonthlyCategorySpending_TransactionsByCategoryListEmpty_thenReturnEmptyList(){
//        List<TransactionsByCategory> transactionsByCategory = new ArrayList<>();
//        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
//        BudgetScheduleRange budgetScheduleRange = new BudgetScheduleRange();
//        budgetScheduleRanges.add(budgetScheduleRange);
//
//        List<MonthlyCategorySpending> actual = monthlyBudgetCategoryBuilderService.getCategorySpending(transactionsByCategory, budgetScheduleRanges);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testGetMonthlyCategorySpending_whenBudgetScheduleRangesIsEmpty_thenReturnEmptyList(){
//        List<TransactionsByCategory> transactionsByCategory = new ArrayList<>();
//        TransactionsByCategory categoryTransaction = new TransactionsByCategory();
//        transactionsByCategory.add(categoryTransaction);
//
//        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
//        List<MonthlyCategorySpending> actual = monthlyBudgetCategoryBuilderService.getCategorySpending(transactionsByCategory, budgetScheduleRanges);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testGetMonthlyCategorySpending_whenAprilCategorySpending_thenReturnCategorySpending()
//    {
//        List<TransactionsByCategory> aprilTransactionsByCategory = createAprilTransactionsByCategory();
//        List<BudgetScheduleRange> aprilBudgetScheduleRanges = createAprilBudgetScheduleRanges();
//
//        // Expected results
//        List<MonthlyCategorySpending> expectedMonthlyCategorySpending = new ArrayList<>();
//
//        // Create expected Groceries monthly spending
//        MonthlyCategorySpending groceriesSpending = new MonthlyCategorySpending();
//        groceriesSpending.setCategory("Groceries");
//        groceriesSpending.setTotalCategorySpending(BigDecimal.valueOf(457.70)); // Total of all grocery transactions
//
//        // Set up weekly transactions for groceries
//        List<Transaction> groceryTransactions = aprilTransactionsByCategory.stream()
//                .filter(ct -> "Groceries".equals(ct.getCategoryName()))
//                .findFirst()
//                .map(TransactionsByCategory::getTransactions)
//                .orElse(Collections.emptyList());
//        groceriesSpending.setTransactions(groceryTransactions);
//
//        // Set up weekly ranges for groceries
//        List<DateRangeSpending> groceryWeekRanges = new ArrayList<>();
//        groceryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 124.16));
//        groceryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 8), LocalDate.of(2025, 4, 14)), 119.64));
//        groceryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)), 94.27));
//        groceryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 28)), 51.49));
//        groceryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 29), LocalDate.of(2025, 4, 30)), 68.15));
//        groceriesSpending.setWeeklySpending(groceryWeekRanges);
//
//        expectedMonthlyCategorySpending.add(groceriesSpending);
//
//        // Create expected Rent monthly spending
//        MonthlyCategorySpending rentSpending = new MonthlyCategorySpending();
//        rentSpending.setCategory("Rent");
//        rentSpending.setTotalCategorySpending(BigDecimal.valueOf(1907.00)); // Total of all rent transactions
//
//        // Set up transactions for rent
//        List<Transaction> rentTransactions = aprilTransactionsByCategory.stream()
//                .filter(ct -> "Rent".equals(ct.getCategoryName()))
//                .findFirst()
//                .map(TransactionsByCategory::getTransactions)
//                .orElse(Collections.emptyList());
//        rentSpending.setTransactions(rentTransactions);
//
//        // Set up weekly ranges for rent
//        List<DateRangeSpending> rentWeekRanges = new ArrayList<>();
//        rentWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 1200));
//        rentWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)), 707));
//        rentSpending.setWeeklySpending(rentWeekRanges);
//
//        expectedMonthlyCategorySpending.add(rentSpending);
//
//        // Create expected Other monthly spending
//        MonthlyCategorySpending otherSpending = new MonthlyCategorySpending();
//        otherSpending.setCategory("Other");
//        otherSpending.setTotalCategorySpending(BigDecimal.valueOf(55.0)); // Total of all other transactions
//
//        // Set up transactions for other
//        List<Transaction> otherTransactions = aprilTransactionsByCategory.stream()
//                .filter(ct -> "Other".equals(ct.getCategoryName()))
//                .findFirst()
//                .map(TransactionsByCategory::getTransactions)
//                .orElse(Collections.emptyList());
//        otherSpending.setTransactions(otherTransactions);
//
//        // Set up weekly ranges for other
//        List<DateRangeSpending> otherWeekRanges = new ArrayList<>();
//        otherWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 12.84));
//        otherWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)), 35.67));
//        otherWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 28)), 6.45));
//        otherSpending.setWeeklySpending(otherWeekRanges);
//
//        expectedMonthlyCategorySpending.add(otherSpending);
//
//        // Call the method under test
//        List<MonthlyCategorySpending> actualMonthlyCategorySpending =
//                monthlyBudgetCategoryBuilderService.getCategorySpending(aprilTransactionsByCategory, aprilBudgetScheduleRanges);
//
//        // Assertions
//        assertNotNull(actualMonthlyCategorySpending);
//        assertEquals(expectedMonthlyCategorySpending.size(), actualMonthlyCategorySpending.size());
//
//        // Verify each category's monthly spending
//        for (MonthlyCategorySpending expectedSpending : expectedMonthlyCategorySpending) {
//            String categoryName = expectedSpending.getCategory();
//            MonthlyCategorySpending actualSpending = actualMonthlyCategorySpending.stream()
//                    .filter(spending -> expectedSpending.getCategory().equals(spending.getCategory()))
//                    .findFirst()
//                    .orElse(null);
//
//            assertNotNull(actualSpending, "Could not find spending for category: " + expectedSpending.getCategory());
//
//            // Check category and total spending amount
//            assertEquals(expectedSpending.getCategory(), actualSpending.getCategory(), "Category name should match for " + categoryName);
//            assertEquals(expectedSpending.getTotalCategorySpending().setScale(1, RoundingMode.HALF_UP),
//                    actualSpending.getTotalCategorySpending().setScale(1, RoundingMode.HALF_UP), "Total spending amount should match for category " + categoryName);
//
//            // Check transactions
//            assertEquals(expectedSpending.getTransactions().size(), actualSpending.getTransactions().size());
//
//            assertEquals(expectedSpending.getWeeklySpending().size(), actualSpending.getWeeklySpending().size(),
//                    "Number of week ranges should match for category " + categoryName +
//                            " (Expected: " + expectedSpending.getWeeklySpending().size() +
//                            ", Actual: " + actualSpending.getWeeklySpending().size() + ")");
//        }
//    }
//
//    @Test
//    void testGetMonthlyCategorySpending_whenGroceryTransactionListIsEmpty_thenSkipAndReturnOtherMonthlyCategorySpending()
//    {
//        List<TransactionsByCategory> transactionsByCategory = createAprilTransactionsByCategoryWithCategoryAndNoTransactions();
//        List<BudgetScheduleRange> budgetScheduleRanges = createAprilBudgetScheduleRanges();
//
//        List<MonthlyCategorySpending> expected = new ArrayList<>();
//
//        MonthlyCategorySpending otherCategorySpending = new MonthlyCategorySpending();
//        otherCategorySpending.setCategory("Other");
//        otherCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(55.0));
//        List<Transaction> otherTransactions = transactionsByCategory.stream()
//                .filter(ct -> "Other".equals(ct.getCategoryName()))
//                .findFirst()
//                .map(TransactionsByCategory::getTransactions)
//                .orElse(Collections.emptyList());
//       otherCategorySpending.setTransactions(otherTransactions);
//
//       List<DateRangeSpending> otherCategoryWeekRanges = new ArrayList<>();
//       otherCategoryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 12.84));
//       otherCategoryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)), 35.70));
//       otherCategoryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 28)), 6.45));
//       otherCategorySpending.setWeeklySpending(otherCategoryWeekRanges);
//
//       MonthlyCategorySpending rentCategorySpending = new MonthlyCategorySpending();
//       rentCategorySpending.setCategory("Rent");
//       rentCategorySpending.setTotalCategorySpending(BigDecimal.valueOf(1907.0));
//        List<Transaction> rentTransactions = transactionsByCategory.stream()
//                .filter(ct -> "Rent".equals(ct.getCategoryName()))
//                .findFirst()
//                .map(TransactionsByCategory::getTransactions)
//                .orElse(Collections.emptyList());
//       rentCategorySpending.setTransactions(rentTransactions);
//
//       List<DateRangeSpending> rentCategoryWeekRanges = new ArrayList<>();
//       rentCategoryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 1200));
//       rentCategoryWeekRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)), 707));
//       rentCategorySpending.setWeeklySpending(rentCategoryWeekRanges);
//
//       expected.add(otherCategorySpending);
//       expected.add(rentCategorySpending);
//
//       List<MonthlyCategorySpending> actual = monthlyBudgetCategoryBuilderService.getCategorySpending(transactionsByCategory, budgetScheduleRanges);
//       assertNotNull(actual);
//       for(int i = 0; i < expected.size(); i++) {
//           MonthlyCategorySpending actualSpending = actual.get(i);
//           MonthlyCategorySpending expectedSpending = expected.get(i);
//           assertNotNull(actualSpending, "Could not find spending for category: " + expectedSpending.getCategory());
//           assertEquals(expectedSpending.getCategory(), actualSpending.getCategory(), "Category name should match for " + expectedSpending.getCategory());
//           assertEquals(expectedSpending.getTotalCategorySpending(), actualSpending.getTotalCategorySpending(), "Total spending amount should match for category " + expectedSpending.getCategory());
//           assertEquals(expectedSpending.getTransactions().size(), actualSpending.getTransactions().size());
//           assertEquals(expectedSpending.getWeeklySpending().size(), actualSpending.getWeeklySpending().size());
//       }
//    }
//
//    @Test
//    void testGetMonthlyCategorySpending_whenNegativeSpendingForCategory_thenThrowException(){
//
//    }
//
//    @Test
//    void testBuildBudgetCategoryList_whenMonthlyBudgetCategoryCriteriaIsNull_thenReturnEmptyList(){
//        List<BudgetCategory> actual = monthlyBudgetCategoryBuilderService.buildBudgetCategoryList(null);
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testBuildBudgetCategoryList_whenMonthlyBudgetCategoryCriteriaIsEmpty_thenReturnEmptyList(){
//        List<BudgetCategory> actual = monthlyBudgetCategoryBuilderService.buildBudgetCategoryList(new ArrayList<>());
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testBuildBudgetCategoryList_whenAprilMonthlyBudgetCategoryCriteriaIsValid_thenReturnAprilBudgetCategories()
//    {
//        SubBudget aprilSubBudget = testSubBudget;
//        List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteria = createMonthlyBudgetCriteriaForApril(aprilSubBudget);
//
//        CategoryBudgetAmount[] mockCategoryBudgetAmounts = new CategoryBudgetAmount[2];
//        mockCategoryBudgetAmounts[0] = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1907.00));
//        mockCategoryBudgetAmounts[1] = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(125.00));
//
//        Mockito.when(budgetEstimatorService.calculateBudgetCategoryAmount(eq(aprilSubBudget)))
//                .thenReturn(mockCategoryBudgetAmounts);
//
//        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory(eq("Rent"), any(CategoryBudgetAmount[].class)))
//                .thenReturn(BigDecimal.valueOf(1907.00));
//
//        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory(eq("Groceries"), any(CategoryBudgetAmount[].class)))
//                .thenReturn(BigDecimal.valueOf(125.00));
//
//        List<BudgetCategory> expected = new ArrayList<>();
//        expected.addAll(createGroceryBudgetCategoriesForApril(aprilSubBudget));
//        expected.addAll(createRentBudgetCategoriesForApril(aprilSubBudget));
//
//        List<BudgetCategory> actual = monthlyBudgetCategoryBuilderService.buildBudgetCategoryList(monthlyBudgetCategoryCriteria);
//
//        // Sort both lists by category name and start date for consistent comparison
//        Comparator<BudgetCategory> comparator =
//                Comparator.comparing(BudgetCategory::getCategoryName)
//                        .thenComparing(BudgetCategory::getStartDate);
//
//        expected.sort(comparator);
//        actual.sort(comparator);
//
//        assertNotNull(actual);
//        assertEquals(expected.size(), actual.size());
//        for(int i = 0; i < expected.size(); i++) {
//            BudgetCategory actualCategory = actual.get(i);
//            BudgetCategory expectedCategory = expected.get(i);
//            assertNotNull(actualCategory, "Could not find spending for category: " + expectedCategory);
//            assertEquals(expected.get(i).getSubBudgetId(), actualCategory.getSubBudgetId());
//            assertEquals(expected.get(i).getBudgetActual(), actualCategory.getBudgetActual(), "Budget actual should match for category " + expectedCategory);
//            assertEquals(expected.get(i).getBudgetedAmount(), actualCategory.getBudgetedAmount(), "Budget amount should match for category " + expectedCategory);
//            assertEquals(expected.get(i).getIsActive(), actualCategory.getIsActive(), "Active should match for category " + expectedCategory);
//            assertEquals(expected.get(i).getStartDate(), actualCategory.getStartDate(), "Start date should match for category " + expectedCategory);
//            assertEquals(expected.get(i).getId(), actualCategory.getId(), "Id should match for category " + expectedCategory);
//            assertEquals(expected.get(i).getTransactions().size(), actualCategory.getTransactions().size(), "Transaction count should match for category " + expectedCategory);
//            assertEquals(expected.get(i).getCategoryName(), actualCategory.getCategoryName(), "Category name should match for category " + expectedCategory);
//            assertEquals(expected.get(i).getOverSpendingAmount(), actualCategory.getOverSpendingAmount());
//        }
//    }
//
//    @Test
//    void testUpdateBudgetCategories_whenMonthlyBudgetCategoryCriteriaIsNull_thenReturnEmptyList(){
//        List<BudgetCategory> budgetCategories = new ArrayList<>();
//        BudgetCategory budgetCategory = new BudgetCategory();
//        budgetCategories.add(budgetCategory);
//
//        List<BudgetCategory> actual = monthlyBudgetCategoryBuilderService.updateBudgetCategories(null, budgetCategories);
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testUpdateBudgetCategories_whenExistingBudgetCategoriesIsNull_thenThrowException(){
//        List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteriaList = new ArrayList<>();
//        MonthlyBudgetCategoryCriteria monthlyBudgetCategoryCriteria = new MonthlyBudgetCategoryCriteria();
//        monthlyBudgetCategoryCriteriaList.add(monthlyBudgetCategoryCriteria);
//
//        List<BudgetCategory> actual = monthlyBudgetCategoryBuilderService.updateBudgetCategories(monthlyBudgetCategoryCriteriaList, null);
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testUpdateBudgetCategories_whenUpdatedGroceriesAndOtherBudgetCategories_thenReturnUpdateBudgetCategories() {
//        // Create existing budget categories
//        List<BudgetCategory> existingBudgetCategories = new ArrayList<>();
//
//        // Existing Groceries category
//        BudgetCategory existingGroceriesCategory = new BudgetCategory();
//        existingGroceriesCategory.setId(1L);
//        existingGroceriesCategory.setCategoryName("Groceries");
//        existingGroceriesCategory.setBudgetedAmount(125.00);
//        existingGroceriesCategory.setBudgetActual(80.50);
//        existingGroceriesCategory.setStartDate(LocalDate.of(2025, 4, 1));
//        existingGroceriesCategory.setEndDate(LocalDate.of(2025, 4, 7));
//        existingGroceriesCategory.setSubBudgetId(testSubBudget.getId());
//        existingGroceriesCategory.setIsActive(true);
//        existingGroceriesCategory.setOverSpent(false);
//        existingGroceriesCategory.setOverSpendingAmount(0.0);
//
//        Transaction oldGroceryTransaction = new Transaction();
//        oldGroceryTransaction.setAmount(BigDecimal.valueOf(80.50));
//        oldGroceryTransaction.setTransactionId("grocery123");
//        oldGroceryTransaction.setPosted(LocalDate.of(2025, 4, 3));
//        existingGroceriesCategory.setTransactions(List.of(oldGroceryTransaction));
//
//        existingBudgetCategories.add(existingGroceriesCategory);
//
//        // Existing Other category
//        BudgetCategory existingOtherCategory = new BudgetCategory();
//        existingOtherCategory.setId(2L);
//        existingOtherCategory.setCategoryName("Other");
//        existingOtherCategory.setBudgetedAmount(50.00);
//        existingOtherCategory.setBudgetActual(25.75);
//        existingOtherCategory.setStartDate(LocalDate.of(2025, 4, 1));
//        existingOtherCategory.setEndDate(LocalDate.of(2025, 4, 7));
//        existingOtherCategory.setSubBudgetId(testSubBudget.getId());
//        existingOtherCategory.setIsActive(true);
//        existingOtherCategory.setOverSpent(false);
//        existingOtherCategory.setOverSpendingAmount(0.0);
//
//        Transaction oldOtherTransaction = new Transaction();
//        oldOtherTransaction.setAmount(BigDecimal.valueOf(25.75));
//        oldOtherTransaction.setTransactionId("other123");
//        oldOtherTransaction.setPosted(LocalDate.of(2025, 4, 2));
//        existingOtherCategory.setTransactions(List.of(oldOtherTransaction));
//
//        existingBudgetCategories.add(existingOtherCategory);
//
//        // Existing Rent category (shouldn't be updated)
//        BudgetCategory existingRentCategory = new BudgetCategory();
//        existingRentCategory.setId(3L);
//        existingRentCategory.setCategoryName("Rent");
//        existingRentCategory.setBudgetedAmount(1200.00);
//        existingRentCategory.setBudgetActual(1200.00);
//        existingRentCategory.setStartDate(LocalDate.of(2025, 4, 1));
//        existingRentCategory.setEndDate(LocalDate.of(2025, 4, 30));
//        existingRentCategory.setSubBudgetId(testSubBudget.getId());
//        existingRentCategory.setIsActive(true);
//        existingRentCategory.setOverSpent(false);
//        existingRentCategory.setOverSpendingAmount(0.0);
//
//        Transaction oldRentTransaction = new Transaction();
//        oldRentTransaction.setAmount(BigDecimal.valueOf(1200.00));
//        oldRentTransaction.setTransactionId("rent123");
//        oldRentTransaction.setPosted(LocalDate.of(2025, 4, 1));
//        existingRentCategory.setTransactions(List.of(oldRentTransaction));
//
//        existingBudgetCategories.add(existingRentCategory);
//
//        // Create updated data (MonthlyBudgetCategoryCriteria)
//        List<MonthlyBudgetCategoryCriteria> updateCriteria = new ArrayList<>();
//
//        // Updated Groceries criteria
//        MonthlyBudgetCategoryCriteria groceriesCriteria = new MonthlyBudgetCategoryCriteria();
//        groceriesCriteria.setCategory("Groceries");
//        groceriesCriteria.setSubBudget(testSubBudget);
//        groceriesCriteria.setActive(true);
//
//        MonthlyCategorySpending grocerySpending = new MonthlyCategorySpending();
//        grocerySpending.setCategory("Groceries");
//        grocerySpending.setTotalCategorySpending(BigDecimal.valueOf(124.16));
//
//        Transaction newGroceryTransaction1 = new Transaction();
//        newGroceryTransaction1.setAmount(BigDecimal.valueOf(80.50));
//        newGroceryTransaction1.setTransactionId("grocery123");
//        newGroceryTransaction1.setPosted(LocalDate.of(2025, 4, 3));
//
//        Transaction newGroceryTransaction2 = new Transaction();
//        newGroceryTransaction2.setAmount(BigDecimal.valueOf(43.66));
//        newGroceryTransaction2.setTransactionId("grocery456");
//        newGroceryTransaction2.setPosted(LocalDate.of(2025, 4, 5));
//
//        grocerySpending.setTransactions(List.of(newGroceryTransaction1, newGroceryTransaction2));
//
//        List<DateRangeSpending> groceryDateRanges = new ArrayList<>();
//        groceryDateRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 124.16));
//        grocerySpending.setWeeklySpending(groceryDateRanges);
//
//        groceriesCriteria.setMonthlyCategorySpending(grocerySpending);
//        updateCriteria.add(groceriesCriteria);
//
//        // Updated Other criteria
//        MonthlyBudgetCategoryCriteria otherCriteria = new MonthlyBudgetCategoryCriteria();
//        otherCriteria.setCategory("Other");
//        otherCriteria.setSubBudget(testSubBudget);
//        otherCriteria.setActive(true);
//
//        MonthlyCategorySpending otherSpending = new MonthlyCategorySpending();
//        otherSpending.setCategory("Other");
//        otherSpending.setTotalCategorySpending(BigDecimal.valueOf(35.95));
//
//        Transaction newOtherTransaction1 = new Transaction();
//        newOtherTransaction1.setAmount(BigDecimal.valueOf(25.75));
//        newOtherTransaction1.setTransactionId("other123");
//        newOtherTransaction1.setPosted(LocalDate.of(2025, 4, 2));
//
//        Transaction newOtherTransaction2 = new Transaction();
//        newOtherTransaction2.setAmount(BigDecimal.valueOf(10.20));
//        newOtherTransaction2.setTransactionId("other456");
//        newOtherTransaction2.setPosted(LocalDate.of(2025, 4, 6));
//
//        otherSpending.setTransactions(List.of(newOtherTransaction1, newOtherTransaction2));
//
//        List<DateRangeSpending> otherDateRanges = new ArrayList<>();
//        otherDateRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 35.95));
//        otherSpending.setWeeklySpending(otherDateRanges);
//
//        otherCriteria.setMonthlyCategorySpending(otherSpending);
//        updateCriteria.add(otherCriteria);
//
//        // Mock the budget estimator service
//        CategoryBudgetAmount[] mockCategoryBudgetAmounts = new CategoryBudgetAmount[3];
//        mockCategoryBudgetAmounts[0] = new CategoryBudgetAmount("Groceries", BigDecimal.valueOf(125.00));
//        mockCategoryBudgetAmounts[1] = new CategoryBudgetAmount("Other", BigDecimal.valueOf(50.00));
//        mockCategoryBudgetAmounts[2] = new CategoryBudgetAmount("Rent", BigDecimal.valueOf(1200.00));
//
//        Mockito.when(budgetEstimatorService.calculateBudgetCategoryAmount(eq(testSubBudget)))
//                .thenReturn(mockCategoryBudgetAmounts);
//
//        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory(eq("Groceries"), any(CategoryBudgetAmount[].class)))
//                .thenReturn(BigDecimal.valueOf(125.00));
//
//        Mockito.when(budgetEstimatorService.getBudgetCategoryAmountByCategory(eq("Other"), any(CategoryBudgetAmount[].class)))
//                .thenReturn(BigDecimal.valueOf(50.00));
//
//        // Expected updated categories
//        List<BudgetCategory> expectedUpdated = new ArrayList<>();
//
//        // Expected updated Groceries
//        BudgetCategory updatedGroceriesCategory = new BudgetCategory();
//        updatedGroceriesCategory.setId(1L);
//        updatedGroceriesCategory.setCategoryName("Groceries");
//        updatedGroceriesCategory.setBudgetedAmount(125.00);
//        updatedGroceriesCategory.setBudgetActual(204.66);
//        updatedGroceriesCategory.setStartDate(LocalDate.of(2025, 4, 1));
//        updatedGroceriesCategory.setEndDate(LocalDate.of(2025, 4, 7));
//        updatedGroceriesCategory.setSubBudgetId(testSubBudget.getId());
//        updatedGroceriesCategory.setIsActive(true);
//        updatedGroceriesCategory.setOverSpent(true);
//        updatedGroceriesCategory.setOverSpendingAmount(79.0);
//        updatedGroceriesCategory.setTransactions(List.of(newGroceryTransaction1, newGroceryTransaction2));
//
//        expectedUpdated.add(updatedGroceriesCategory);
//
//        // Expected updated Other
//        BudgetCategory updatedOtherCategory = new BudgetCategory();
//        updatedOtherCategory.setId(2L);
//        updatedOtherCategory.setCategoryName("Other");
//        updatedOtherCategory.setBudgetedAmount(50.00);
//        updatedOtherCategory.setBudgetActual(61.7);
//        updatedOtherCategory.setStartDate(LocalDate.of(2025, 4, 1));
//        updatedOtherCategory.setEndDate(LocalDate.of(2025, 4, 7));
//        updatedOtherCategory.setSubBudgetId(testSubBudget.getId());
//        updatedOtherCategory.setIsActive(true);
//        updatedOtherCategory.setOverSpent(true);
//        updatedOtherCategory.setOverSpendingAmount(11.7);
//        updatedOtherCategory.setTransactions(List.of(newOtherTransaction1, newOtherTransaction2));
//
//        expectedUpdated.add(updatedOtherCategory);
//
//        // Call the method under test
//        List<BudgetCategory> actualUpdated = monthlyBudgetCategoryBuilderService.updateBudgetCategories(updateCriteria, existingBudgetCategories);
//
//        // Assertions
//        assertNotNull(actualUpdated);
//        assertEquals(expectedUpdated.size(), actualUpdated.size(), "Should return 2 updated categories");
//
//        // Sort for consistent comparison
//        expectedUpdated.sort(Comparator.comparing(BudgetCategory::getCategoryName));
//        actualUpdated.sort(Comparator.comparing(BudgetCategory::getCategoryName));
//
//        // Compare each updated category
//        for (int i = 0; i < expectedUpdated.size(); i++) {
//            BudgetCategory expected = expectedUpdated.get(i);
//            BudgetCategory actual = actualUpdated.get(i);
//
//            assertEquals(expected.getId(), actual.getId(), "ID should match");
//            assertEquals(expected.getCategoryName(), actual.getCategoryName(), "Category name should match");
//            assertEquals(expected.getBudgetedAmount(), actual.getBudgetedAmount(), "Budgeted amount should match");
//            assertEquals(expected.getBudgetActual(), actual.getBudgetActual(), "Budget actual should match");
//            assertEquals(expected.getStartDate(), actual.getStartDate(), "Start date should match");
//            assertEquals(expected.getEndDate(), actual.getEndDate(), "End date should match");
//            assertEquals(expected.getSubBudgetId(), actual.getSubBudgetId(), "SubBudget ID should match");
//            assertEquals(expected.getIsActive(), actual.getIsActive(), "Active status should match");
//
//            // Check that transactions were updated
//            assertNotNull(actual.getTransactions(), "Transactions should not be null");
//            assertEquals(expected.getTransactions().size(), actual.getTransactions().size(),
//                    "Transaction count should match for " + expected.getCategoryName());
//
//            // Verify the Rent category was not included in the updated list
//            assertFalse(actualUpdated.stream()
//                            .anyMatch(bc -> "Rent".equals(bc.getCategoryName())),
//                    "Rent category should not be included in the updated list");
//        }
//    }
//
//    @Test
//    void testCreateMonthlyCategoryBudgetCriteriaList_whenSubBudgetIsNull_thenReturnEmptyList()
//    {
//        List<MonthlyCategorySpending> monthlyCategorySpending = new ArrayList<>();
//        MonthlyCategorySpending monthlyCategorySpending1 = new MonthlyCategorySpending();
//        monthlyCategorySpending.add(monthlyCategorySpending1);
//
//        List<MonthlyBudgetCategoryCriteria> actual = monthlyBudgetCategoryBuilderService.createCategoryBudgetCriteriaList(null, monthlyCategorySpending, subBudgetGoals);
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testCreateMonthlyCategoryBudgetCriteriaList_whenMonthlyCategorySpendingIsNull_thenReturnEmptyList()
//    {
//        SubBudget subBudget = testSubBudget;
//        List<MonthlyBudgetCategoryCriteria> actual = monthlyBudgetCategoryBuilderService.createCategoryBudgetCriteriaList(subBudget, null, subBudgetGoals);
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testCreateMonthlyCategoryBudgetCriteriaList_whenSubBudgetGoalsIsNull_thenReturnEmptyList()
//    {
//        SubBudget subBudget = testSubBudget;
//        List<MonthlyCategorySpending> monthlyCategorySpending = new ArrayList<>();
//        MonthlyCategorySpending monthlyCategorySpending1 = new MonthlyCategorySpending();
//        monthlyCategorySpending.add(monthlyCategorySpending1);
//        List<MonthlyBudgetCategoryCriteria> actual = monthlyBudgetCategoryBuilderService.createCategoryBudgetCriteriaList(subBudget, monthlyCategorySpending, null);
//        assertNotNull(actual);
//        assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testCreateMonthlyCategoryBudgetCriteriaList_whenValidData_thenReturnMonthlyBudgetCategoryCriteria()
//    {
//        SubBudget subBudget = testSubBudget;
//        List<MonthlyCategorySpending> monthlyCategorySpending = new ArrayList<>();
//
//        MonthlyCategorySpending grocerySpending = new MonthlyCategorySpending();
//        grocerySpending.setCategory("Groceries");
//        grocerySpending.setTotalCategorySpending(BigDecimal.valueOf(500.00));
//        List<Transaction> transactions = getAprilGroceriesTransactions();
//        grocerySpending.setTransactions(transactions);
//        List<DateRangeSpending> groceryWeekly = new ArrayList<>();
//        groceryWeekly.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 120.00));
//        groceryWeekly.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 8), LocalDate.of(2025, 4, 14)), 150.00));
//        groceryWeekly.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)), 130.00));
//        groceryWeekly.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 30)), 100.00));
//        grocerySpending.setWeeklySpending(groceryWeekly);
//        monthlyCategorySpending.add(grocerySpending);
//
//        MonthlyCategorySpending rentSpending = new MonthlyCategorySpending();
//        rentSpending.setCategory("Rent");
//        rentSpending.setTotalCategorySpending(BigDecimal.valueOf(1907.00));
//        List<Transaction> rentTransactions = getRentTransactionsForApril();
//        rentSpending.setTransactions(rentTransactions);
//        List<DateRangeSpending> rentWeekly = new ArrayList<>();
//        rentWeekly.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 1200.00));
//        rentWeekly.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)), 707.00));
//        rentSpending.setWeeklySpending(rentWeekly);
//        monthlyCategorySpending.add(rentSpending);
//
//        List<MonthlyBudgetCategoryCriteria> expected = new ArrayList<>();
//        MonthlyBudgetCategoryCriteria groceryBudgetCategoryCriteria = new MonthlyBudgetCategoryCriteria();
//        groceryBudgetCategoryCriteria.setCategory("Groceries");
//        groceryBudgetCategoryCriteria.setSubBudget(testSubBudget);
//        groceryBudgetCategoryCriteria.setActive(true);
//        groceryBudgetCategoryCriteria.setMonthlyCategorySpending(grocerySpending);
//        expected.add(groceryBudgetCategoryCriteria);
//
//        MonthlyBudgetCategoryCriteria rentBudgetCategoryCriteria = new MonthlyBudgetCategoryCriteria();
//        rentBudgetCategoryCriteria.setCategory("Rent");
//        rentBudgetCategoryCriteria.setSubBudget(testSubBudget);
//        rentBudgetCategoryCriteria.setActive(true);
//        rentBudgetCategoryCriteria.setMonthlyCategorySpending(rentSpending);
//        expected.add(rentBudgetCategoryCriteria);
//
//        List<MonthlyBudgetCategoryCriteria> actual = monthlyBudgetCategoryBuilderService.createCategoryBudgetCriteriaList(subBudget, monthlyCategorySpending, subBudgetGoals);
//        assertNotNull(actual);
//        assertEquals(expected.size(), actual.size());
//        expected.sort(Comparator.comparing(MonthlyBudgetCategoryCriteria::getCategory));
//        actual.sort(Comparator.comparing(MonthlyBudgetCategoryCriteria::getCategory));
//        // Compare each MonthlyBudgetCategoryCriteria
//        for (int i = 0; i < expected.size(); i++) {
//            MonthlyBudgetCategoryCriteria expectedCriteria = expected.get(i);
//            MonthlyBudgetCategoryCriteria actualCriteria = actual.get(i);
//
//            assertEquals(expectedCriteria.getCategory(), actualCriteria.getCategory(), "Category name should match");
//            assertEquals(expectedCriteria.isActive(), actualCriteria.isActive(), "Active status should match");
//            assertSame(expectedCriteria.getSubBudget(), actualCriteria.getSubBudget(), "SubBudget should be the same instance");
//
//            // Verify MonthlyCategorySpending
//            MonthlyCategorySpending expectedSpending = expectedCriteria.getMonthlyCategorySpending();
//            MonthlyCategorySpending actualSpending = actualCriteria.getMonthlyCategorySpending();
//
//            assertEquals(expectedSpending.getCategory(), actualSpending.getCategory(), "Category name in spending should match");
//            assertEquals(expectedSpending.getTotalCategorySpending(), actualSpending.getTotalCategorySpending(),
//                    "Total spending should match");
//            assertEquals(expectedSpending.getWeeklySpending().size(), actualSpending.getWeeklySpending().size(),
//                    "Weekly spending count should match");
//            assertEquals(expectedSpending.getTransactions().size(), actualSpending.getTransactions().size(),
//                    "Transaction count should match");
//        }
//    }
//
//    @Test
//    void testInitializeBudgetCategories_whenAprilSubBudget_thenReturnBudgetCategories(){
//        SubBudget subBudget = testSubBudget;
//        List<TransactionsByCategory> categoryTransactions = createAprilTransactionsByCategoryGroceriesAndRent();
//
//        List<BudgetCategory> expected = new ArrayList<>();
//        expected.addAll(createGroceryBudgetCategoriesForApril(subBudget));
//        expected.addAll(createRentBudgetCategoriesForApril(subBudget));
//
//        List<BudgetCategory> actual = monthlyBudgetCategoryBuilderService.initializeBudgetCategories(subBudget, categoryTransactions);
//        assertNotNull(actual);
//        assertEquals(expected.size(), actual.size());
//        for(int i = 0; i < expected.size(); i++) {
//            BudgetCategory expectedCategory = expected.get(i);
//            BudgetCategory actualCategory = actual.get(i);
//            assertEquals(expectedCategory.getCategoryName(), actualCategory.getCategoryName(), "Category name should match");
//            assertEquals(expectedCategory.getBudgetedAmount(), actualCategory.getBudgetedAmount(), "Budgeted amount should match");
//            assertEquals(expectedCategory.getBudgetActual(), actualCategory.getBudgetActual(), "Budget actual should match");
//            assertEquals(expectedCategory.getSubBudgetId(), actualCategory.getSubBudgetId(), "SubBudget id should match");
//            assertEquals(expectedCategory.getId(), actualCategory.getId(), "Id should match");
//            assertEquals(expectedCategory.getStartDate(), actualCategory.getStartDate(), "Start date should match");
//            assertEquals(expectedCategory.getEndDate(), actualCategory.getEndDate(), "End date should match");
//            assertEquals(expectedCategory.getIsActive(), actualCategory.getIsActive(), "Active status should match");
//            assertEquals(expectedCategory.getTransactions(), actualCategory.getTransactions(), "Transaction count should match");
//            assertEquals(expectedCategory.getOverSpendingAmount(), actualCategory.getOverSpendingAmount(), "Over spending amount should match");
//        }
//
//    }
//
//    private List<TransactionsByCategory> createAprilTransactionsByCategoryGroceriesAndRent(){
//        List<TransactionsByCategory> transactionsByCategory = new ArrayList<>();
//
//        // Grocery transactions for the entire month
//        TransactionsByCategory groceryCategoryTransaction = new TransactionsByCategory();
//        groceryCategoryTransaction.setCategoryName("Groceries");
//
//        List<Transaction> groceryTransactions = getAprilGroceriesTransactions();
//
//        groceryCategoryTransaction.setTransactions(groceryTransactions);
//
//        // Rent transactions (1st and 16th of the month)
//        TransactionsByCategory rentCategoryTransaction = new TransactionsByCategory();
//        rentCategoryTransaction.setCategoryName("Rent");
//
//        List<Transaction> rentTransactions = getRentTransactionsForApril();
//        rentCategoryTransaction.setTransactions(rentTransactions);
//
//        // Add all category transactions to the list
//        transactionsByCategory.add(groceryCategoryTransaction);
//        transactionsByCategory.add(rentCategoryTransaction);
//
//        return transactionsByCategory;
//    }
//
//    private Transaction createGroceryTransaction(BigDecimal amount, LocalDate date)
//    {
//        Transaction transaction = new Transaction();
//        transaction.setAmount(amount);
//        transaction.setDate(date);
//        transaction.setTransactionId("e55555555555");
//        transaction.setPosted(date);
//        transaction.setMerchantName("Winco Foods");
//        transaction.setDescription("PIN PURCHASE WINCO FOODS");
//        transaction.setPending(false);
//        return transaction;
//    }
//
//    private Transaction createRentTransactionWithDate(BigDecimal amount, LocalDate date)
//    {
//        Transaction transaction = new Transaction();
//        transaction.setAmount(amount);
//        transaction.setTransactionId("e2e2e2e2e2");
//        transaction.setPosted(date);
//        transaction.setMerchantName("Flex Finance");
//        transaction.setPending(false);
//        transaction.setAuthorizedDate(date);
//        transaction.setDescription("Purchase FLEX FINANCE");
////        transaction.setCategories(List.of("Financial", "Service"));
//        transaction.setAccountId("vBbQarwL0Yu8YD8EjxOMFNN0LwQ16LCkg0Roo");
//        return transaction;
//    }
//
//    private Transaction createRentTransaction(BigDecimal amount)
//    {
//        Transaction transaction = new Transaction();
//        transaction.setAmount(amount);
//        transaction.setTransactionId("e2e2e2e2e2");
//        transaction.setPosted(LocalDate.of(2025, 4, 16));
//        transaction.setMerchantName("Flex Finance");
//        transaction.setPending(false);
//        transaction.setAuthorizedDate(LocalDate.of(2025, 4, 16));
//        transaction.setDescription("Purchase FLEX FINANCE");
////        transaction.setCategories(List.of("Financial", "Service"));
//        transaction.setAccountId("vBbQarwL0Yu8YD8EjxOMFNN0LwQ16LCkg0Roo");
//        return transaction;
//    }
//
//    private List<BudgetCategory> createRentBudgetCategoriesForApril(SubBudget aprilSubBudget)
//    {
//        List<BudgetCategory> expected = new ArrayList<>();
//        BudgetCategory rentWeek1 = new BudgetCategory();
//        rentWeek1.setIsActive(true);
//        rentWeek1.setOverSpent(false);
//        rentWeek1.setStartDate(LocalDate.of(2025, 4, 1));
//        rentWeek1.setEndDate(LocalDate.of(2025, 4, 7));
//        rentWeek1.setCategoryName("Rent");
//        rentWeek1.setSubBudgetId(aprilSubBudget.getId());
//        rentWeek1.setBudgetActual(1200.0);
//        rentWeek1.setBudgetedAmount(1907.0);
//        rentWeek1.setOverSpendingAmount(0.0);
//        rentWeek1.setTransactions(List.of(createRentTransactionWithDate(BigDecimal.valueOf(1200), LocalDate.of(2025, 4, 1))));
//        expected.add(rentWeek1);
//
//        BudgetCategory rentWeek2 = new BudgetCategory();
//        rentWeek2.setIsActive(true);
//        rentWeek2.setOverSpent(false);
//        rentWeek2.setStartDate(LocalDate.of(2025, 4, 15));
//        rentWeek2.setEndDate(LocalDate.of(2025, 4, 21));
//        rentWeek2.setCategoryName("Rent");
//        rentWeek2.setSubBudgetId(aprilSubBudget.getId());
//        rentWeek2.setBudgetActual(707.0);
//        rentWeek2.setBudgetedAmount(1907.0);
//        rentWeek2.setOverSpendingAmount(0.0);
//        rentWeek2.setTransactions(List.of(createRentTransactionWithDate(BigDecimal.valueOf(707), LocalDate.of(2025, 4, 16))));
//        expected.add(rentWeek2);
//        return expected;
//    }
//
//    private List<BudgetCategory> createGroceryBudgetCategoriesForApril(SubBudget aprilSubBudget)
//    {
//        List<BudgetCategory> expected = new ArrayList<>();
//        // Week 1: April 1-7
//        BudgetCategory groceryWeek1 = new BudgetCategory();
//        groceryWeek1.setIsActive(true);
//        groceryWeek1.setOverSpendingAmount(0.0);
//        groceryWeek1.setStartDate(LocalDate.of(2025, 4, 1));
//        groceryWeek1.setEndDate(LocalDate.of(2025, 4, 7));
//        groceryWeek1.setCategoryName("Groceries");
//        groceryWeek1.setSubBudgetId(aprilSubBudget.getId());
//        groceryWeek1.setBudgetActual(124.16);
//        groceryWeek1.setBudgetedAmount(125.00);
//        groceryWeek1.setOverSpendingAmount(0.0);
//        Transaction wincoTransaction1 = new Transaction();
//        wincoTransaction1.setTransactionId("e11112345");
////        wincoTransaction1.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        wincoTransaction1.setDescription("PIN Purchase WINCO FOODS");
//        wincoTransaction1.setMerchantName("Winco Foods");
//        wincoTransaction1.setName("Winco Foods");
//        wincoTransaction1.setPending(false);
//        wincoTransaction1.setPosted(LocalDate.of(2025, 4, 2));
//        wincoTransaction1.setAmount(BigDecimal.valueOf(45.84));
//        Transaction targetTransaction = new Transaction();
//        targetTransaction.setTransactionId("e22223456");
////        targetTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        targetTransaction.setDescription("Purchase TARGET STORES");
//        targetTransaction.setMerchantName("Target");
//        targetTransaction.setName("Target");
//        targetTransaction.setPending(false);
//        targetTransaction.setPosted(LocalDate.of(2025, 4, 5));
//        targetTransaction.setAmount(BigDecimal.valueOf(78.32));
//        groceryWeek1.setTransactions(List.of(wincoTransaction1, targetTransaction));
//        expected.add(groceryWeek1);
//
//        // Week 2: April 8-14
//        BudgetCategory groceryWeek2 = new BudgetCategory();
//        groceryWeek2.setIsActive(true);
//        groceryWeek2.setOverSpent(false);
//        groceryWeek2.setStartDate(LocalDate.of(2025, 4, 8));
//        groceryWeek2.setEndDate(LocalDate.of(2025, 4, 14));
//        groceryWeek2.setCategoryName("Groceries");
//        groceryWeek2.setSubBudgetId(aprilSubBudget.getId());
//        groceryWeek2.setBudgetActual(119.64);
//        groceryWeek2.setBudgetedAmount(125.00);
//        groceryWeek2.setOverSpendingAmount(0.0);
//        Transaction safewayTransaction = new Transaction();
//        safewayTransaction.setTransactionId("e33334567");
////        safewayTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        safewayTransaction.setDescription("Purchase SAFEWAY #1234");
//        safewayTransaction.setMerchantName("Safeway");
//        safewayTransaction.setName("Safeway");
//        safewayTransaction.setPending(false);
//        safewayTransaction.setPosted(LocalDate.of(2025, 4, 9));
//        safewayTransaction.setAmount(BigDecimal.valueOf(56.71));
//        Transaction wincoTransaction2 = new Transaction();
//        wincoTransaction2.setTransactionId("e44445678");
////        wincoTransaction2.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        wincoTransaction2.setDescription("PIN Purchase WINCO FOODS");
//        wincoTransaction2.setMerchantName("Winco Foods");
//        wincoTransaction2.setName("Winco Foods");
//        wincoTransaction2.setPending(false);
//        wincoTransaction2.setPosted(LocalDate.of(2025, 4, 12));
//        wincoTransaction2.setAmount(BigDecimal.valueOf(62.93));
//        groceryWeek2.setTransactions(List.of(safewayTransaction, wincoTransaction2));
//        expected.add(groceryWeek2);
//
//        // Week 3: April 15-21
//        BudgetCategory groceryWeek3 = new BudgetCategory();
//        groceryWeek3.setIsActive(true);
//        groceryWeek3.setOverSpent(false);
//        groceryWeek3.setStartDate(LocalDate.of(2025, 4, 15));
//        groceryWeek3.setEndDate(LocalDate.of(2025, 4, 21));
//        groceryWeek3.setCategoryName("Groceries");
//        groceryWeek3.setSubBudgetId(aprilSubBudget.getId());
//        groceryWeek3.setBudgetActual(94.27);
//        groceryWeek3.setBudgetedAmount(125.00);
//        Transaction wholeFoodsTransaction = new Transaction();
//        wholeFoodsTransaction.setTransactionId("e55556789");
////        wholeFoodsTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        wholeFoodsTransaction.setDescription("Purchase WHOLE FOODS #981");
//        wholeFoodsTransaction.setMerchantName("Whole Foods");
//        wholeFoodsTransaction.setName("Whole Foods");
//        wholeFoodsTransaction.setPending(false);
//        wholeFoodsTransaction.setPosted(LocalDate.of(2025, 4, 18));
//        wholeFoodsTransaction.setAmount(BigDecimal.valueOf(94.27));
//        groceryWeek3.setTransactions(List.of(wholeFoodsTransaction));
//        groceryWeek3.setOverSpendingAmount(0.0);
//        expected.add(groceryWeek3);
//
//        // Week 4: April 22-28
//        BudgetCategory groceryWeek4 = new BudgetCategory();
//        groceryWeek4.setIsActive(true);
//        groceryWeek4.setOverSpent(false);
//        groceryWeek4.setStartDate(LocalDate.of(2025, 4, 22));
//        groceryWeek4.setEndDate(LocalDate.of(2025, 4, 28));
//        groceryWeek4.setCategoryName("Groceries");
//        groceryWeek4.setSubBudgetId(aprilSubBudget.getId());
//        groceryWeek4.setBudgetActual(51.49);
//        Transaction krogerTransaction = new Transaction();
//        krogerTransaction.setTransactionId("e66667890");
////        krogerTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        krogerTransaction.setDescription("Purchase KROGER #765");
//        krogerTransaction.setMerchantName("Kroger");
//        krogerTransaction.setName("Kroger");
//        krogerTransaction.setPending(false);
//        krogerTransaction.setPosted(LocalDate.of(2025, 4, 24));
//        krogerTransaction.setAmount(BigDecimal.valueOf(51.49));
//        groceryWeek4.setTransactions(List.of(krogerTransaction));
//        groceryWeek4.setBudgetedAmount(125.00);
//        groceryWeek4.setOverSpendingAmount(0.0);
//        expected.add(groceryWeek4);
//
//        BudgetCategory groceryWeek5 = new BudgetCategory();
//        groceryWeek5.setIsActive(true);
//        groceryWeek5.setOverSpent(false);
//        groceryWeek5.setStartDate(LocalDate.of(2025, 4, 29));
//        groceryWeek5.setEndDate(LocalDate.of(2025, 4, 30));
//        groceryWeek5.setCategoryName("Groceries");
//        groceryWeek5.setSubBudgetId(aprilSubBudget.getId());
//        groceryWeek5.setBudgetActual(68.15);
//        groceryWeek5.setBudgetedAmount(125.00);
//        Transaction targetTransaction2 = new Transaction();
//        targetTransaction2.setTransactionId("e77778901");
////        targetTransaction2.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        targetTransaction2.setDescription("Purchase TARGET STORES");
//        targetTransaction2.setMerchantName("Target");
//        targetTransaction2.setName("Target");
//        targetTransaction2.setPending(false);
//        targetTransaction2.setPosted(LocalDate.of(2025, 4, 29));
//        targetTransaction2.setAmount(BigDecimal.valueOf(68.15));
//        groceryWeek5.setTransactions(List.of(targetTransaction2));
//        groceryWeek5.setOverSpendingAmount(0.0);
//        expected.add(groceryWeek5);
//
//        return expected;
//    }
//
//    private List<MonthlyBudgetCategoryCriteria> createMonthlyBudgetCriteriaForApril(SubBudget subBudget)
//    {
//        List<MonthlyBudgetCategoryCriteria> monthlyBudgetCategoryCriteria = new ArrayList<>();
//        MonthlyBudgetCategoryCriteria groceriesCriteria = new MonthlyBudgetCategoryCriteria();
//        groceriesCriteria.setCategory("Groceries");
//        groceriesCriteria.setSubBudget(subBudget);
//        groceriesCriteria.setActive(true);
//
//        MonthlyCategorySpending grocerySpending = new MonthlyCategorySpending();
//        grocerySpending.setCategory("Groceries");
//        grocerySpending.setTotalCategorySpending(BigDecimal.valueOf(475));
//        grocerySpending.setTransactions(getAprilGroceriesTransactions());
//
//        List<DateRangeSpending> groceryDateRanges = new ArrayList<>();
//        groceryDateRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 124.16));
//        groceryDateRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 8), LocalDate.of(2025, 4, 14)), 119.64));
//        groceryDateRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)), 94.27));
//        groceryDateRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 28)), 51.49));
//        groceryDateRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 29), LocalDate.of(2025, 4, 30)), 68.15));
//        grocerySpending.setWeeklySpending(groceryDateRanges);
//        groceriesCriteria.setMonthlyCategorySpending(grocerySpending);
//        monthlyBudgetCategoryCriteria.add(groceriesCriteria);
//
//        MonthlyBudgetCategoryCriteria rentCriteria = new MonthlyBudgetCategoryCriteria();
//        rentCriteria.setCategory("Rent");
//        rentCriteria.setActive(true);
//        rentCriteria.setSubBudget(subBudget);
//
//        MonthlyCategorySpending rentSpending = new MonthlyCategorySpending();
//        rentSpending.setCategory("Rent");
//        rentSpending.setTotalCategorySpending(BigDecimal.valueOf(1907.0));
//        rentSpending.setTransactions(getRentTransactionsForApril());
//
//        List<DateRangeSpending> rentDateRanges = new ArrayList<>();
//        rentDateRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)), 1200));
//        rentDateRanges.add(new DateRangeSpending(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)), 707));
//        rentSpending.setWeeklySpending(rentDateRanges);
//        rentCriteria.setMonthlyCategorySpending(rentSpending);
//        rentCriteria.setActive(true);
//        monthlyBudgetCategoryCriteria.add(rentCriteria);
//        return monthlyBudgetCategoryCriteria;
//    }
//
//    private static @NotNull BudgetSchedule getAprilBudgetSchedule() {
//        BudgetSchedule aprilBudgetSchedule = new BudgetSchedule();
//        aprilBudgetSchedule.setBudgetScheduleId(4L);
//        aprilBudgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
//        aprilBudgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
//        aprilBudgetSchedule.setPeriodType(Period.MONTHLY);
//        aprilBudgetSchedule.setTotalPeriods(4);
//        aprilBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 30)));
//        aprilBudgetSchedule.setCreatedDate(LocalDateTime.now());
//        aprilBudgetSchedule.setStatus("Active");
//        return aprilBudgetSchedule;
//    }
//
//    private SubBudget getAprilSubBudget(){
//        SubBudget subBudget = new SubBudget();
//        subBudget.setStartDate(LocalDate.of(2025, 4, 1));
//        subBudget.setEndDate(LocalDate.of(2025, 4, 30));
//        subBudget.setSubBudgetName("April Budget");
//        subBudget.setYear(2025);
//        subBudget.setBudget(budget);
//
//        BudgetSchedule budgetSchedule = getAprilBudgetSchedule();
//        subBudget.setBudgetSchedule(List.of(budgetSchedule));
//        subBudget.setActive(true);
//        subBudget.setAllocatedAmount(BigDecimal.valueOf(3250));
//        subBudget.setSpentOnBudget(BigDecimal.valueOf(1342));
//        subBudget.setSubSavingsTarget(BigDecimal.valueOf(250));
//        subBudget.setSubSavingsAmount(BigDecimal.valueOf(120));
//        return subBudget;
//    }
//
//    private List<TransactionsByCategory> createAprilTransactionsByCategoryWithCategoryAndNoTransactions()
//    {
//        List<TransactionsByCategory> aprilTransactionsByCategory = new ArrayList<>();
//
//        TransactionsByCategory groceryCategoryTransaction = new TransactionsByCategory();
//        groceryCategoryTransaction.setCategoryName("Groceries");
//        groceryCategoryTransaction.setTransactions(List.of());
//
//        // Other category transactions
//        TransactionsByCategory otherCategoryTransaction = new TransactionsByCategory();
//        otherCategoryTransaction.setCategoryName("Other");
//
//        List<Transaction> otherTransactions = new ArrayList<>();
//
//        getOtherTransactions(otherTransactions);
//
//        otherCategoryTransaction.setTransactions(otherTransactions);
//
//        // Rent transactions (1st and 16th of the month)
//        TransactionsByCategory rentCategoryTransaction = new TransactionsByCategory();
//        rentCategoryTransaction.setCategoryName("Rent");
//
//        List<Transaction> rentTransactions = getRentTransactionsForApril();
//        rentCategoryTransaction.setTransactions(rentTransactions);
//
//        // Add all category transactions to the list
//        aprilTransactionsByCategory.add(groceryCategoryTransaction);
//        aprilTransactionsByCategory.add(otherCategoryTransaction);
//        aprilTransactionsByCategory.add(rentCategoryTransaction);
//        return aprilTransactionsByCategory;
//    }
//
//    private List<Transaction> getRentTransactionsForApril(){
//        List<Transaction> rentTransactions = new ArrayList<>();
//
//        Transaction rentTransaction1 = new Transaction();
//        rentTransaction1.setAmount(BigDecimal.valueOf(1200.00));
//        rentTransaction1.setCategories(List.of("Rent", "Housing"));
//        rentTransaction1.setDescription("ACH Payment PROPERTY MGMT");
//        rentTransaction1.setMerchantName("Vista Apartments");
//        rentTransaction1.setName("Vista Apartments");
//        rentTransaction1.setPending(false);
//        rentTransaction1.setTransactionId("e11112345");
//        rentTransaction1.setPosted(LocalDate.of(2025, 4, 1));
//        rentTransactions.add(rentTransaction1);
//
//        Transaction rentTransaction2 = new Transaction();
//        rentTransaction2.setAmount(BigDecimal.valueOf(707.00));
//        rentTransaction2.setCategories(List.of("Rent", "Housing"));
//        rentTransaction2.setDescription("ACH Payment PROPERTY MGMT");
//        rentTransaction2.setMerchantName("Vista Apartments");
//        rentTransaction2.setName("Vista Apartments");
//        rentTransaction2.setPending(false);
//        rentTransaction2.setTransactionId("e12122345");
//        rentTransaction2.setPosted(LocalDate.of(2025, 4, 16));
//        rentTransactions.add(rentTransaction2);
//        return rentTransactions;
//    }
//
//    private static void getOtherTransactions(List<Transaction> otherTransactions) {
//        Transaction parkingTransaction = new Transaction();
//        parkingTransaction.setAmount(BigDecimal.valueOf(12.84));
//        parkingTransaction.setCategories(List.of("Parking", "Travel"));
//        parkingTransaction.setDescription("Purchase THEPARKINGSPOT-ECW401");
//        parkingTransaction.setMerchantName("Theparkingspot Ec");
//        parkingTransaction.setName("Theparkingspot Ec");
//        parkingTransaction.setPending(false);
//        parkingTransaction.setTransactionId("e88889012");
//        parkingTransaction.setPosted(LocalDate.of(2025, 4, 3));
//        otherTransactions.add(parkingTransaction);
//
//        Transaction amazonTransaction = new Transaction();
//        amazonTransaction.setAmount(BigDecimal.valueOf(35.67));
//        amazonTransaction.setCategories(List.of("Online Marketplaces", "Shopping"));
//        amazonTransaction.setDescription("Purchase AMAZON.COM*AB12CD34E");
//        amazonTransaction.setMerchantName("Amazon");
//        amazonTransaction.setName("Amazon");
//        amazonTransaction.setPending(false);
//        amazonTransaction.setTransactionId("e99990123");
//        amazonTransaction.setPosted(LocalDate.of(2025, 4, 17));
//        otherTransactions.add(amazonTransaction);
//
//        Transaction coffeeTransaction = new Transaction();
//        coffeeTransaction.setAmount(BigDecimal.valueOf(6.45));
////        coffeeTransaction.setCategories(List.of("Coffee Shop", "Food and Drink"));
//        coffeeTransaction.setDescription("Purchase STARBUCKS #1234");
//        coffeeTransaction.setMerchantName("Starbucks");
//        coffeeTransaction.setName("Starbucks");
//        coffeeTransaction.setPending(false);
//        coffeeTransaction.setTransactionId("e10101234");
//        coffeeTransaction.setPosted(LocalDate.of(2025, 4, 22));
//        otherTransactions.add(coffeeTransaction);
//    }
//
//    private List<Transaction> getAprilGroceriesTransactions(){
//        List<Transaction> groceryTransactions = new ArrayList<>();
//
//        // Week 1
//        Transaction wincoTransaction1 = new Transaction();
//        wincoTransaction1.setTransactionId("e11112345");
////        wincoTransaction1.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        wincoTransaction1.setDescription("PIN Purchase WINCO FOODS");
//        wincoTransaction1.setMerchantName("Winco Foods");
//        wincoTransaction1.setName("Winco Foods");
//        wincoTransaction1.setPending(false);
//        wincoTransaction1.setPosted(LocalDate.of(2025, 4, 2));
//        wincoTransaction1.setAmount(BigDecimal.valueOf(45.84));
//        groceryTransactions.add(wincoTransaction1);
//
//        Transaction targetTransaction = new Transaction();
//        targetTransaction.setTransactionId("e22223456");
////        targetTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        targetTransaction.setDescription("Purchase TARGET STORES");
//        targetTransaction.setMerchantName("Target");
//        targetTransaction.setName("Target");
//        targetTransaction.setPending(false);
//        targetTransaction.setPosted(LocalDate.of(2025, 4, 5));
//        targetTransaction.setAmount(BigDecimal.valueOf(78.32));
//        groceryTransactions.add(targetTransaction);
//
//        // Week 2
//        Transaction safewayTransaction = new Transaction();
//        safewayTransaction.setTransactionId("e33334567");
////        safewayTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        safewayTransaction.setDescription("Purchase SAFEWAY #1234");
//        safewayTransaction.setMerchantName("Safeway");
//        safewayTransaction.setName("Safeway");
//        safewayTransaction.setPending(false);
//        safewayTransaction.setPosted(LocalDate.of(2025, 4, 9));
//        safewayTransaction.setAmount(BigDecimal.valueOf(56.71));
//        groceryTransactions.add(safewayTransaction);
//
//        Transaction wincoTransaction2 = new Transaction();
//        wincoTransaction2.setTransactionId("e44445678");
////        wincoTransaction2.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        wincoTransaction2.setDescription("PIN Purchase WINCO FOODS");
//        wincoTransaction2.setMerchantName("Winco Foods");
//        wincoTransaction2.setName("Winco Foods");
//        wincoTransaction2.setPending(false);
//        wincoTransaction2.setPosted(LocalDate.of(2025, 4, 12));
//        wincoTransaction2.setAmount(BigDecimal.valueOf(62.93));
//        groceryTransactions.add(wincoTransaction2);
//
//        // Week 3
//        Transaction wholeFoodsTransaction = new Transaction();
//        wholeFoodsTransaction.setTransactionId("e55556789");
//        wholeFoodsTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        wholeFoodsTransaction.setDescription("Purchase WHOLE FOODS #981");
//        wholeFoodsTransaction.setMerchantName("Whole Foods");
//        wholeFoodsTransaction.setName("Whole Foods");
//        wholeFoodsTransaction.setPending(false);
//        wholeFoodsTransaction.setPosted(LocalDate.of(2025, 4, 18));
//        wholeFoodsTransaction.setAmount(BigDecimal.valueOf(94.27));
//        groceryTransactions.add(wholeFoodsTransaction);
//
//        // Week 4
//        Transaction krogerTransaction = new Transaction();
//        krogerTransaction.setTransactionId("e66667890");
//        krogerTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        krogerTransaction.setDescription("Purchase KROGER #765");
//        krogerTransaction.setMerchantName("Kroger");
//        krogerTransaction.setName("Kroger");
//        krogerTransaction.setPending(false);
//        krogerTransaction.setPosted(LocalDate.of(2025, 4, 24));
//        krogerTransaction.setAmount(BigDecimal.valueOf(51.49));
//        groceryTransactions.add(krogerTransaction);
//
//        Transaction targetTransaction2 = new Transaction();
//        targetTransaction2.setTransactionId("e77778901");
//        targetTransaction2.setCategories(List.of("Supermarkets and Groceries", "Shops"));
//        targetTransaction2.setDescription("Purchase TARGET STORES");
//        targetTransaction2.setMerchantName("Target");
//        targetTransaction2.setName("Target");
//        targetTransaction2.setPending(false);
//        targetTransaction2.setPosted(LocalDate.of(2025, 4, 29));
//        targetTransaction2.setAmount(BigDecimal.valueOf(68.15));
//        groceryTransactions.add(targetTransaction2);
//        return groceryTransactions;
//    }
//
//    private List<TransactionsByCategory> createAprilTransactionsByCategory()
//    {
//        List<TransactionsByCategory> transactionsByCategory = new ArrayList<>();
//
//        // Grocery transactions for the entire month
//        TransactionsByCategory groceryCategoryTransaction = new TransactionsByCategory();
//        groceryCategoryTransaction.setCategoryName("Groceries");
//
//        List<Transaction> groceryTransactions = getAprilGroceriesTransactions();
//
//        groceryCategoryTransaction.setTransactions(groceryTransactions);
//
//        // Other category transactions
//        TransactionsByCategory otherCategoryTransaction = new TransactionsByCategory();
//        otherCategoryTransaction.setCategoryName("Other");
//
//        List<Transaction> otherTransactions = getOtherTransactions();
//
//        otherCategoryTransaction.setTransactions(otherTransactions);
//
//        // Rent transactions (1st and 16th of the month)
//        TransactionsByCategory rentCategoryTransaction = new TransactionsByCategory();
//        rentCategoryTransaction.setCategoryName("Rent");
//
//        List<Transaction> rentTransactions = getRentTransactionsForApril();
//        rentCategoryTransaction.setTransactions(rentTransactions);
//
//        // Add all category transactions to the list
//        transactionsByCategory.add(groceryCategoryTransaction);
//        transactionsByCategory.add(otherCategoryTransaction);
//        transactionsByCategory.add(rentCategoryTransaction);
//
//        return transactionsByCategory;
//    }
//
//    private List<Transaction> getOtherTransactions()
//    {
//        List<Transaction> otherTransactions = new ArrayList<>();
//        Transaction parkingTransaction = new Transaction();
//        parkingTransaction.setAmount(BigDecimal.valueOf(12.84));
//        parkingTransaction.setCategories(List.of("Parking", "Travel"));
//        parkingTransaction.setDescription("Purchase THEPARKINGSPOT-ECW401");
//        parkingTransaction.setMerchantName("Theparkingspot Ec");
//        parkingTransaction.setName("Theparkingspot Ec");
//        parkingTransaction.setPending(false);
//        parkingTransaction.setTransactionId("e88889012");
//        parkingTransaction.setPosted(LocalDate.of(2025, 4, 3));
//        otherTransactions.add(parkingTransaction);
//
//        Transaction amazonTransaction = new Transaction();
//        amazonTransaction.setAmount(BigDecimal.valueOf(35.67));
//        amazonTransaction.setCategories(List.of("Online Marketplaces", "Shopping"));
//        amazonTransaction.setDescription("Purchase AMAZON.COM*AB12CD34E");
//        amazonTransaction.setMerchantName("Amazon");
//        amazonTransaction.setName("Amazon");
//        amazonTransaction.setPending(false);
//        amazonTransaction.setTransactionId("e99990123");
//        amazonTransaction.setPosted(LocalDate.of(2025, 4, 17));
//        otherTransactions.add(amazonTransaction);
//
//        Transaction coffeeTransaction = new Transaction();
//        coffeeTransaction.setAmount(BigDecimal.valueOf(6.45));
//        coffeeTransaction.setCategories(List.of("Coffee Shop", "Food and Drink"));
//        coffeeTransaction.setDescription("Purchase STARBUCKS #1234");
//        coffeeTransaction.setMerchantName("Starbucks");
//        coffeeTransaction.setName("Starbucks");
//        coffeeTransaction.setPending(false);
//        coffeeTransaction.setTransactionId("e10101234");
//        coffeeTransaction.setPosted(LocalDate.of(2025, 4, 22));
//        otherTransactions.add(coffeeTransaction);
//        return otherTransactions;
//    }
//
//    private List<BudgetScheduleRange> createAprilBudgetScheduleRanges()
//    {
//        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
//        BudgetScheduleRange budgetScheduleRange1 = new BudgetScheduleRange();
//        budgetScheduleRange1.setBudgetScheduleId(4L);
//        budgetScheduleRange1.setId(15L);
//        budgetScheduleRange1.setStartRange(LocalDate.of(2025, 4, 1));
//        budgetScheduleRange1.setEndRange(LocalDate.of(2025, 4, 7));
//        budgetScheduleRange1.setBudgetedAmount(BigDecimal.valueOf(598.050));
//        budgetScheduleRange1.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)));
//        budgetScheduleRange1.setRangeType("Week");
//        budgetScheduleRange1.setSpentOnRange(BigDecimal.valueOf(0));
//
//        BudgetScheduleRange budgetScheduleRange2 = new BudgetScheduleRange();
//        budgetScheduleRange2.setId(16L);
//        budgetScheduleRange2.setBudgetScheduleId(4L);
//        budgetScheduleRange2.setStartRange(LocalDate.of(2025, 4, 8));
//        budgetScheduleRange2.setEndRange(LocalDate.of(2025, 4, 14));
//        budgetScheduleRange2.setRangeType("Week");
//        budgetScheduleRange2.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 8), LocalDate.of(2025, 4, 14)));
//        budgetScheduleRange2.setSpentOnRange(BigDecimal.valueOf(0));
//        budgetScheduleRange2.setBudgetedAmount(BigDecimal.valueOf(598.050));
//
//        BudgetScheduleRange budgetScheduleRange3 = new BudgetScheduleRange();
//        budgetScheduleRange3.setId(17L);
//        budgetScheduleRange3.setBudgetScheduleId(4L);
//        budgetScheduleRange3.setStartRange(LocalDate.of(2025, 4, 15));
//        budgetScheduleRange3.setEndRange(LocalDate.of(2025, 4, 21));
//
//        budgetScheduleRange3.setRangeType("Week");
//        budgetScheduleRange3.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21)));
//        budgetScheduleRange3.setSpentOnRange(BigDecimal.valueOf(0));
//        budgetScheduleRange3.setBudgetedAmount(BigDecimal.valueOf(598.050));
//
//        BudgetScheduleRange budgetScheduleRange4 = new BudgetScheduleRange();
//        budgetScheduleRange4.setId(18L);
//        budgetScheduleRange4.setBudgetScheduleId(4L);
//        budgetScheduleRange4.setStartRange(LocalDate.of(2025, 4, 22));
//        budgetScheduleRange4.setEndRange(LocalDate.of(2025, 4, 28));
//        budgetScheduleRange4.setRangeType("Week");
//        budgetScheduleRange4.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 28)));
//        budgetScheduleRange4.setSpentOnRange(BigDecimal.valueOf(0));
//        budgetScheduleRange4.setBudgetedAmount(BigDecimal.valueOf(598.050));
//
//        BudgetScheduleRange budgetScheduleRange5 = new BudgetScheduleRange();
//        budgetScheduleRange5.setId(19L);
//        budgetScheduleRange5.setBudgetScheduleId(4L);
//        budgetScheduleRange5.setStartRange(LocalDate.of(2025, 4, 29));
//        budgetScheduleRange5.setEndRange(LocalDate.of(2025, 4, 30));
//        budgetScheduleRange5.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 29), LocalDate.of(2025, 4, 30)));
//        budgetScheduleRange5.setRangeType("Week");
//        budgetScheduleRange5.setSpentOnRange(BigDecimal.valueOf(0));
//        budgetScheduleRange5.setBudgetedAmount(BigDecimal.valueOf(598.050));
//
//        budgetScheduleRanges.add(budgetScheduleRange1);
//        budgetScheduleRanges.add(budgetScheduleRange2);
//        budgetScheduleRanges.add(budgetScheduleRange3);
//        budgetScheduleRanges.add(budgetScheduleRange4);
//        budgetScheduleRanges.add(budgetScheduleRange5);
//        return budgetScheduleRanges;
//    }
//
//
//
//
//    @AfterEach
//    void tearDown() {
//    }
//}