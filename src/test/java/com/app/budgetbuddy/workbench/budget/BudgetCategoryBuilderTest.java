package com.app.budgetbuddy.workbench.budget;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BudgetCategoryService;
import com.app.budgetbuddy.services.CategoryService;
import com.app.budgetbuddy.workbench.categories.CategoryRuleEngine;
import com.app.budgetbuddy.workbench.categories.TransactionRuleService;

import com.app.budgetbuddy.workbench.converter.BudgetCategoryConverter;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@Slf4j
class BudgetCategoryBuilderTest {

    @MockBean
    private BudgetCategoryService userBudgetCategoryService;

    @MockBean
    private TransactionRuleService categoryRuleService;

    @MockBean
    private CategoryService categoryService;

    @MockBean
    private BudgetCalculations budgetCalculator;

    @MockBean
    private CategoryRuleEngine categoryRuleEngine;

    @MockBean
    private BudgetCategoryConverter userBudgetCategoryConverter;

    @Autowired
    private BudgetCategoryBuilder budgetCategoryBuilder;

    private Budget budget;

    private BudgetSchedule budgetSchedule;

    private SubBudgetGoals subBudgetGoals;

    @BeforeEach
    void setUp() {

        budget = new Budget();
        budget.setStartDate(LocalDate.of(2025,1 ,1));
        budget.setEndDate(LocalDate.of(2025,12, 31));
        budget.setBudgetPeriod(Period.MONTHLY);
        budget.setBudgetMode(BudgetMode.SAVINGS_PLAN);
        budget.setBudgetName("Savings Budget Plan");
        budget.setBudgetDescription("Savings Budget Plan");
        budget.setTotalMonthsToSave(12);
        budget.setUserId(1L);
        budget.setId(1L);
        budget.setSavingsProgress(BigDecimal.ZERO);
        budget.setSavingsAmountAllocated(BigDecimal.ZERO);
        budget.setSubBudgets(generateTestSubBudgets());
        budget.setBudgetAmount(new BigDecimal("39120"));
        budget.setActual(new BigDecimal("1609"));

        budgetSchedule = new BudgetSchedule();
        budgetSchedule.setBudgetScheduleId(1L);
        budgetSchedule.setPeriodType(Period.MONTHLY);
        budgetSchedule.setSubBudgetId(1L);
        budgetSchedule.setStatus("Active");
        budgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        budgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
        budgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
        budgetSchedule.setTotalPeriods(5);
    }

    private List<SubBudget> generateTestSubBudgets(){
        List<SubBudget> subBudgets = new ArrayList<>();
        // Generate a SubBudget for each month (1 through 12)
        for (int month = 1; month <= 12; month++) {
            // You can build month-based naming or logic here:
            YearMonth yearMonth = YearMonth.of(2025, month);  // example year 2025
            String subBudgetName = yearMonth.getMonth().name() + " SubBudget";

            // Example values for allocatedAmount, subSavingsTarget, etc.
            BigDecimal allocatedAmount = BigDecimal.valueOf(1000 + (month * 10));
            BigDecimal subSavingsTarget = BigDecimal.valueOf(200 + (month * 5));
            BigDecimal subSavingsAmount = BigDecimal.ZERO;
            BigDecimal spentOnBudget = BigDecimal.ZERO;

            // You can keep these lists empty if you're just testing
            List<BudgetSchedule> scheduleList = new ArrayList<>();
            List<ControlledBudgetCategory> categoryList = new ArrayList<>();

            LocalDate startMonth = YearMonth.now().atDay(1);
            LocalDate endMonth = YearMonth.now().atEndOfMonth();

            SubBudget subBudget = new SubBudget(
                    // id
                    (long) month,
                    // subBudgetName
                    subBudgetName,
                    // allocatedAmount
                    allocatedAmount,
                    // subSavingsTarget
                    subSavingsTarget,
                    // subSavingsAmount
                    subSavingsAmount,
                    // spentOnBudget
                    spentOnBudget,
                    // Parent Budget reference
                    budget,
                    startMonth,
                    endMonth,
                    // BudgetSchedule list
                    scheduleList,
                    // ControlledBudgetCategory list
                    categoryList,
                    // isActive
                    true
            );

            subBudgets.add(subBudget);
        }

        return subBudgets;
    }



    @Test
   void testBuildDateRanges_WhenBudgetStartIsNull_thenReturnEmptyList(){
        LocalDate budgetEnd = LocalDate.of(2024, 6, 8);
        Period period = Period.MONTHLY;

        List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(null, budgetEnd, period);
        assertEquals(0, actual.size());
        assertTrue(actual.isEmpty());
   }

   @Test
   void testBuildDateRanges_whenBudgetEndIsNull_thenReturnEmptyList(){
       LocalDate budgetStart = LocalDate.of(2024, 6, 8);
       Period period = Period.MONTHLY;

       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart,null, period);
       assertEquals(0, actual.size());
       assertTrue(actual.isEmpty());
   }

   @Test
   void testBuildDateRanges_whenPeriodIsNull_thenReturnEmptyList(){
       LocalDate budgetStart = LocalDate.of(2024, 6, 8);
       LocalDate budgetEnd = LocalDate.of(2024, 6, 15);
       Period period = Period.MONTHLY;

       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart,budgetEnd, null);
       assertEquals(0, actual.size());
       assertTrue(actual.isEmpty());
   }

    /**
     * When Budget StartDate is Equal to Budget end date, then recalculate the end date to be one month out
     */
   @Test
   void testBuildDateRanges_whenBudgetStartDateIsEqualToBudgetEndDate_thenReturnDateRangeList(){
        LocalDate budgetStart = LocalDate.of(2024, 11, 1);
        LocalDate budgetEnd = budgetStart;
        Period period = Period.WEEKLY;

       // Only one date range since startDate == endDate
       List<DateRange> expectedDateRanges = new ArrayList<>();
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 1)));

       // Call method and verify
       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
       assertEquals(expectedDateRanges.size(), actual.size());
       for (int i = 0; i < expectedDateRanges.size(); i++) {
           assertEquals(expectedDateRanges.get(i).getStartDate(), actual.get(i).getStartDate());
           assertEquals(expectedDateRanges.get(i).getEndDate(), actual.get(i).getEndDate());
       }
   }

   @Test
   void testBuildDateRanges_whenBudgetStartDateIsNotEqualToBudgetEndDate_thenReturnDateRangeList(){
       LocalDate budgetStart = LocalDate.of(2024, 11, 1);
       LocalDate budgetEnd = LocalDate.of(2024, 11, 30);
       Period period = Period.WEEKLY;

       // Correct weekly ranges within the given date range
       List<DateRange> expectedDateRanges = new ArrayList<>();
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 29), LocalDate.of(2024, 11, 30))); // Last partial week

       // Call method and verify
       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
       assertEquals(expectedDateRanges.size(), actual.size());
       for (int i = 0; i < expectedDateRanges.size(); i++) {
           assertEquals(expectedDateRanges.get(i).getStartDate(), actual.get(i).getStartDate());
           assertEquals(expectedDateRanges.get(i).getEndDate(), actual.get(i).getEndDate());
       }
   }

   @Test
   void testBuildDateRanges_whenBudgetPeriodIsBiWeekly_thenReturnDateRangeList(){
       LocalDate budgetStart = LocalDate.of(2024, 11, 1);
       LocalDate budgetEnd = LocalDate.of(2024, 11, 30);
       Period period = Period.BIWEEKLY;
       List<DateRange> expectedDateRanges = new ArrayList<>();
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 14)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 28)));
       expectedDateRanges.add(new DateRange(LocalDate.of(2024, 11, 29), LocalDate.of(2024, 11, 30)));
       List<DateRange> actual = budgetCategoryBuilder.buildBudgetDateRanges(budgetStart, budgetEnd, period);
       assertEquals(expectedDateRanges.size(), actual.size());
       for(int i = 0; i < expectedDateRanges.size(); i++){
           assertEquals(expectedDateRanges.get(i).getStartDate(), actual.get(i).getStartDate());
           assertEquals(expectedDateRanges.get(i).getEndDate(), actual.get(i).getEndDate());
       }
   }

   @Test
   void testCreates_whenSubBudgetIsNull_thenReturnEmptyList()
   {
       BudgetSchedule budgetSchedule = new BudgetSchedule();
       List<CategoryPeriodSpending> categoryPeriodSpendings = Arrays.asList(new CategoryPeriodSpending());
       SubBudgetGoals subBudgetGoals1 = new SubBudgetGoals();
       List<BudgetCategoryCriteria> actual = budgetCategoryBuilder.createCategoryBudgetCriteriaList(null, budgetSchedule, categoryPeriodSpendings, subBudgetGoals1);
       assertEquals(0, actual.size());
   }

   @Test
   void testCreateCategoryBudgets_whenBudgetScheduleIsNull_thenReturnEmptyList(){
       SubBudget subBudget = new SubBudget();
       List<CategoryPeriodSpending> categoryPeriodSpendings = Arrays.asList(new CategoryPeriodSpending());
       SubBudgetGoals subBudgetGoals1 = new SubBudgetGoals();
       List<BudgetCategoryCriteria> actual = budgetCategoryBuilder.createCategoryBudgetCriteriaList(subBudget, null, categoryPeriodSpendings, subBudgetGoals1);
       assertEquals(0, actual.size());
   }

   @Test
   void testCreateCategoryBudgets_whenCategoryPeriodSpendingIsNull_thenReturnEmptyList(){
       BudgetSchedule budgetSchedule = new BudgetSchedule();
       SubBudget subBudget = new SubBudget();
       SubBudgetGoals subBudgetGoals1 = new SubBudgetGoals();

       List<BudgetCategoryCriteria> actual = budgetCategoryBuilder.createCategoryBudgetCriteriaList(subBudget, budgetSchedule, null, subBudgetGoals1);
       assertEquals(0, actual.size());
   }

   @Test
   void testCreateCategoryBudgets_whenJanuaryBudget_thenReturnJanuaryCategoryBudgets()
   {
       SubBudget subBudget = getAprilSubBudget(1, 31, "January Budget");

       SubBudgetGoals subBudgetGoals = new SubBudgetGoals();
       subBudgetGoals.setContributedAmount(BigDecimal.valueOf(76));
       subBudgetGoals.setSubBudgetId(1L);
       subBudgetGoals.setGoalId(1L);
       subBudgetGoals.setGoalScore(BigDecimal.valueOf(0.36));
       subBudgetGoals.setStatus(GoalStatus.IN_PROGRESS);
       subBudgetGoals.setSavingsTarget(BigDecimal.valueOf(208));
       subBudgetGoals.setRemaining(BigDecimal.valueOf(132));

       BudgetSchedule januaryBudgetSchedule = new BudgetSchedule();
       januaryBudgetSchedule.setTotalPeriods(5);
       januaryBudgetSchedule.setSubBudgetId(1L);
       januaryBudgetSchedule.setStatus("ACTIVE");
       januaryBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
       januaryBudgetSchedule.setPeriodType(Period.MONTHLY);
       januaryBudgetSchedule.setStartDate(LocalDate.of(2025, 1, 1));
       januaryBudgetSchedule.setEndDate(LocalDate.of(2025, 1, 31));
       januaryBudgetSchedule.setBudgetScheduleId(1L);
       januaryBudgetSchedule.setBudgetScheduleRanges(generateJanuaryBudgetScheduleRanges());

       // Setup CategoryPeriodSpending (derived from expected CategoryBudgets)
       List<CategoryPeriodSpending> spendingList = new ArrayList<>();
       spendingList.add(new CategoryPeriodSpending("Groceries", BigDecimal.valueOf(79),
               new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7))));
       spendingList.add(new CategoryPeriodSpending("Groceries", BigDecimal.valueOf(75),
               new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14))));
       spendingList.add(new CategoryPeriodSpending("Groceries", BigDecimal.valueOf(81),
               new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21))));
       spendingList.add(new CategoryPeriodSpending("Groceries", BigDecimal.valueOf(86),
               new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28))));
       spendingList.add(new CategoryPeriodSpending("Groceries", BigDecimal.valueOf(82),
               new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31))));
       spendingList.add(new CategoryPeriodSpending("Rent", BigDecimal.valueOf(1200),
               new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 15))));
       spendingList.add(new CategoryPeriodSpending("Rent", BigDecimal.valueOf(707),
               new DateRange(LocalDate.of(2025, 1, 16), LocalDate.of(2025, 1, 31))));

       List<BudgetCategoryCriteria> expectedCategoryBudgets = new ArrayList<>();
       BudgetCategoryCriteria groceryBudget = new BudgetCategoryCriteria();
       groceryBudget.setCategory("Groceries");
       groceryBudget.setBudget(subBudget);
       groceryBudget.setBudgetSchedule(januaryBudgetSchedule);
       groceryBudget.setActive(true);
       groceryBudget.setCategoryDateRanges(Arrays.asList(
               new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)),
               new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)),
               new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025,  1, 21)),
               new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)),
               new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31))
       ));
       List<BudgetPeriodAmount> groceryBudgetAmounts = new ArrayList<>();
       BudgetPeriodAmount groceryWeek1 = new BudgetPeriodAmount(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7)), BigDecimal.valueOf(66), BigDecimal.valueOf(79));
       BudgetPeriodAmount groceryWeek2 = new BudgetPeriodAmount(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)), BigDecimal.valueOf(66), BigDecimal.valueOf(75));
       BudgetPeriodAmount groceryWeek3 = new BudgetPeriodAmount(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)), BigDecimal.valueOf(66), BigDecimal.valueOf(81));
       BudgetPeriodAmount groceryWeek4 = new BudgetPeriodAmount(new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)), BigDecimal.valueOf(66), BigDecimal.valueOf(86));
       BudgetPeriodAmount groceryWeek5 = new BudgetPeriodAmount(new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)), BigDecimal.valueOf(66), BigDecimal.valueOf(82));
       groceryBudgetAmounts.add(groceryWeek1);
       groceryBudgetAmounts.add(groceryWeek2);
       groceryBudgetAmounts.add(groceryWeek3);
       groceryBudgetAmounts.add(groceryWeek4);
       groceryBudgetAmounts.add(groceryWeek5);
       groceryBudget.setPeriodAmounts(groceryBudgetAmounts);

       BudgetCategoryCriteria rentBudget = new BudgetCategoryCriteria();
       rentBudget.setCategory("Rent");
       rentBudget.setBudget(subBudget);
       rentBudget.setBudgetSchedule(januaryBudgetSchedule);
       rentBudget.setActive(true);
       rentBudget.setCategoryDateRanges(Arrays.asList(
               new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 15)),
               new DateRange(LocalDate.of(2025, 1, 16), LocalDate.of(2025, 1, 31))
       ));
       List<BudgetPeriodAmount> rentBudgetAmounts = new ArrayList<>();
       BudgetPeriodAmount rentWeek1 = new BudgetPeriodAmount(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 15)), BigDecimal.valueOf(1404), BigDecimal.valueOf(1200));
       BudgetPeriodAmount rentWeek2 = new BudgetPeriodAmount(new DateRange(LocalDate.of(2025, 1, 16), LocalDate.of(2025, 1, 31)), BigDecimal.valueOf(504), BigDecimal.valueOf(707));
       rentBudgetAmounts.add(rentWeek1);
       rentBudgetAmounts.add(rentWeek2);
       rentBudget.setPeriodAmounts(rentBudgetAmounts);
       expectedCategoryBudgets.add(rentBudget);
       expectedCategoryBudgets.add(groceryBudget);

       Mockito.when(budgetCalculator.determineCategoryBudget("Rent", BigDecimal.valueOf(3260)))
               .thenReturn(new BigDecimal("1907"));

       Mockito.when(budgetCalculator.determineCategoryBudget("Groceries", BigDecimal.valueOf(3260)))
               .thenReturn(new BigDecimal("326"));

       List<BudgetCategoryCriteria> actual = budgetCategoryBuilder.createCategoryBudgetCriteriaList(subBudget, januaryBudgetSchedule, spendingList, subBudgetGoals);
       assertNotNull(actual, "Result should not be null");
       assertEquals(expectedCategoryBudgets.size(), actual.size());

       BudgetCategoryCriteria actualGrocery = actual.stream()
               .filter(cb -> cb.getCategory().equals("Groceries"))
               .findFirst()
               .orElseThrow(() -> new AssertionError("Groceries CategoryBudget not found"));
       assertEquals(groceryBudget.getCategory(), actualGrocery.getCategory());
       assertEquals(groceryBudget.getCategoryDateRanges(), actualGrocery.getCategoryDateRanges());
       assertEquals(groceryBudget.getPeriodAmounts().size(), actualGrocery.getPeriodAmounts().size());
       for (int i = 0; i < groceryBudget.getPeriodAmounts().size(); i++) {
           BudgetPeriodAmount expectedPA = groceryBudget.getPeriodAmounts().get(i);
           BudgetPeriodAmount actualPA = actualGrocery.getPeriodAmounts().get(i);
           assertEquals(expectedPA.getDateRange(), actualPA.getDateRange(), "DateRange mismatch for Groceries");
           assertEquals(expectedPA.getBudgeted(), actualPA.getBudgeted(), "Budgeted amount mismatch for Groceries");
           assertEquals(expectedPA.getActual(), actualPA.getActual(), "Actual amount mismatch for Groceries");
       }

       BudgetCategoryCriteria actualRent = actual.stream()
               .filter(cb -> cb.getCategory().equals("Rent"))
               .findFirst()
               .orElseThrow(() -> new AssertionError("Rent CategoryBudget not found"));
       assertEquals(rentBudget.getCategory(), actualRent.getCategory());
       assertEquals(rentBudget.getCategoryDateRanges(), actualRent.getCategoryDateRanges());
       assertEquals(rentBudget.getPeriodAmounts().size(), actualRent.getPeriodAmounts().size());
       for (int i = 0; i < rentBudget.getPeriodAmounts().size(); i++) {
           BudgetPeriodAmount expectedPA = rentBudget.getPeriodAmounts().get(i);
           BudgetPeriodAmount actualPA = actualRent.getPeriodAmounts().get(i);
           assertEquals(expectedPA.getDateRange(), actualPA.getDateRange(), "DateRange mismatch for Rent");
           assertEquals(expectedPA.getBudgeted(), actualPA.getBudgeted(), "Budgeted amount mismatch for Rent");
           assertEquals(expectedPA.getActual(), actualPA.getActual(), "Actual amount mismatch for Rent");
       }
   }

   @Test
   void testBuildBudgetPeriodAmounts_whenCategoryIsEmpty_thenReturnEmptyCollection(){
       List<CategoryPeriodSpending> categoryPeriodSpendings = new ArrayList<>();
       categoryPeriodSpendings.add(new CategoryPeriodSpending());
       List<BudgetPeriodAmount> actual = budgetCategoryBuilder.buildBudgetPeriodAmounts("", categoryPeriodSpendings, BigDecimal.TEN);
       assertNotNull(actual, "Result should not be null");
       assertEquals(actual.size(), 0);
   }

   @Test
   void testBuildBudgetPeriodAmounts_whenCategorySpendingIsNull_thenReturnEmptyCollection(){
       List<BudgetPeriodAmount> actual = budgetCategoryBuilder.buildBudgetPeriodAmounts("Groceries", null, BigDecimal.TEN);
       assertNotNull(actual, "Result should not be null");
       assertEquals(actual.size(), 0);
   }

   @Test
   void testBuildBudgetPeriodAmounts_whenCategoryBudgetAmountIsNull_thenReturnEmptyCollection(){
       List<CategoryPeriodSpending> categoryPeriodSpendings = new ArrayList<>();
       categoryPeriodSpendings.add(new CategoryPeriodSpending());
       List<BudgetPeriodAmount> actual = budgetCategoryBuilder.buildBudgetPeriodAmounts("Groceries", categoryPeriodSpendings, null);
       assertNotNull(actual, "Result should not be null");
       assertEquals(actual.size(), 0);
   }

   @Test
   void testBuildBudgetPeriodAmounts_whenCategoryIsRentValid_thenReturnBudgetPeriodAmounts()
   {
       final String category = "Rent";
       List<CategoryPeriodSpending> categoryPeriodSpendings = new ArrayList<>();
       DateRange firstMonthRange = new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 15));
       DateRange secondMonthRange = new DateRange(LocalDate.of(2025, 1, 16), LocalDate.of(2025, 1, 31));
       CategoryPeriodSpending categoryPeriodSpending = new CategoryPeriodSpending(category, BigDecimal.valueOf(1200), firstMonthRange);
       CategoryPeriodSpending categoryPeriodSpending1 = new CategoryPeriodSpending(category, BigDecimal.valueOf(707), secondMonthRange);
       categoryPeriodSpendings.add(categoryPeriodSpending);
       categoryPeriodSpendings.add(categoryPeriodSpending1);
       final BigDecimal rentBudgetedAmount = new BigDecimal("1907");

       List<BudgetPeriodAmount> expectedBudgetPeriodAmounts = new ArrayList<>();
       BudgetPeriodAmount firstWeekBudgetAmount = new BudgetPeriodAmount(firstMonthRange, BigDecimal.valueOf(1404), BigDecimal.valueOf(1200));
       BudgetPeriodAmount secondWeekBudgetAmount = new BudgetPeriodAmount(secondMonthRange, BigDecimal.valueOf(504), BigDecimal.valueOf(707));
       expectedBudgetPeriodAmounts.add(firstWeekBudgetAmount);
       expectedBudgetPeriodAmounts.add(secondWeekBudgetAmount);

       List<BudgetPeriodAmount> actual = budgetCategoryBuilder.buildBudgetPeriodAmounts(category, categoryPeriodSpendings, rentBudgetedAmount);
       assertNotNull(actual, "Result should not be null");
       assertEquals(expectedBudgetPeriodAmounts.size(), actual.size());
       for (int i = 0; i < expectedBudgetPeriodAmounts.size(); i++) {
           BudgetPeriodAmount expectedBudgetPeriodAmount = expectedBudgetPeriodAmounts.get(i);
           BudgetPeriodAmount actualBudgetPeriodAmount = actual.get(i);

           assertEquals(expectedBudgetPeriodAmount.getDateRange(), actualBudgetPeriodAmount.getDateRange(), "DateRange mismatch for Rent");
           assertEquals(expectedBudgetPeriodAmount.getBudgeted(), actualBudgetPeriodAmount.getBudgeted(), "Budgeted amount mismatch for Rent");
           assertEquals(expectedBudgetPeriodAmount.getActual(), actualBudgetPeriodAmount.getActual(), "Actual amount mismatch for Rent");
       }
   }

   @Test
   void testBuildBudgetPeriodAmounts_whenCategoryIsNotRent_thenReturnBudgetPeriodAmounts(){
       final String category = "Groceries";
       List<CategoryPeriodSpending> categoryPeriodSpendings = new ArrayList<>();
       DateRange categoryFirstWeekRange = new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 7));
       DateRange categorySecondWeekRange = new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14));
       DateRange categoryThirdWeekRange = new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21));
       DateRange categoryFourthWeekRange = new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28));
       CategoryPeriodSpending categoryFirstWeek = new CategoryPeriodSpending(category, BigDecimal.valueOf(75.0), categoryFirstWeekRange);
       CategoryPeriodSpending categorySecondWeek = new CategoryPeriodSpending(category, BigDecimal.valueOf(79.0), categorySecondWeekRange);
       CategoryPeriodSpending categoryThirdWeek = new CategoryPeriodSpending(category, BigDecimal.valueOf(87.0), categoryThirdWeekRange);
       CategoryPeriodSpending categoryFourthWeek = new CategoryPeriodSpending(category, BigDecimal.valueOf(85), categoryFourthWeekRange);
       categoryPeriodSpendings.add(categoryFirstWeek);
       categoryPeriodSpendings.add(categorySecondWeek);
       categoryPeriodSpendings.add(categoryThirdWeek);
       categoryPeriodSpendings.add(categoryFourthWeek);

       List<BudgetPeriodAmount> expectedBudgetPeriodAmounts = new ArrayList<>();
       BudgetPeriodAmount budgetPeriodAmountWeek1 = new BudgetPeriodAmount(categoryFirstWeekRange, BigDecimal.valueOf(82), BigDecimal.valueOf(75.0));
       BudgetPeriodAmount budgetPeriodAmountWeek2 = new BudgetPeriodAmount(categorySecondWeekRange, BigDecimal.valueOf(82), BigDecimal.valueOf(79.0));
       BudgetPeriodAmount budgetPeriodAmountWeek3 = new BudgetPeriodAmount(categoryThirdWeekRange, BigDecimal.valueOf(82), BigDecimal.valueOf(87.0));
       BudgetPeriodAmount budgetPeriodAmountWeek4 = new BudgetPeriodAmount(categoryFourthWeekRange, BigDecimal.valueOf(82), BigDecimal.valueOf(85));
       expectedBudgetPeriodAmounts.add(budgetPeriodAmountWeek1);
       expectedBudgetPeriodAmounts.add(budgetPeriodAmountWeek2);
       expectedBudgetPeriodAmounts.add(budgetPeriodAmountWeek3);
       expectedBudgetPeriodAmounts.add(budgetPeriodAmountWeek4);

       List<BudgetPeriodAmount> actual = budgetCategoryBuilder.buildBudgetPeriodAmounts(category, categoryPeriodSpendings, BigDecimal.valueOf(326));
       assertNotNull(actual, "Result should not be null");
       assertEquals(expectedBudgetPeriodAmounts.size(), actual.size());
       for (int i = 0; i < expectedBudgetPeriodAmounts.size(); i++) {
           BudgetPeriodAmount expectedBudgetPeriodAmount = expectedBudgetPeriodAmounts.get(i);
           BudgetPeriodAmount actualBudgetPeriodAmount = actual.get(i);
           assertEquals(expectedBudgetPeriodAmount.getActual(), actualBudgetPeriodAmount.getActual(), "Actual amount mismatch for Rent");
           assertEquals(expectedBudgetPeriodAmount.getBudgeted(), actualBudgetPeriodAmount.getBudgeted(), "Budgeted amount mismatch for Rent");
           assertEquals(expectedBudgetPeriodAmount.getDateRange(), actualBudgetPeriodAmount.getDateRange(), "DateRange mismatch for Rent");
       }
   }


    @Test
    void testUpdateTransactionCategories_whenExistingTransactionCategoriesIsNull_thenReturnEmptyList(){
       List<BudgetCategoryCriteria> categoryPeriods = new ArrayList<>();
       categoryPeriods.add(new BudgetCategoryCriteria("Groceries", List.of(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)))));

       List<BudgetCategory> actual = budgetCategoryBuilder.updateBudgetCategories(categoryPeriods, null);
       assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetCategories_whenSubBudgetIsNull_thenReturnEmptyList(){
        List<CategoryTransactions> categoryTransactions = new ArrayList<>();
        categoryTransactions.add(new CategoryTransactions());
        List<BudgetCategory> actual = budgetCategoryBuilder.initializeBudgetCategories(null, budgetSchedule, categoryTransactions, subBudgetGoals);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetCategories_whenBudgetScheduleIsNull_thenReturnEmptyList(){
        List<CategoryTransactions> categoryTransactions = new ArrayList<>();
        categoryTransactions.add(new CategoryTransactions());

        SubBudget subBudget = getAprilSubBudget(1, 31, "January Budget");

        List<BudgetCategory> actual = budgetCategoryBuilder.initializeBudgetCategories(subBudget, null, categoryTransactions, subBudgetGoals);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetCategories_whenCategoryTransactionsIsNull_thenReturnEmptyList(){
        SubBudget subBudget = getAprilSubBudget(1, 31, "January Budget");

        List<BudgetCategory> actual = budgetCategoryBuilder.initializeBudgetCategories(subBudget, budgetSchedule, null, subBudgetGoals);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testInitializeBudgetCategories_whenAprilData_thenReturnBudgetCategories()
    {
        List<BudgetCategory> expectedBudgetCategories = new ArrayList<>();
        SubBudget subBudget = getAprilSubBudget(4, 30, "April Budget");

        BudgetSchedule aprilBudgetSchedule = getAprilBudgetSchedule();

        createGroceryAndOtherBudgetCategories(expectedBudgetCategories);

        SubBudgetGoals aprilSubBudgetGoals = getAprilSubBudgetGoals();

        List<CategoryTransactions> aprilCategoryTransactions = createGroceryAndOtherCategoryTransactions();

        Mockito.when(budgetCalculator.determineCategoryBudget("Groceries", BigDecimal.valueOf(3260)))
                .thenReturn(BigDecimal.valueOf(326));

        Mockito.when(budgetCalculator.determineCategoryBudget("Other", BigDecimal.valueOf(3260)))
                .thenReturn(BigDecimal.valueOf(50));

        List<BudgetCategory> actual = budgetCategoryBuilder.initializeBudgetCategories(subBudget, aprilBudgetSchedule, aprilCategoryTransactions, aprilSubBudgetGoals);
        assertEquals(expectedBudgetCategories.size(), actual.size());
        for (int i = 0; i < expectedBudgetCategories.size(); i++) {
            BudgetCategory expectedBudgetCategory = expectedBudgetCategories.get(i);
            BudgetCategory actualBudgetCategory = actual.get(i);
            assertEquals(expectedBudgetCategory.getCategoryName(), actualBudgetCategory.getCategoryName());
            assertEquals(expectedBudgetCategory.getBudgetedAmount(), actualBudgetCategory.getBudgetedAmount());
            assertEquals(expectedBudgetCategory.getBudgetActual(), actualBudgetCategory.getBudgetActual());
            assertEquals(expectedBudgetCategory.getSubBudgetId(), actualBudgetCategory.getSubBudgetId());
            assertEquals(expectedBudgetCategory.getIsActive(), actualBudgetCategory.getIsActive());
            assertEquals(expectedBudgetCategory.getStartDate(), actualBudgetCategory.getStartDate());
            assertEquals(expectedBudgetCategory.getEndDate(), actualBudgetCategory.getEndDate());
            assertEquals(expectedBudgetCategory.getTransactions().size(), actualBudgetCategory.getTransactions().size());
            assertEquals(expectedBudgetCategory.getId(), actualBudgetCategory.getId());
            assertEquals(expectedBudgetCategory.getOverSpendingAmount(), actualBudgetCategory.getOverSpendingAmount());
        }
    }

    @Test
    void testGetCategorySpendingByCategoryTransactions_whenCategoryTransactionsIsNull_thenReturnEmptyList(){
       List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
       budgetScheduleRanges.add(new BudgetScheduleRange());
       List<CategoryPeriodSpending> actual = budgetCategoryBuilder.getCategorySpendingByCategoryTransactions(null, budgetScheduleRanges);
       assertTrue(actual.isEmpty());
    }

    @Test
    void testGetCategorySpendingByCategoryTransactions_whenBudgetScheduleRangesIsNull_thenReturnEmptyList()
    {
       List<CategoryTransactions> categoryTransactions = new ArrayList<>();
       categoryTransactions.add(new CategoryTransactions());
       List<CategoryPeriodSpending> actual = budgetCategoryBuilder.getCategorySpendingByCategoryTransactions(categoryTransactions, null);
       assertTrue(actual.isEmpty());
    }

    @Test
    void testGetCategorySpendingByCategoryTransactions_whenCategoryTransactionsIsEmpty_thenReturnEmptyList(){
       List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
       budgetScheduleRanges.add(new BudgetScheduleRange());
       List<CategoryPeriodSpending> actual = budgetCategoryBuilder.getCategorySpendingByCategoryTransactions(new ArrayList<>(), budgetScheduleRanges);
       assertTrue(actual.isEmpty());
    }

    @Test
    void testGetCategorySpendingByCategoryTransactions_whenBudgetScheduleRangesIsEmpty_thenReturnEmptyList(){
       List<CategoryTransactions> categoryTransactions = new ArrayList<>();
       categoryTransactions.add(new CategoryTransactions());
       List<CategoryPeriodSpending> actual = budgetCategoryBuilder.getCategorySpendingByCategoryTransactions(categoryTransactions, new ArrayList<>());
       assertTrue(actual.isEmpty());
    }

    @Test
    void testGetCategorySpendingByCategoryTransactions_whenAprilCategoryTransactions_thenReturnCategoryPeriodSpending()
    {
        List<CategoryTransactions> aprilCategoryTransactions = createAprilCategoryTransactions();
        List<BudgetScheduleRange> aprilBudgetScheduleRanges = createAprilBudgetScheduleRanges();
        List<CategoryPeriodSpending> expectedCategoryPeriodSpendings = new ArrayList<>();

        // Week 1: April 1-7
        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Groceries",
                new BigDecimal("124.16"),
                new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7))
        ));

        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Other",
                new BigDecimal("12.84"),
                new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7))
        ));

        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Rent",
                new BigDecimal("1200.00"),
                new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7))
        ));

        // Week 2: April 8-14
        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Groceries",
                new BigDecimal("119.64"),
                new DateRange(LocalDate.of(2025, 4, 8), LocalDate.of(2025, 4, 14))
        ));

        // Week 3: April 15-21
        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Groceries",
                new BigDecimal("94.27"),
                new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21))
        ));

        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Other",
                new BigDecimal("35.67"),
                new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21))
        ));

        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Rent",
                new BigDecimal("707.00"),
                new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21))
        ));

        // Week 4: April 22-28
        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Groceries",
                new BigDecimal("51.49"),
                new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 28))
        ));

        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Other",
                new BigDecimal("6.45"),
                new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 28))
        ));

        // Week 5: April 29-30
        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Groceries",
                new BigDecimal("68.15"),
                new DateRange(LocalDate.of(2025, 4, 29), LocalDate.of(2025, 4, 30))
        ));

        // Execute the method and get actual results
        List<CategoryPeriodSpending> actualCategoryPeriodSpendings =
                budgetCategoryBuilder.getCategorySpendingByCategoryTransactions(aprilCategoryTransactions, aprilBudgetScheduleRanges);

        // Assert results
        assertNotNull(actualCategoryPeriodSpendings, "Result should not be null");
        assertEquals(expectedCategoryPeriodSpendings.size(), actualCategoryPeriodSpendings.size(),
                "Expected and actual CategoryPeriodSpending counts should match");

//        // Sort both lists for consistent comparison
        Comparator<CategoryPeriodSpending> comparator = Comparator
                .comparing((CategoryPeriodSpending cps) -> cps.getDateRange() != null ?
                                cps.getDateRange().getStartDate() : null,
                        Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(CategoryPeriodSpending::getCategoryName,
                        Comparator.nullsLast(Comparator.naturalOrder()));

        expectedCategoryPeriodSpendings.sort(comparator);
        actualCategoryPeriodSpendings.sort(comparator);

        // Verify each CategoryPeriodSpending object
        for (int i = 0; i < expectedCategoryPeriodSpendings.size(); i++) {
            CategoryPeriodSpending expected = expectedCategoryPeriodSpendings.get(i);
            CategoryPeriodSpending actual = actualCategoryPeriodSpendings.get(i);

            assertEquals(expected.getCategoryName(), actual.getCategoryName(),
                    "Category name mismatch for period " + expected.getDateRange());

            assertEquals(0, expected.getActualSpending().compareTo(actual.getActualSpending()),
                    "Actual spending mismatch for " + expected.getCategoryName() + " in period " + expected.getDateRange());

            assertEquals(expected.getDateRange().getStartDate(), actual.getDateRange().getStartDate(),
                    "Start date mismatch for " + expected.getCategoryName());

            assertEquals(expected.getDateRange().getEndDate(), actual.getDateRange().getEndDate(),
                    "End date mismatch for " + expected.getCategoryName());
        }
    }

    @Test
    void testGetCategorySpendingByCategoryTransactions_whenTransactionsIsEmptyForCategory_thenReturnCategoryPeriodSpending()
    {
        List<CategoryTransactions> categoryTransactions = createAprilCategoryTransactionsWithCategoryAndNoTransactions();
        List<BudgetScheduleRange> aprilBudgetScheduleRanges = createAprilBudgetScheduleRanges();
        // Define expected results - note that Groceries category should not appear as it has no transactions
        List<CategoryPeriodSpending> expectedCategoryPeriodSpendings = new ArrayList<>();

        // Week 1: April 1-7
        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Other",
                new BigDecimal("12.84"),
                new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7))
        ));

        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Rent",
                new BigDecimal("1200.00"),
                new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7))
        ));

        // Week 3: April 15-21
        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Other",
                new BigDecimal("35.67"),
                new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21))
        ));

        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Rent",
                new BigDecimal("707.00"),
                new DateRange(LocalDate.of(2025, 4, 15), LocalDate.of(2025, 4, 21))
        ));

        // Week 4: April 22-28
        expectedCategoryPeriodSpendings.add(new CategoryPeriodSpending(
                "Other",
                new BigDecimal("6.45"),
                new DateRange(LocalDate.of(2025, 4, 22), LocalDate.of(2025, 4, 28))
        ));

        // Execute the method and get actual results
        List<CategoryPeriodSpending> actualCategoryPeriodSpendings =
                budgetCategoryBuilder.getCategorySpendingByCategoryTransactions(categoryTransactions, aprilBudgetScheduleRanges);

        // Assert results
        assertNotNull(actualCategoryPeriodSpendings, "Result should not be null");
        assertEquals(expectedCategoryPeriodSpendings.size(), actualCategoryPeriodSpendings.size(),
                "Expected and actual CategoryPeriodSpending counts should match");

        // Sort both lists for consistent comparison
        Comparator<CategoryPeriodSpending> comparator = Comparator
                .comparing((CategoryPeriodSpending cps) -> cps.getDateRange().getStartDate())
                .thenComparing(CategoryPeriodSpending::getCategoryName);

        expectedCategoryPeriodSpendings.sort(comparator);
        actualCategoryPeriodSpendings.sort(comparator);

        // Verify each CategoryPeriodSpending object
        for (int i = 0; i < expectedCategoryPeriodSpendings.size(); i++) {
            CategoryPeriodSpending expected = expectedCategoryPeriodSpendings.get(i);
            CategoryPeriodSpending actual = actualCategoryPeriodSpendings.get(i);

            assertEquals(expected.getCategoryName(), actual.getCategoryName(),
                    "Category name mismatch for period " + expected.getDateRange());

            assertEquals(0, expected.getActualSpending().compareTo(actual.getActualSpending()),
                    "Actual spending mismatch for " + expected.getCategoryName() + " in period " + expected.getDateRange());

            assertEquals(expected.getDateRange().getStartDate(), actual.getDateRange().getStartDate(),
                    "Start date mismatch for " + expected.getCategoryName());

            assertEquals(expected.getDateRange().getEndDate(), actual.getDateRange().getEndDate(),
                    "End date mismatch for " + expected.getCategoryName());
        }

        // Verify that no CategoryPeriodSpending exists for the Groceries category (which has no transactions)
        boolean hasGroceryCategory = actualCategoryPeriodSpendings.stream()
                .anyMatch(cps -> cps.getCategoryName().equals("Groceries"));

        assertFalse(hasGroceryCategory, "Should not have any CategoryPeriodSpending for Groceries category");
    }

    @Test
    void testCreateBudgetCategoriesByCurrentDate_whenSubBudgetIsNull_thenReturnEmptyCollection(){
       BudgetSchedule budgetSchedule1 = new BudgetSchedule();
       List<CategoryTransactions> categoryTransactions = createAprilCategoryTransactionsWithCategoryAndNoTransactions();
       List<BudgetCategory> actual = budgetCategoryBuilder.createBudgetCategoriesByCurrentDate(null, budgetSchedule1, categoryTransactions);
       assertNotNull(actual, "Result should not be null");
       assertTrue(actual.isEmpty(), "Result should not be empty");
    }

    @Test
    void testCreateBudgetCategoriesByCurrentDate_whenBudgetScheduleIsNull_thenReturnEmptyCollection(){
       SubBudget subBudget = new SubBudget();
       List<CategoryTransactions> categoryTransactions = createAprilCategoryTransactionsWithCategoryAndNoTransactions();
       List<BudgetCategory> actual = budgetCategoryBuilder.createBudgetCategoriesByCurrentDate(subBudget, null, categoryTransactions);
       assertNotNull(actual, "Result should not be null");
       assertTrue(actual.isEmpty(), "Result should not be empty");
    }

    @Test
    void testCreateBudgetCategoriesByCurrentDate_whenAprilBudgetAndCurrentDateAndNoExistingBudgetCategories_thenReturnBudgetCategories()
    {
       SubBudget subBudget = getAprilSubBudget();
       BudgetSchedule aprilBudgetSchedule = new BudgetSchedule();
       List<CategoryTransactions> categoryTransactions = createAprilCategoryTransactions();

       List<BudgetCategory> expectedBudgetCategories = new ArrayList<>();


    }


    private SubBudget getAprilSubBudget(){
       SubBudget subBudget = new SubBudget();
       subBudget.setStartDate(LocalDate.of(2025, 4, 1));
       subBudget.setEndDate(LocalDate.of(2025, 4, 30));
       subBudget.setSubBudgetName("April Budget");
       subBudget.setYear(2025);
       subBudget.setBudget(budget);

       BudgetSchedule budgetSchedule = getAprilBudgetSchedule();
       subBudget.setBudgetSchedule(List.of(budgetSchedule));
       subBudget.setActive(true);
       subBudget.setAllocatedAmount(BigDecimal.valueOf(3250));
       subBudget.setSpentOnBudget(BigDecimal.valueOf(1342));
       subBudget.setSubSavingsTarget(BigDecimal.valueOf(250));
       subBudget.setSubSavingsAmount(BigDecimal.valueOf(120));
       return subBudget;
   }

    private List<CategoryTransactions> createAprilCategoryTransactionsWithCategoryAndNoTransactions()
    {
        List<CategoryTransactions> aprilCategoryTransactions = new ArrayList<>();

        CategoryTransactions groceryCategoryTransaction = new CategoryTransactions();
        groceryCategoryTransaction.setCategoryName("Groceries");
        groceryCategoryTransaction.setTransactions(List.of());

        // Other category transactions
        CategoryTransactions otherCategoryTransaction = new CategoryTransactions();
        otherCategoryTransaction.setCategoryName("Other");

        List<Transaction> otherTransactions = new ArrayList<>();

        Transaction parkingTransaction = new Transaction();
        parkingTransaction.setAmount(BigDecimal.valueOf(12.84));
        parkingTransaction.setCategories(List.of("Parking", "Travel"));
        parkingTransaction.setDescription("Purchase THEPARKINGSPOT-ECW401");
        parkingTransaction.setMerchantName("Theparkingspot Ec");
        parkingTransaction.setName("Theparkingspot Ec");
        parkingTransaction.setPending(false);
        parkingTransaction.setTransactionId("e88889012");
        parkingTransaction.setPosted(LocalDate.of(2025, 4, 3));
        otherTransactions.add(parkingTransaction);

        Transaction amazonTransaction = new Transaction();
        amazonTransaction.setAmount(BigDecimal.valueOf(35.67));
        amazonTransaction.setCategories(List.of("Online Marketplaces", "Shopping"));
        amazonTransaction.setDescription("Purchase AMAZON.COM*AB12CD34E");
        amazonTransaction.setMerchantName("Amazon");
        amazonTransaction.setName("Amazon");
        amazonTransaction.setPending(false);
        amazonTransaction.setTransactionId("e99990123");
        amazonTransaction.setPosted(LocalDate.of(2025, 4, 17));
        otherTransactions.add(amazonTransaction);

        Transaction coffeeTransaction = new Transaction();
        coffeeTransaction.setAmount(BigDecimal.valueOf(6.45));
        coffeeTransaction.setCategories(List.of("Coffee Shop", "Food and Drink"));
        coffeeTransaction.setDescription("Purchase STARBUCKS #1234");
        coffeeTransaction.setMerchantName("Starbucks");
        coffeeTransaction.setName("Starbucks");
        coffeeTransaction.setPending(false);
        coffeeTransaction.setTransactionId("e10101234");
        coffeeTransaction.setPosted(LocalDate.of(2025, 4, 22));
        otherTransactions.add(coffeeTransaction);

        otherCategoryTransaction.setTransactions(otherTransactions);

        // Rent transactions (1st and 16th of the month)
        CategoryTransactions rentCategoryTransaction = new CategoryTransactions();
        rentCategoryTransaction.setCategoryName("Rent");

        List<Transaction> rentTransactions = new ArrayList<>();

        Transaction rentTransaction1 = new Transaction();
        rentTransaction1.setAmount(BigDecimal.valueOf(1200.00));
        rentTransaction1.setCategories(List.of("Rent", "Housing"));
        rentTransaction1.setDescription("ACH Payment PROPERTY MGMT");
        rentTransaction1.setMerchantName("Vista Apartments");
        rentTransaction1.setName("Vista Apartments");
        rentTransaction1.setPending(false);
        rentTransaction1.setTransactionId("e11112345");
        rentTransaction1.setPosted(LocalDate.of(2025, 4, 1));
        rentTransactions.add(rentTransaction1);

        Transaction rentTransaction2 = new Transaction();
        rentTransaction2.setAmount(BigDecimal.valueOf(707.00));
        rentTransaction2.setCategories(List.of("Rent", "Housing"));
        rentTransaction2.setDescription("ACH Payment PROPERTY MGMT");
        rentTransaction2.setMerchantName("Vista Apartments");
        rentTransaction2.setName("Vista Apartments");
        rentTransaction2.setPending(false);
        rentTransaction2.setTransactionId("e12122345");
        rentTransaction2.setPosted(LocalDate.of(2025, 4, 16));
        rentTransactions.add(rentTransaction2);

        rentCategoryTransaction.setTransactions(rentTransactions);

        // Add all category transactions to the list
        aprilCategoryTransactions.add(groceryCategoryTransaction);
        aprilCategoryTransactions.add(otherCategoryTransaction);
        aprilCategoryTransactions.add(rentCategoryTransaction);
        return aprilCategoryTransactions;
    }

    private List<CategoryTransactions> createAprilCategoryTransactions()
    {
        List<CategoryTransactions> categoryTransactions = new ArrayList<>();

        // Grocery transactions for the entire month
        CategoryTransactions groceryCategoryTransaction = new CategoryTransactions();
        groceryCategoryTransaction.setCategoryName("Groceries");

        List<Transaction> groceryTransactions = new ArrayList<>();

        // Week 1
        Transaction wincoTransaction1 = new Transaction();
        wincoTransaction1.setTransactionId("e11112345");
        wincoTransaction1.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        wincoTransaction1.setDescription("PIN Purchase WINCO FOODS");
        wincoTransaction1.setMerchantName("Winco Foods");
        wincoTransaction1.setName("Winco Foods");
        wincoTransaction1.setPending(false);
        wincoTransaction1.setPosted(LocalDate.of(2025, 4, 2));
        wincoTransaction1.setAmount(BigDecimal.valueOf(45.84));
        groceryTransactions.add(wincoTransaction1);

        Transaction targetTransaction = new Transaction();
        targetTransaction.setTransactionId("e22223456");
        targetTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        targetTransaction.setDescription("Purchase TARGET STORES");
        targetTransaction.setMerchantName("Target");
        targetTransaction.setName("Target");
        targetTransaction.setPending(false);
        targetTransaction.setPosted(LocalDate.of(2025, 4, 5));
        targetTransaction.setAmount(BigDecimal.valueOf(78.32));
        groceryTransactions.add(targetTransaction);

        // Week 2
        Transaction safewayTransaction = new Transaction();
        safewayTransaction.setTransactionId("e33334567");
        safewayTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        safewayTransaction.setDescription("Purchase SAFEWAY #1234");
        safewayTransaction.setMerchantName("Safeway");
        safewayTransaction.setName("Safeway");
        safewayTransaction.setPending(false);
        safewayTransaction.setPosted(LocalDate.of(2025, 4, 9));
        safewayTransaction.setAmount(BigDecimal.valueOf(56.71));
        groceryTransactions.add(safewayTransaction);

        Transaction wincoTransaction2 = new Transaction();
        wincoTransaction2.setTransactionId("e44445678");
        wincoTransaction2.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        wincoTransaction2.setDescription("PIN Purchase WINCO FOODS");
        wincoTransaction2.setMerchantName("Winco Foods");
        wincoTransaction2.setName("Winco Foods");
        wincoTransaction2.setPending(false);
        wincoTransaction2.setPosted(LocalDate.of(2025, 4, 12));
        wincoTransaction2.setAmount(BigDecimal.valueOf(62.93));
        groceryTransactions.add(wincoTransaction2);

        // Week 3
        Transaction wholeFoodsTransaction = new Transaction();
        wholeFoodsTransaction.setTransactionId("e55556789");
        wholeFoodsTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        wholeFoodsTransaction.setDescription("Purchase WHOLE FOODS #981");
        wholeFoodsTransaction.setMerchantName("Whole Foods");
        wholeFoodsTransaction.setName("Whole Foods");
        wholeFoodsTransaction.setPending(false);
        wholeFoodsTransaction.setPosted(LocalDate.of(2025, 4, 18));
        wholeFoodsTransaction.setAmount(BigDecimal.valueOf(94.27));
        groceryTransactions.add(wholeFoodsTransaction);

        // Week 4
        Transaction krogerTransaction = new Transaction();
        krogerTransaction.setTransactionId("e66667890");
        krogerTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        krogerTransaction.setDescription("Purchase KROGER #765");
        krogerTransaction.setMerchantName("Kroger");
        krogerTransaction.setName("Kroger");
        krogerTransaction.setPending(false);
        krogerTransaction.setPosted(LocalDate.of(2025, 4, 24));
        krogerTransaction.setAmount(BigDecimal.valueOf(51.49));
        groceryTransactions.add(krogerTransaction);

        Transaction targetTransaction2 = new Transaction();
        targetTransaction2.setTransactionId("e77778901");
        targetTransaction2.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        targetTransaction2.setDescription("Purchase TARGET STORES");
        targetTransaction2.setMerchantName("Target");
        targetTransaction2.setName("Target");
        targetTransaction2.setPending(false);
        targetTransaction2.setPosted(LocalDate.of(2025, 4, 29));
        targetTransaction2.setAmount(BigDecimal.valueOf(68.15));
        groceryTransactions.add(targetTransaction2);

        groceryCategoryTransaction.setTransactions(groceryTransactions);

        // Other category transactions
        CategoryTransactions otherCategoryTransaction = new CategoryTransactions();
        otherCategoryTransaction.setCategoryName("Other");

        List<Transaction> otherTransactions = new ArrayList<>();

        Transaction parkingTransaction = new Transaction();
        parkingTransaction.setAmount(BigDecimal.valueOf(12.84));
        parkingTransaction.setCategories(List.of("Parking", "Travel"));
        parkingTransaction.setDescription("Purchase THEPARKINGSPOT-ECW401");
        parkingTransaction.setMerchantName("Theparkingspot Ec");
        parkingTransaction.setName("Theparkingspot Ec");
        parkingTransaction.setPending(false);
        parkingTransaction.setTransactionId("e88889012");
        parkingTransaction.setPosted(LocalDate.of(2025, 4, 3));
        otherTransactions.add(parkingTransaction);

        Transaction amazonTransaction = new Transaction();
        amazonTransaction.setAmount(BigDecimal.valueOf(35.67));
        amazonTransaction.setCategories(List.of("Online Marketplaces", "Shopping"));
        amazonTransaction.setDescription("Purchase AMAZON.COM*AB12CD34E");
        amazonTransaction.setMerchantName("Amazon");
        amazonTransaction.setName("Amazon");
        amazonTransaction.setPending(false);
        amazonTransaction.setTransactionId("e99990123");
        amazonTransaction.setPosted(LocalDate.of(2025, 4, 17));
        otherTransactions.add(amazonTransaction);

        Transaction coffeeTransaction = new Transaction();
        coffeeTransaction.setAmount(BigDecimal.valueOf(6.45));
        coffeeTransaction.setCategories(List.of("Coffee Shop", "Food and Drink"));
        coffeeTransaction.setDescription("Purchase STARBUCKS #1234");
        coffeeTransaction.setMerchantName("Starbucks");
        coffeeTransaction.setName("Starbucks");
        coffeeTransaction.setPending(false);
        coffeeTransaction.setTransactionId("e10101234");
        coffeeTransaction.setPosted(LocalDate.of(2025, 4, 22));
        otherTransactions.add(coffeeTransaction);

        otherCategoryTransaction.setTransactions(otherTransactions);

        // Rent transactions (1st and 16th of the month)
        CategoryTransactions rentCategoryTransaction = new CategoryTransactions();
        rentCategoryTransaction.setCategoryName("Rent");

        List<Transaction> rentTransactions = new ArrayList<>();

        Transaction rentTransaction1 = new Transaction();
        rentTransaction1.setAmount(BigDecimal.valueOf(1200.00));
        rentTransaction1.setCategories(List.of("Rent", "Housing"));
        rentTransaction1.setDescription("ACH Payment PROPERTY MGMT");
        rentTransaction1.setMerchantName("Vista Apartments");
        rentTransaction1.setName("Vista Apartments");
        rentTransaction1.setPending(false);
        rentTransaction1.setTransactionId("e11112345");
        rentTransaction1.setPosted(LocalDate.of(2025, 4, 1));
        rentTransactions.add(rentTransaction1);

        Transaction rentTransaction2 = new Transaction();
        rentTransaction2.setAmount(BigDecimal.valueOf(707.00));
        rentTransaction2.setCategories(List.of("Rent", "Housing"));
        rentTransaction2.setDescription("ACH Payment PROPERTY MGMT");
        rentTransaction2.setMerchantName("Vista Apartments");
        rentTransaction2.setName("Vista Apartments");
        rentTransaction2.setPending(false);
        rentTransaction2.setTransactionId("e12122345");
        rentTransaction2.setPosted(LocalDate.of(2025, 4, 16));
        rentTransactions.add(rentTransaction2);

        rentCategoryTransaction.setTransactions(rentTransactions);

        // Add all category transactions to the list
        categoryTransactions.add(groceryCategoryTransaction);
        categoryTransactions.add(otherCategoryTransaction);
        categoryTransactions.add(rentCategoryTransaction);

        return categoryTransactions;
    }

    private List<BudgetScheduleRange> createAprilBudgetScheduleRanges()
    {
        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        BudgetScheduleRange budgetScheduleRange1 = new BudgetScheduleRange();
        budgetScheduleRange1.setBudgetScheduleId(4L);
        budgetScheduleRange1.setId(15L);
        budgetScheduleRange1.setStartRange(LocalDate.of(2025, 4, 1));
        budgetScheduleRange1.setEndRange(LocalDate.of(2025, 4, 7));
        budgetScheduleRange1.setBudgetedAmount(BigDecimal.valueOf(598.050));
        budgetScheduleRange1.setBudgetDateRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 7)));
        budgetScheduleRange1.setSingleDate(false);
        budgetScheduleRange1.setRangeType("Week");
        budgetScheduleRange1.setSpentOnRange(BigDecimal.valueOf(0));

        BudgetScheduleRange budgetScheduleRange2 = new BudgetScheduleRange();
        budgetScheduleRange2.setId(16L);
        budgetScheduleRange2.setBudgetScheduleId(4L);
        budgetScheduleRange2.setStartRange(LocalDate.of(2025, 4, 8));
        budgetScheduleRange2.setEndRange(LocalDate.of(2025, 4, 14));
        budgetScheduleRange2.setSingleDate(false);
        budgetScheduleRange2.setRangeType("Week");
        budgetScheduleRange2.setSpentOnRange(BigDecimal.valueOf(0));
        budgetScheduleRange2.setBudgetedAmount(BigDecimal.valueOf(598.050));

        BudgetScheduleRange budgetScheduleRange3 = new BudgetScheduleRange();
        budgetScheduleRange3.setId(17L);
        budgetScheduleRange3.setBudgetScheduleId(4L);
        budgetScheduleRange3.setStartRange(LocalDate.of(2025, 4, 15));
        budgetScheduleRange3.setEndRange(LocalDate.of(2025, 4, 21));
        budgetScheduleRange3.setSingleDate(false);
        budgetScheduleRange3.setRangeType("Week");
        budgetScheduleRange3.setSpentOnRange(BigDecimal.valueOf(0));
        budgetScheduleRange3.setBudgetedAmount(BigDecimal.valueOf(598.050));

        BudgetScheduleRange budgetScheduleRange4 = new BudgetScheduleRange();
        budgetScheduleRange4.setId(18L);
        budgetScheduleRange4.setBudgetScheduleId(4L);
        budgetScheduleRange4.setStartRange(LocalDate.of(2025, 4, 22));
        budgetScheduleRange4.setEndRange(LocalDate.of(2025, 4, 28));
        budgetScheduleRange4.setSingleDate(false);
        budgetScheduleRange4.setRangeType("Week");
        budgetScheduleRange4.setSpentOnRange(BigDecimal.valueOf(0));
        budgetScheduleRange4.setBudgetedAmount(BigDecimal.valueOf(598.050));

        BudgetScheduleRange budgetScheduleRange5 = new BudgetScheduleRange();
        budgetScheduleRange5.setId(19L);
        budgetScheduleRange5.setBudgetScheduleId(4L);
        budgetScheduleRange5.setStartRange(LocalDate.of(2025, 4, 29));
        budgetScheduleRange5.setEndRange(LocalDate.of(2025, 4, 30));
        budgetScheduleRange5.setSingleDate(false);
        budgetScheduleRange5.setRangeType("Week");
        budgetScheduleRange5.setSpentOnRange(BigDecimal.valueOf(0));
        budgetScheduleRange5.setBudgetedAmount(BigDecimal.valueOf(598.050));

        budgetScheduleRanges.add(budgetScheduleRange1);
        budgetScheduleRanges.add(budgetScheduleRange2);
        budgetScheduleRanges.add(budgetScheduleRange3);
        budgetScheduleRanges.add(budgetScheduleRange4);
        budgetScheduleRanges.add(budgetScheduleRange5);
        return budgetScheduleRanges;
    }

    private SubBudgetGoals getAprilSubBudgetGoals()
    {
        SubBudgetGoals subBudgetGoals = new SubBudgetGoals();
        subBudgetGoals.setId(4L);
        subBudgetGoals.setGoalScore(BigDecimal.valueOf(100));
        subBudgetGoals.setRemaining(BigDecimal.valueOf(2433.00));
        subBudgetGoals.setSavingsTarget(BigDecimal.valueOf(208.33));
        subBudgetGoals.setStatus(GoalStatus.IN_PROGRESS);
        subBudgetGoals.setGoalId(1L);
        return subBudgetGoals;
    }

    private List<CategoryTransactions> createGroceryAndOtherCategoryTransactions()
    {
        List<CategoryTransactions> categoryTransactions = new ArrayList<>();
        CategoryTransactions groceryCategoryTransaction = new CategoryTransactions();
        groceryCategoryTransaction.setCategoryName("Groceries");

        Transaction wincoTransaction = new Transaction();
        wincoTransaction.setTransactionId("e11112345");
        wincoTransaction.setCategories(List.of("Supermarkets and Groceries", "Shops"));
        wincoTransaction.setDescription("PIN Purchase WINCO FOODS");
        wincoTransaction.setMerchantName("Winco Foods");
        wincoTransaction.setName("Winco Foods");
        wincoTransaction.setPending(false);
        wincoTransaction.setPosted(LocalDate.of(2025, 4, 2));
        wincoTransaction.setAmount(BigDecimal.valueOf(45.84));
        groceryCategoryTransaction.setTransactions(List.of(wincoTransaction));

        CategoryTransactions otherCategoryTransaction = new CategoryTransactions();
        Transaction parkingTransaction = new Transaction();
        parkingTransaction.setAmount(BigDecimal.valueOf(12.84));
        parkingTransaction.setCategories(List.of("Parking", "Travel"));
        parkingTransaction.setDescription("Purchase THEPARKINGSPOT-ECW401");
        parkingTransaction.setMerchantName("Theparkingspot Ec");
        parkingTransaction.setName("Theparkingspot Ec");
        parkingTransaction.setPending(false);
        parkingTransaction.setTransactionId("e444222223");
        parkingTransaction.setPosted(LocalDate.of(2025, 4, 3));
        otherCategoryTransaction.setTransactions(List.of(parkingTransaction));
        otherCategoryTransaction.setCategoryName("Other");
        categoryTransactions.add(otherCategoryTransaction);
        categoryTransactions.add(groceryCategoryTransaction);
        return categoryTransactions;
    }

    private static void createGroceryAndOtherBudgetCategories(List<BudgetCategory> expectedBudgetCategories) {
        BudgetCategory groceryCategory = new BudgetCategory();
        groceryCategory.setCategoryName("Groceries");
        groceryCategory.setStartDate(LocalDate.of(2025, 4, 1));
        groceryCategory.setEndDate(LocalDate.of(2025, 4, 7));
        groceryCategory.setSubBudgetId(4L);
        groceryCategory.setIsActive(true);
        groceryCategory.setOverSpent(false);
        groceryCategory.setOverSpendingAmount(0.0);
        groceryCategory.setBudgetedAmount(150.0);
        groceryCategory.setBudgetActual(147.0);
        expectedBudgetCategories.add(groceryCategory);

        BudgetCategory otherCategory = new BudgetCategory();
        otherCategory.setCategoryName("Other");
        otherCategory.setStartDate(LocalDate.of(2025, 4, 1));
        otherCategory.setEndDate(LocalDate.of(2025, 4, 7));
        otherCategory.setSubBudgetId(4L);
        otherCategory.setIsActive(true);
        otherCategory.setOverSpent(false);
        otherCategory.setOverSpendingAmount(0.0);
        otherCategory.setBudgetedAmount(97.0);
        otherCategory.setBudgetActual(12.0);
        expectedBudgetCategories.add(otherCategory);
    }

    private @NotNull SubBudget getAprilSubBudget(int month, int dayOfMonth, String April_Budget) {
        SubBudget subBudget = new SubBudget();
        subBudget.setBudget(budget);

        subBudget.setBudgetSchedule(List.of(getAprilBudgetSchedule()));
        subBudget.setActive(true);
        subBudget.setYear(2025);
        subBudget.setId(4L);
        subBudget.setStartDate(LocalDate.of(2025, month, 1));
        subBudget.setEndDate(LocalDate.of(2025, month, dayOfMonth));
        subBudget.setSubBudgetName(April_Budget);
        subBudget.setSpentOnBudget(BigDecimal.valueOf(2782));
        subBudget.setSubSavingsAmount(BigDecimal.valueOf(50));
        subBudget.setSubSavingsTarget(BigDecimal.valueOf(200));
        subBudget.setAllocatedAmount(BigDecimal.valueOf(3260));
        subBudget.setAllocatedAmount(BigDecimal.valueOf(3260));
        subBudget.setSpentOnBudget(BigDecimal.valueOf(1630));
        return subBudget;
    }

    private static @NotNull BudgetSchedule getAprilBudgetSchedule() {
        BudgetSchedule aprilBudgetSchedule = new BudgetSchedule();
        aprilBudgetSchedule.setBudgetScheduleId(4L);
        aprilBudgetSchedule.setStartDate(LocalDate.of(2025, 4, 1));
        aprilBudgetSchedule.setEndDate(LocalDate.of(2025, 4, 30));
        aprilBudgetSchedule.setPeriodType(Period.MONTHLY);
        aprilBudgetSchedule.setTotalPeriods(4);
        aprilBudgetSchedule.setScheduleRange(new DateRange(LocalDate.of(2025, 4, 1), LocalDate.of(2025, 4, 30)));
        aprilBudgetSchedule.setCreatedDate(LocalDateTime.now());
        aprilBudgetSchedule.setStatus("Active");
        return aprilBudgetSchedule;
    }

//    private void verifyTransactionCategory(List<BudgetCategory> categories, String categoryId,
//                                           String categoryName, LocalDate startDate, LocalDate endDate, Double budgeted, Double actual,
//                                           boolean isOverspent) {
//
//        BudgetCategory matchingCategory = categories.stream()
//                .filter(tc -> tc.getCategoryId().equals(categoryId) &&
//                        tc.getStartDate().equals(startDate) &&
//                        tc.getEndDate().equals(endDate))
//                .findFirst()
//                .orElseThrow(() -> new AssertionError(
//                        String.format("No category found with ID: %s and date range: %s - %s",
//                                categoryId, startDate, endDate)));
//
//
//        assertEquals(categoryId, matchingCategory.getCategoryId(), "Category ID mismatch");
//        assertEquals(categoryName, matchingCategory.getCategoryName(), "Category name mismatch");
//        assertEquals(startDate, matchingCategory.getStartDate(), "Start date mismatch");
//        assertEquals(endDate, matchingCategory.getEndDate(), "End date mismatch");
//        assertEquals(budgeted, matchingCategory.getBudgetedAmount(), "Budget amount mismatch");
//        assertEquals(actual, matchingCategory.getBudgetActual(), "Actual amount mismatch");
//        assertEquals(isOverspent, matchingCategory.isOverSpent(), "Overspent flag mismatch");
//    }

    private List<BudgetScheduleRange> generateJanuaryBudgetScheduleRanges(){
        List<BudgetScheduleRange> budgetScheduleRanges = new ArrayList<>();
        BudgetScheduleRange januaryFirstWeek = new BudgetScheduleRange();
        januaryFirstWeek.setBudgetedAmount(new BigDecimal("652"));
        januaryFirstWeek.setStartRange(LocalDate.of(2025, 1, 1));
        januaryFirstWeek.setEndRange(LocalDate.of(2025, 1, 7));
        januaryFirstWeek.setSpentOnRange(new BigDecimal("322"));
        januaryFirstWeek.setRangeType("Week");
        januaryFirstWeek.setSingleDate(false);

        BudgetScheduleRange januarySecondWeek = new BudgetScheduleRange();
        januarySecondWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 8), LocalDate.of(2025, 1, 14)));
        januarySecondWeek.setSingleDate(false);
        januarySecondWeek.setBudgetedAmount(new BigDecimal("652"));
        januarySecondWeek.setStartRange(LocalDate.of(2025, 1, 8));
        januarySecondWeek.setEndRange(LocalDate.of(2025, 1, 14));
        januarySecondWeek.setSpentOnRange(new BigDecimal("322"));
        januarySecondWeek.setRangeType("Week");

        BudgetScheduleRange januaryThirdWeek = new BudgetScheduleRange();
        januaryThirdWeek.setStartRange(LocalDate.of(2025, 1, 15));
        januaryThirdWeek.setEndRange(LocalDate.of(2025, 1, 21));
        januaryThirdWeek.setBudgetedAmount(new BigDecimal("652"));
        januaryThirdWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 22)));
        januaryThirdWeek.setRangeType("Week");
        januaryThirdWeek.setSpentOnRange(new BigDecimal("322"));
        januaryThirdWeek.setSingleDate(false);

        BudgetScheduleRange januaryFourthWeek = new BudgetScheduleRange();
        januaryFourthWeek.setSingleDate(false);
        januaryFourthWeek.setStartRange(LocalDate.of(2025, 1, 22));
        januaryFourthWeek.setEndRange(LocalDate.of(2025, 1, 28));
        januaryFourthWeek.setSpentOnRange(new BigDecimal("322"));
        januaryFourthWeek.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 23), LocalDate.of(2025, 1, 31)));
        januaryFourthWeek.setRangeType("Week");
        januaryFourthWeek.setBudgetedAmount(new BigDecimal("652"));

        BudgetScheduleRange januaryExtraDay = new BudgetScheduleRange();
        januaryExtraDay.setSingleDate(false);
        januaryExtraDay.setStartRange(LocalDate.of(2025, 1, 29));
        januaryExtraDay.setEndRange(LocalDate.of(2025, 1, 31));
        januaryExtraDay.setSpentOnRange(new BigDecimal("322"));
        januaryExtraDay.setBudgetedAmount(new BigDecimal("652"));
        januaryExtraDay.setBudgetDateRange(new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)));
        januaryExtraDay.setRangeType("Week");

        budgetScheduleRanges.add(januaryFirstWeek);
        budgetScheduleRanges.add(januarySecondWeek);
        budgetScheduleRanges.add(januaryThirdWeek);
        budgetScheduleRanges.add(januaryFourthWeek);
        budgetScheduleRanges.add(januaryExtraDay);
        return budgetScheduleRanges;
    }


//    @Test
//    void testUpdateTransactionCategories_whenCategoryPeriodsInSamePeriodAsExistingTransactionCategories_thenReturnTransactionCategories() {
//        // Create date ranges that match existing transaction categories
//        DateRange dateRange = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//
//        // Setup CategoryPeriods with same date range as existing
//        CategoryBudget groceriesCategoryPeriod = new CategoryBudget("Groceries", List.of(dateRange), createTestBudget(), true);
//        groceriesCategoryPeriod.setCategoryBudgetAmountForDateRange(dateRange, 200.0);
//        groceriesCategoryPeriod.setCategoryBudgetActualAmountForDateRange(dateRange, 85.0);
//        groceriesCategoryPeriod.setCategoryTransactions(Arrays.asList(
//                new Transaction("acc1", new BigDecimal("85.00"), "USD", Arrays.asList("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 4), "desc", "merchant", "name", false, "grocery_trans_3",
//                        null, null, LocalDate.of(2024, 11, 4))
//        ));
//
//        CategoryBudget rentCategoryPeriod = new CategoryBudget("Rent", List.of(dateRange),createTestBudget() , true);
//        rentCategoryPeriod.setCategoryBudgetAmountForDateRange(dateRange, 1200.0);
//        rentCategoryPeriod.setCategoryBudgetActualAmountForDateRange(dateRange, 800.0);
//        rentCategoryPeriod.setCategoryTransactions(Arrays.asList(
//                new Transaction("acc1", new BigDecimal("800.00"), "USD", Arrays.asList("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 5), "desc", "merchant", "name", false, "rent_trans_2",
//                        null, null, LocalDate.of(2024, 11, 5))
//        ));
//
//        List<CategoryBudget> categoryPeriods = List.of(groceriesCategoryPeriod, rentCategoryPeriod);
//
//        // Setup existing TransactionCategories for same period
//        TransactionCategory existingRentCategory = new TransactionCategory();
//        existingRentCategory.setCategoryName("Rent");
//        existingRentCategory.setStartDate(LocalDate.of(2024, 11, 1));
//        existingRentCategory.setEndDate(LocalDate.of(2024, 11, 8));
//        existingRentCategory.setBudgetedAmount(1200.0);
//        existingRentCategory.setBudgetActual(1200.0);
//        existingRentCategory.setTransactions(Arrays.asList(
//                new Transaction("acc1", new BigDecimal("800.00"), "USD", Arrays.asList("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "rent_trans_2",
//                        null, null, LocalDate.of(2024, 11, 2))
//        ));
//        existingRentCategory.setBudgetId(1L);
//        existingRentCategory.setIsActive(true);
//
//        TransactionCategory existingGroceriesCategory = new TransactionCategory();
//        existingGroceriesCategory.setCategoryName("Groceries");
//        existingGroceriesCategory.setStartDate(LocalDate.of(2024, 11, 1));
//        existingGroceriesCategory.setEndDate(LocalDate.of(2024, 11, 8));
//        existingGroceriesCategory.setBudgetedAmount(200.0);
//        existingGroceriesCategory.setBudgetActual(150.0);
//        existingGroceriesCategory.setTransactions(Arrays.asList(
//                new Transaction("acc1", new BigDecimal("85.00"), "USD", Arrays.asList("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 3), "desc", "merchant", "name", false, "grocery_trans_3",
//                        null, null, LocalDate.of(2024, 11, 3))
//        ));
//        existingGroceriesCategory.setBudgetId(1L);
//        existingGroceriesCategory.setIsActive(true);
//
//        List<TransactionCategory> existingCategories = Arrays.asList(
//                existingRentCategory,
//                existingGroceriesCategory
//        );
//
//        // Execute
//        List<TransactionCategory> result = budgetCategoryBuilder.updateTransactionCategories(
//                categoryPeriods,
//                existingCategories
//        );
//
//        // Verify
//        assertEquals(2, result.size()); // Should only have 2 categories since they're merged
//
//        // Verify Groceries category was merged correctly
//        Optional<TransactionCategory> mergedGroceries = result.stream()
//                .filter(tc -> tc.getCategoryName().equals("Groceries"))
//                .findFirst();
//
//        assertTrue(mergedGroceries.isPresent());
//        TransactionCategory groceriesResult = mergedGroceries.get();
//        assertEquals(85.0, groceriesResult.getBudgetActual()); // 150 + 85
//        assertEquals(1, groceriesResult.getTransactions().size());
//
//        // Verify Rent category was merged correctly
//        Optional<TransactionCategory> mergedRent = result.stream()
//                .filter(tc -> tc.getCategoryName().equals("Rent"))
//                .findFirst();
//
//        assertTrue(mergedRent.isPresent());
//        TransactionCategory rentResult = mergedRent.get();
//        assertEquals(800.0, rentResult.getBudgetActual()); // 1200 + 800
//        assertEquals(1, rentResult.getTransactions().size()); // Both transaction IDs
//    }


//    @Test
//    void testBuildTransactionCategoryList_whenCategoryPeriodsIsNull_thenReturnEmptyList(){
//       Budget budget = new Budget(1L, new BigDecimal("320"), new BigDecimal("120"), 1L, "Test Budget", "Test Budget", LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30), LocalDateTime.now());
//       List<TransactionCategory> actual = budgetCategoryBuilder.buildTransactionCategoryList(null, budget);
//       assertEquals(0, actual.size());
//       assertTrue(actual.isEmpty());
//    }
//
//    @Test
//    void testBuildTransactionCategoryList_whenCategoryPeriodsValid_thenReturnTransactionCategoryList() {
//        DateRange dateRange1 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//        DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15));
//        Budget budget = new Budget();
//        budget.setId(1L);
//        budget.setStartDate(LocalDate.of(2024, 11, 1));
//        budget.setEndDate(LocalDate.of(2024, 11, 15));
//        List<Transaction> transactions = List.of(
//                new Transaction("acc1", new BigDecimal("150.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 3), "desc", "merchant", "name", false, "grocery_trans_1",
//                        null, null, LocalDate.of(2024, 11, 3)),
//                new Transaction("acc1", new BigDecimal("200.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 10), "desc", "merchant", "name", false, "grocery_trans_2",
//                        null, null, LocalDate.of(2024, 11, 10))
//        );
//
//        CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//        groceryCriteria.setCategoryDateRanges(List.of(dateRange1, dateRange2));
//        List<BudgetPeriodAmount> budgetedAmounts = List.of(
//                new BudgetPeriodAmount(dateRange1, 200.0),
//                new BudgetPeriodAmount(dateRange2, 250.0));
//
//        List<BudgetPeriodAmount> actualBudgetAmounts = List.of(
//                new BudgetPeriodAmount(dateRange1, 150.0),
//                new BudgetPeriodAmount(dateRange2, 200.0));
//
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", transactions,
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange1, dateRange2), budget, true);
//
//        List<CategoryBudget> categoryPeriods = List.of(groceriesPeriod);
//
//        List<TransactionCategory> result = budgetCategoryBuilder.buildTransactionCategoryList(
//                categoryPeriods, budget);
//
//        assertEquals(2, result.size());
//
//        verifyTransactionCategory(result, "cat1", "Groceries",
//                LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8), 200.0, 150.0, false);
//        verifyTransactionCategory(result, "cat1", "Groceries",
//                LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 15), 250.0, 200.0, false);
//    }
//
//
//    @Test
//    void testGetCategorySpendingByCategoryDesignator_whenParametersValid_thenReturnCategorySpending(){
//       List<CategoryTransactions> categoryDesignators = createTestCategoryDesignators();
//       List<DateRange> budgetDateRanges = List.of(
//               new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
//               new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16)),
//               new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24)),
//               new DateRange(LocalDate.of(2024, 11, 25), LocalDate.of(2024, 11, 30))
//       );
//
//       List<CategoryPeriodSpending> expectedCategorySpendings = List.of(
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("79.56"), new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("32.00"), new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("50.00"), new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("50.00"), new DateRange(LocalDate.of(2024, 11, 25), LocalDate.of(2024, 11, 30))),
//               new CategoryPeriodSpending("cat2", "Rent", new BigDecimal("1200.00"), new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8))),
//               new CategoryPeriodSpending("cat2", "Rent", new BigDecimal("707.00"), new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16)))
//       );
//
//       List<CategoryPeriodSpending> actual = budgetCategoryBuilder.getCategorySpendingByCategoryDesignator(categoryDesignators, budgetDateRanges);
//       assertEquals(expectedCategorySpendings.size(), actual.size());
//        for (int i = 0; i < actual.size(); i++) {
//            CategoryPeriodSpending expected = expectedCategorySpendings.get(i);
//            CategoryPeriodSpending actualSpending = actual.get(i);
//
//            // Log the details of the current test iteration
//            System.out.printf("Testing CategorySpending: [CategoryId: %s, CategoryName: %s, Spending: %s, Range: %s - %s]%n",
//                    expected.getCategoryId(),
//                    expected.getCategoryName(),
//                    expected.getActualSpending(),
//                    expected.getDateRange().getStartDate(),
//                    expected.getDateRange().getEndDate());
//
//            // Perform the assertions
//            assertEquals(expected.getCategoryId(), actualSpending.getCategoryId(), "Mismatch in CategoryId.");
//            assertEquals(expected.getCategoryName(), actualSpending.getCategoryName(), "Mismatch in CategoryName.");
//            assertEquals(expected.getActualSpending(), actualSpending.getActualSpending(), "Mismatch in ActualSpending.");
//            assertEquals(expected.getDateRange().getStartDate(), actualSpending.getDateRange().getStartDate(), "Mismatch in StartDate.");
//            assertEquals(expected.getDateRange().getEndDate(), actualSpending.getDateRange().getEndDate(), "Mismatch in EndDate.");
//        }
//    }
//
//    @Test
//    void testInitializeTransactionCategories_whenBudget_BudgetPeriodAndCategoryDesignatorsAreNull_thenReturnEmptyList(){
//        List<TransactionCategory> actual = budgetCategoryBuilder.initializeTransactionCategories(null, null, null);
//        assertEquals(0, actual.size());
//        assertTrue(actual.isEmpty());
//    }
//
//
//    @Test
//    void testInitializeTransactionCategories_whenBudgetIsNull_thenReturnEmptyList(){
//       BudgetPeriod budgetPeriod = new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30));
//       List<CategoryTransactions> categoryDesignators = List.of(new CategoryTransactions("cat1", "desc"));
//       List<TransactionCategory> result = budgetCategoryBuilder.initializeTransactionCategories(null, budgetPeriod, categoryDesignators);
//       assertEquals(0, result.size());
//       assertTrue(result.isEmpty());
//    }

//    @Test
//    void testInitializeTransactionCategories_whenParametersValid_thenReturnTransactionCategoryList(){
//        Budget budget = createTestBudget();
//        BudgetPeriod budgetPeriod = createTestBudgetPeriod();
//        List<CategoryTransactions> categoryDesignators = createTestCategoryDesignators();
//
//        // Create CategorySpending objects
//        Map<String, List<String>> categorizedTransactions = new HashMap<>();
//        categorizedTransactions.put("Groceries", Arrays.asList("trans_11_02", "trans_11_08", "trans_11_16", "trans_11_23"));
//        categorizedTransactions.put("Rent", Arrays.asList("trans_11_01", "trans_11_16"));
//
//        // Week 1: Nov 1-7
//        TransactionCategory groceryWeek1 = new TransactionCategory();
//        groceryWeek1.setId(1L);
//        groceryWeek1.setBudgetId(budget.getId());
//        groceryWeek1.setCategoryId("cat1");
//        groceryWeek1.setCategoryName("Groceries");
//        groceryWeek1.setBudgetedAmount(96.00);  // Weekly budget allocation
//        groceryWeek1.setBudgetActual(34.32);    // Nov 2 transaction
//        groceryWeek1.setIsActive(true);
//        groceryWeek1.setStartDate(LocalDate.of(2024, 11, 1));
//        groceryWeek1.setEndDate(LocalDate.of(2024, 11, 7));
//        groceryWeek1.setOverSpendingAmount(0.0);
//        groceryWeek1.setOverSpent(false);
//        groceryWeek1.setTransactions(List.of(
//                categoryDesignators.get(0).getTransactions().get(0)  // Nov 2 transaction
//        ));
//
//        // Week 2: Nov 8-14
//        TransactionCategory groceryWeek2 = new TransactionCategory();
//        groceryWeek2.setId(2L);
//        groceryWeek2.setBudgetId(budget.getId());
//        groceryWeek2.setCategoryId("cat1");
//        groceryWeek2.setCategoryName("Groceries");
//        groceryWeek2.setBudgetedAmount(101.0);
//        groceryWeek2.setBudgetActual(45.24);    // Nov 8 transaction
//        groceryWeek2.setIsActive(true);
//        groceryWeek2.setStartDate(LocalDate.of(2024, 11, 8));
//        groceryWeek2.setEndDate(LocalDate.of(2024, 11, 14));
//        groceryWeek2.setOverSpendingAmount(0.0);
//        groceryWeek2.setOverSpent(false);
//        groceryWeek2.setTransactions(List.of(categoryDesignators.get(0).getTransactions().get(1))); // Nov 8 transaction
//
//        // Week 3: Nov 15-21
//        TransactionCategory groceryWeek3 = new TransactionCategory();
//        groceryWeek3.setId(3L);
//        groceryWeek3.setBudgetId(budget.getId());
//        groceryWeek3.setCategoryId("cat1");
//        groceryWeek3.setCategoryName("Groceries");
//        groceryWeek3.setBudgetedAmount(96.00);
//        groceryWeek3.setBudgetActual(32.0);    // Nov 16 transaction
//        groceryWeek3.setIsActive(true);
//        groceryWeek3.setStartDate(LocalDate.of(2024, 11, 15));
//        groceryWeek3.setEndDate(LocalDate.of(2024, 11, 21));
//        groceryWeek3.setOverSpendingAmount(0.0);
//        groceryWeek3.setOverSpent(false);
//        groceryWeek3.setTransactions(List.of(categoryDesignators.get(0).getTransactions().get(2))); // Nov 16 transaction
//
//        TransactionCategory groceryWeek4 = new TransactionCategory();
//        groceryWeek4.setId(4L);
//        groceryWeek4.setBudgetId(budget.getId());
//        groceryWeek4.setCategoryId("cat1");
//        groceryWeek4.setCategoryName("Groceries");
//        groceryWeek4.setBudgetedAmount(105.0);
//        groceryWeek4.setBudgetActual(50.0);    // Nov 16 transaction
//        groceryWeek4.setIsActive(true);
//        groceryWeek4.setStartDate(LocalDate.of(2024, 11, 22));
//        groceryWeek4.setEndDate(LocalDate.of(2024, 11, 28));
//        groceryWeek4.setOverSpendingAmount(0.0);
//        groceryWeek4.setOverSpent(false);
//        groceryWeek4.setTransactions(List.of(categoryDesignators.get(0).getTransactions().get(3))); // Nov 16 transaction
//
//        // Week 1: Nov 1-7 (Rent)
//        TransactionCategory rentWeek1 = new TransactionCategory();
//        rentWeek1.setId(5L);
//        rentWeek1.setBudgetId(budget.getId());
//        rentWeek1.setCategoryId("cat2");
//        rentWeek1.setCategoryName("Rent");
//        rentWeek1.setBudgetedAmount(1200.0);    // Weekly budget allocation
//        rentWeek1.setBudgetActual(1200.00);     // Nov 1 transaction
//        rentWeek1.setIsActive(true);
//        rentWeek1.setStartDate(LocalDate.of(2024, 11, 1));
//        rentWeek1.setEndDate(LocalDate.of(2024, 11, 7));
//        rentWeek1.setOverSpendingAmount(0.0);
//        rentWeek1.setOverSpent(false);
//        rentWeek1.setTransactions(List.of(categoryDesignators.get(1).getTransactions().get(0))); // Nov 1 transaction
//
//        // Week 3: Nov 15-21 (Rent)
//        TransactionCategory rentWeek3 = new TransactionCategory();
//        rentWeek3.setId(6L);
//        rentWeek3.setBudgetId(budget.getId());
//        rentWeek3.setCategoryId("cat2");
//        rentWeek3.setCategoryName("Rent");
//        rentWeek3.setBudgetedAmount(707.0);
//        rentWeek3.setBudgetActual(707.00);      // Nov 16 transaction
//        rentWeek3.setIsActive(true);
//        rentWeek3.setStartDate(LocalDate.of(2024, 11, 15));
//        rentWeek3.setEndDate(LocalDate.of(2024, 11, 21));
//        rentWeek3.setOverSpendingAmount(0.0);
//        rentWeek3.setOverSpent(false);
//        rentWeek3.setTransactions(List.of(categoryDesignators.get(1).getTransactions().get(1))); // Nov 16 transaction
//
//        List<TransactionCategory> expectedTransactionCategories = new ArrayList<>();
//        expectedTransactionCategories.addAll(Arrays.asList(
//                groceryWeek1, groceryWeek2, groceryWeek3, groceryWeek4,
//                rentWeek1, rentWeek3
//        ));
//
//        // Mock budgetCalculator responses for Groceries
//        when(budgetCalculator.calculateBudgetedAmountForCategoryDateRange(
//                any(CategoryPeriodSpending.class),  // Changed from argThat
//                any(BigDecimal.class),
//                anyList(),
//                eq(budget)
//        )).thenAnswer(invocation -> {
//            CategoryPeriodSpending cs = invocation.getArgument(0);
//            if (cs != null && cs.getCategoryName().equals("Groceries")) {
//                return Arrays.asList(
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)), 96.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)), 101.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)), 96.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)), 105.0)
//                );
//            }
//            if (cs != null && cs.getCategoryName().equals("Rent")) {
//                return Arrays.asList(
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)), 1200.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)), 0.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)), 707.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)), 0.0)   // Add this
//                );
//            }
//            return Collections.emptyList();
//        });
//
//        // Mock budgetCalculator responses for actual amounts
//        when(budgetCalculator.calculateActualAmountForCategoryDateRange(
//                any(CategoryPeriodSpending.class),  // Changed from argThat
//                any(CategoryTransactions.class),
//                anyList(),
//                eq(budget)
//        )).thenAnswer(invocation -> {
//            CategoryPeriodSpending cs = invocation.getArgument(0);
//            if (cs != null && cs.getCategoryName().equals("Groceries")) {
//                return Arrays.asList(
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)), 34.32),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)), 45.24),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)), 32.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)), 32.00)
//                );
//            }
//            if (cs != null && cs.getCategoryName().equals("Rent")) {
//                return Arrays.asList(
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 7)), 1200.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 8), LocalDate.of(2024, 11, 14)), 0.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 15), LocalDate.of(2024, 11, 21)), 707.0),
//                        new BudgetPeriodAmount(new DateRange(LocalDate.of(2024, 11, 22), LocalDate.of(2024, 11, 28)), 0.0)
//                );
//            }
//            return Collections.emptyList();
//        });
//
//
//        // Mock budgetCalculator responses
//        when(budgetCalculator.getTotalSpendingOnAllCategories(anyList()))
//                .thenReturn(new BigDecimal("2068.56")); // Total of all transactions
//
//
//        List<TransactionCategory> actualTransactionCategories = budgetCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, categoryDesignators);
//
//        assertNotNull(actualTransactionCategories);
//        assertEquals(expectedTransactionCategories.size(), actualTransactionCategories.size(), "Should have 5 transaction categories (3 grocery + 2 rent)");
//
//        List<TransactionCategory> actualGroceryCategories = actualTransactionCategories.stream()
//                .filter(tc -> tc.getCategoryName().equals("Groceries"))
//                .sorted(Comparator.comparing(TransactionCategory::getStartDate))
//                .collect(Collectors.toList());
//
//        assertEquals(4, actualGroceryCategories.size(), "Should have 3 grocery categories");
//
//        verifyTransactionCategory(groceryWeek1, actualGroceryCategories.get(0));
//        verifyTransactionCategory(groceryWeek2, actualGroceryCategories.get(1));
//        verifyTransactionCategory(groceryWeek3, actualGroceryCategories.get(2));
//
//        // Verify rent categories
//        List<TransactionCategory> actualRentCategories = actualTransactionCategories.stream()
//                .filter(tc -> tc.getCategoryName().equals("Rent"))
//                .sorted(Comparator.comparing(TransactionCategory::getStartDate))
//                .collect(Collectors.toList());
//
//        assertEquals(2, actualRentCategories.size(), "Should have 2 rent categories");
//
//        // Verify each rent week
//        verifyTransactionCategory(rentWeek1, actualRentCategories.get(0));
//        verifyTransactionCategory(rentWeek3, actualRentCategories.get(1));
//    }
//
//    @Test
//    void testInitializeTransactionCategories_whenEmptyTransactionsInCategoryDesignator_thenReturnEmptyList(){
//        Budget budget = createTestBudget();
//        BudgetPeriod budgetPeriod = createTestBudgetPeriod();
//        List<CategoryTransactions> categoryDesignators = createTestCategoryDesignatorNoTransactions();
//        List<TransactionCategory> actual = budgetCategoryBuilder.initializeTransactionCategories(budget, budgetPeriod, categoryDesignators);
//        assertTrue(actual.isEmpty(), "Should return an empty list");
//    }
//
//    @Test
//    void testBuildTransactionCategoryList_whenCategoryPeriodTransactionsAreEmpty_thenReturnEmptyList(){
//       Budget budget = createTestBudget();
//       List<CategoryBudget> categoryPeriods = new ArrayList<>();
//       DateRange dateRange1 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//       DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16));
//       CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//        groceryCriteria.setCategoryDateRanges(List.of(dateRange1, dateRange2));
//        List<BudgetPeriodAmount> budgetedAmounts = List.of(
//                new BudgetPeriodAmount(dateRange1, 200.0),
//                new BudgetPeriodAmount(dateRange2, 250.0));
//
//        List<BudgetPeriodAmount> actualBudgetAmounts = List.of(
//                new BudgetPeriodAmount(dateRange1, 150.0),
//                new BudgetPeriodAmount(dateRange2, 200.0));
//
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", new ArrayList<>(),
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange1, dateRange2), budget, true);
//       categoryPeriods.add(groceriesPeriod);
//
//
//       List<TransactionCategory> actual = budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//       assertTrue(actual.isEmpty(), "Should return an empty list");
//       assertEquals(0, actual.size(), "Should return empty list");
//    }
//
//    @Test
//    void testBuildTransactionCategoryList_whenCategoryBudgetIsNull_thenSkipAndReturnTransactionCategoryList(){
//       Budget budget = createTestBudget();
//       List<CategoryBudget> categoryPeriods = new ArrayList<>();
//       DateRange dateRange1 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//       DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16));
//       CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//       groceryCriteria.setCategoryDateRanges(List.of(dateRange2));
//       List<BudgetPeriodAmount> budgetedAmounts = List.of(new BudgetPeriodAmount(dateRange2, 250.0));
//       List<BudgetPeriodAmount> actualBudgetAmounts = List.of(new BudgetPeriodAmount(dateRange2, 200.0));
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", createGroceryTransactions(),
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange2), budget, true);
//        categoryPeriods.add(null);
//        categoryPeriods.add(groceriesPeriod);
//
//        List<TransactionCategory> expectedTransactionCategories = new ArrayList<>();
//        TransactionCategory groceryTransactionCategory = new TransactionCategory(1L, 1L, "cat1", "Groceries", 250.0, 32.0, true, LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16), 0.0, false);
//        groceryTransactionCategory.setTransactions(List.of(new Transaction("acc1", new BigDecimal("32.00"), "USD", List.of("Groceries"), "cat1",
//                LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                null, null, LocalDate.of(2024, 11, 16))));
//        expectedTransactionCategories.add(groceryTransactionCategory);
//
//        List<TransactionCategory> actual = budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//        assertNotNull(actual, "Should not be null");
//        assertEquals(expectedTransactionCategories.size(), actual.size());
//        for(int i = 0; i < actual.size(); i++){
//            assertEquals(expectedTransactionCategories.get(i).getCategoryId(), actual.get(i).getCategoryId());
//            assertEquals(expectedTransactionCategories.get(i).getCategoryName(), actual.get(i).getCategoryName());
//            assertEquals(expectedTransactionCategories.get(i).getTransactions().size(), actual.get(i).getTransactions().size());
//            assertEquals(expectedTransactionCategories.get(i).getBudgetedAmount(), actual.get(i).getBudgetedAmount());
//            assertEquals(expectedTransactionCategories.get(i).getBudgetActual(), actual.get(i).getBudgetActual());
//            assertEquals(expectedTransactionCategories.get(i).getOverSpendingAmount(), actual.get(i).getOverSpendingAmount());
//            assertEquals(expectedTransactionCategories.get(i).getStartDate(), actual.get(i).getStartDate());
//            assertEquals(expectedTransactionCategories.get(i).getEndDate(), actual.get(i).getEndDate());
//        }
//    }
//
//
//    @Test
//    void testBuildTransactionCategoryList_whenDateRangesListIsEmpty_thenReturnEmptyList(){
//       Budget budget = createTestBudget();
//       List<CategoryBudget> categoryPeriods = new ArrayList<>();
//       DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8));
//       List<BudgetPeriodAmount> budgetedAmounts = List.of(new BudgetPeriodAmount(dateRange2, 250.0));
//       List<BudgetPeriodAmount> budgetActualAmounts = List.of(new BudgetPeriodAmount(dateRange2, 200.0));
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", createGroceryTransactions(),
//                budgetedAmounts, budgetActualAmounts, List.of(), budget, true);
//       categoryPeriods.add(groceriesPeriod);
//
//       List<TransactionCategory> actual = budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//       assertTrue(actual.isEmpty(), "Should return an empty list");
//       assertEquals(0, actual.size(), "Should return empty list");
//    }
//
//
//    @Test
//    void testBuildTransactionCategoryList_whenDateRangeStartDateIsNull_thenThrowException() {
//        Budget budget = createTestBudget();
//        List<CategoryBudget> categoryPeriods = new ArrayList<>();
//        DateRange dateRange2 = new DateRange(null, LocalDate.of(2024, 11, 8));
//        CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//        groceryCriteria.setCategoryDateRanges(List.of(dateRange2));
//        List<BudgetPeriodAmount> budgetedAmounts = List.of(new BudgetPeriodAmount(dateRange2, 250.0));
//        List<BudgetPeriodAmount> actualBudgetAmounts = List.of(new BudgetPeriodAmount(dateRange2, 200.0));
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", createGroceryTransactions(),
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange2), budget, true);
//        categoryPeriods.add(groceriesPeriod);
//        assertThrows(DateRangeException.class, () -> {
//            budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//        });
//    }
//
//    @Test
//    void testBuildTransactionCategoryList_whenDateRangeEndDateIsNull_thenThrowException(){
//        Budget budget = createTestBudget();
//        List<CategoryBudget> categoryPeriods = new ArrayList<>();
//        DateRange dateRange2 = new DateRange(LocalDate.of(2024, 11, 1), null);
//        CategoryPeriodCriteria groceryCriteria = new CategoryPeriodCriteria();
//        groceryCriteria.setCategoryDateRanges(List.of(dateRange2));
//        List<BudgetPeriodAmount> budgetedAmounts = List.of(new BudgetPeriodAmount(dateRange2, 250.0));
//        List<BudgetPeriodAmount> actualBudgetAmounts = List.of(new BudgetPeriodAmount(dateRange2, 200.0));
//        CategoryBudget groceriesPeriod = CategoryBudget.buildCategoryBudget("cat1", "Groceries", createGroceryTransactions(),
//                budgetedAmounts, actualBudgetAmounts, List.of(dateRange2), budget, true);
//        categoryPeriods.add(groceriesPeriod);
//        assertThrows(DateRangeException.class, () -> {
//            budgetCategoryBuilder.buildTransactionCategoryList(categoryPeriods, budget);
//        });
//    }
//
//    private void verifyTransactionCategory(TransactionCategory expected, TransactionCategory actual) {
//        String categoryInfo = String.format("Category: %s, Period: %s to %s",
//                expected.getCategoryName(),
//                expected.getStartDate(),
//                expected.getEndDate());
//
//        assertEquals(expected.getCategoryName(), actual.getCategoryName(),
//                "Category name mismatch for " + categoryInfo);
//
//        assertEquals(expected.getStartDate(), actual.getStartDate(),
//                "Start date mismatch for " + categoryInfo);
//
//        assertEquals(expected.getEndDate(), actual.getEndDate(),
//                "End date mismatch for " + categoryInfo);
//
//        assertEquals(expected.getBudgetedAmount(), actual.getBudgetedAmount(),
//                "Budgeted amount mismatch for " + categoryInfo);
//
//        assertEquals(expected.getBudgetActual(), actual.getBudgetActual(),
//                "Budget actual mismatch for " + categoryInfo);
//
//        assertEquals(expected.getOverSpendingAmount(), actual.getOverSpendingAmount(),
//                "Overspending amount mismatch for " + categoryInfo);
//
//        assertEquals(expected.isOverSpent(), actual.isOverSpent(),
//                "Overspent flag mismatch for " + categoryInfo);
//
//        assertEquals(expected.getTransactions().size(), actual.getTransactions().size(),
//                "Transaction count mismatch for " + categoryInfo);
//    }
//
//    @Test
//    void testBuildCategoryPeriodDateRanges_whenValidBudgetDateRangesAndCategorySpending_thenReturnDateRanges(){
//       List<DateRange> budgetDateRanges = List.of(
//               new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)),
//               new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16)),
//               new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24)),
//               new DateRange(LocalDate.of(2024, 11, 25), LocalDate.of(2024, 11, 30))
//       );
//       List<CategoryPeriodSpending> categorySpendings = List.of(
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("120"), new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("95"), new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16))),
//               new CategoryPeriodSpending("cat1", "Groceries", new BigDecimal("101"), new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24))),
//               new CategoryPeriodSpending("cat2", "Rent", new BigDecimal("1200"), new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8))),
//               new CategoryPeriodSpending("cat2", "Rent", new BigDecimal("707"), new DateRange(LocalDate.of(2024, 11, 16), LocalDate.of(2024, 11, 24)))
//       );
//
//       List<DateRange> categoryPeriodDateRanges = new ArrayList<>();
//       categoryPeriodDateRanges.add(new DateRange(LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 8)));
//       categoryPeriodDateRanges.add(new DateRange(LocalDate.of(2024, 11, 9), LocalDate.of(2024, 11, 16)));
//       categoryPeriodDateRanges.add(new DateRange(LocalDate.of(2024, 11, 17), LocalDate.of(2024, 11, 24)));
//
//       List<DateRange> actual = budgetCategoryBuilder.buildCategoryPeriodDateRanges(budgetDateRanges, categorySpendings);
//       assertNotNull(actual);
//       assertEquals(categoryPeriodDateRanges.size(), actual.size());
//       for(int i = 0; i < actual.size(); i++) {
//           DateRange actualDateRange = actual.get(i);
//           DateRange expectedDateRange = categoryPeriodDateRanges.get(i);
//
//           assertEquals(expectedDateRange.getStartDate(), actualDateRange.getStartDate());
//           assertEquals(expectedDateRange.getEndDate(), actualDateRange.getEndDate());
//       }
//
//    }
//
//    private List<CategoryTransactions> createTestCategoryDesignatorNoTransactions(){
//       List<CategoryTransactions> categoryDesignators = new ArrayList<>();
//       CategoryTransactions testCategoryDesignator = new CategoryTransactions("cat1", "Groceries");
//       List<Transaction> transactions = new ArrayList<>();
//       testCategoryDesignator.setTransactions(transactions);
//       categoryDesignators.add(testCategoryDesignator);
//       return categoryDesignators;
//    }
//
//    private List<Transaction> createGroceryTransactions(){
//        return List.of(
//                new Transaction("acc1", new BigDecimal("34.32"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "trans_11_02",
//                        null, null, LocalDate.of(2024, 11, 2)),
//                new Transaction("acc1", new BigDecimal("45.24"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 8), "desc", "merchant", "name", false, "trans_11_08",
//                        null, null, LocalDate.of(2024, 11, 8)),
//                new Transaction("acc1", new BigDecimal("32.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                        null, null, LocalDate.of(2024, 11, 16)),
//                new Transaction("acc1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 23), "desc", "merchant", "name", false, "trans_11_23",
//                        null, null, LocalDate.of(2024, 11, 23))
//        );
//    }
//
//    private List<CategoryTransactions> createTestCategoryDesignators(){
//        List<CategoryTransactions> categoryDesignators = new ArrayList<>();
//        CategoryTransactions groceryDesignator = new CategoryTransactions("cat1", "Groceries");
//        List<Transaction> groceryTransactions = List.of(
//                new Transaction("acc1", new BigDecimal("34.32"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 2), "desc", "merchant", "name", false, "trans_11_02",
//                        null, null, LocalDate.of(2024, 11, 2)),
//                new Transaction("acc1", new BigDecimal("45.24"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 8), "desc", "merchant", "name", false, "trans_11_08",
//                        null, null, LocalDate.of(2024, 11, 8)),
//                new Transaction("acc1", new BigDecimal("32.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                        null, null, LocalDate.of(2024, 11, 16)),
//                new Transaction("acc1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 23), "desc", "merchant", "name", false, "trans_11_23",
//                        null, null, LocalDate.of(2024, 11, 23)),
//                new Transaction("acc1", new BigDecimal("50.00"), "USD", List.of("Groceries"), "cat1",
//                        LocalDate.of(2024, 11, 25), "desc", "merchant", "name", false, "trans_11_23",
//                        null, null, LocalDate.of(2024, 11, 25))
//
//        );
//
//        groceryDesignator.setTransactions(groceryTransactions);
//        categoryDesignators.add(groceryDesignator);
//
//        CategoryTransactions rentDesignator = new CategoryTransactions("cat2", "Rent");
//        List<Transaction> rentTransactions = List.of(
//                new Transaction("acc1", new BigDecimal("1200.00"), "USD", List.of("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 1), "desc", "merchant", "name", false, "trans_11_01",
//                        null, null, LocalDate.of(2024, 11, 1)),
//                new Transaction("acc1", new BigDecimal("707.00"), "USD", List.of("Rent"), "cat2",
//                        LocalDate.of(2024, 11, 16), "desc", "merchant", "name", false, "trans_11_16",
//                        null, null, LocalDate.of(2024, 11, 16))
//        );
//        rentDesignator.setTransactions(rentTransactions);
//        categoryDesignators.add(rentDesignator);
//        return categoryDesignators;
//    }
//
//    private BudgetPeriod createTestBudgetPeriod()
//    {
//       return new BudgetPeriod(Period.WEEKLY, LocalDate.of(2024, 11, 1), LocalDate.of(2024, 11, 30));
//    }
//
//    private Budget createTestBudget(){
//       Budget budget = new Budget();
//       budget.setBudgetAmount(new BigDecimal("3260"));
//       budget.setActual(new BigDecimal("1609"));
//       budget.setId(1L);
//       budget.setStartDate(LocalDate.of(2024, 11, 1));
//       budget.setEndDate(LocalDate.of(2024, 11, 30));
//       return budget;
//    }
//
//    private void verifyDateRanges(List<DateRange> actual, List<DateRange> expected) {
//        assertEquals(expected.size(), actual.size(), "Date range size mismatch");
//        for (int i = 0; i < expected.size(); i++) {
//            assertEquals(expected.get(i).getStartDate(), actual.get(i).getStartDate(),
//                    "Start date mismatch at index " + i);
//            assertEquals(expected.get(i).getEndDate(), actual.get(i).getEndDate(),
//                    "End date mismatch at index " + i);
//        }
//    }
//
//    private RecurringTransaction createWalmartRecurringTransaction() {
//        return new RecurringTransaction(
//                "account-12345",                  // accountId
//                new BigDecimal("50.75"),          // amount
//                "USD",                            // isoCurrencyCode
//                List.of("Groceries"),             // categories
//                "cat-001",                        // categoryId
//                LocalDate.of(2024, 11, 1),        // date
//                "Walmart Purchase",               // description
//                "Walmart",                        // merchantName
//                "Walmart Grocery Purchase",       // name
//                false,                            // pending
//                "txn-12345",                      // transactionId
//                LocalDate.of(2024, 11, 1),        // authorizedDate
//                "https://example.com/logo.png",   // logoUrl
//                LocalDate.of(2024, 10, 2),        // posted
//                "stream-67890",                   // streamId
//                LocalDate.of(2024, 10, 1),        // firstDate
//                LocalDate.of(2025, 10, 1),        // lastDate
//                "WEEKLY",                         // frequency
//                new BigDecimal("60.00"),          // averageAmount
//                new BigDecimal("50.75"),          // lastAmount
//                true,                             // active
//                "Subscription"                    // type
//        );
//    }
//
//    private RecurringTransaction createWincoRecurringTransaction() {
//        return new RecurringTransaction(
//                "account-12345",                  // accountId
//                new BigDecimal("50.75"),          // amount
//                "USD",                            // isoCurrencyCode
//                List.of("Groceries"),             // categories
//                "cat-001",                        // categoryId
//                LocalDate.of(2024, 11, 5),        // date
//                "WINCO Purchase",                 // description
//                "WINCO",                          // merchantName
//                "WINCO Grocery Purchase",         // name
//                false,                            // pending
//                "txn-12345",                      // transactionId
//                LocalDate.of(2024, 11, 6),        // authorizedDate
//                "https://example.com/logo.png",   // logoUrl
//                LocalDate.of(2024, 10, 5),        // posted
//                "stream-54321",                   // streamId
//                LocalDate.of(2024, 9, 1),         // firstDate
//                LocalDate.of(2025, 9, 1),         // lastDate
//                "BIWEEKLY",                       // frequency
//                new BigDecimal("70.00"),          // averageAmount
//                new BigDecimal("50.75"),          // lastAmount
//                true,                             // active
//                "Subscription"                    // type
//        );
//    }
//
//    private TransactionLink createTransactionLink(Transaction transaction, String category){
//        return new TransactionLink(category, transaction.getTransactionId());
//    }
//
//    private TransactionCategory createUserBudgetCategory(String categoryId, String categoryName, Double budgetedAmount, Double actualAmount, LocalDate startDate, LocalDate endDate, Long userId) {
//        TransactionCategory category = new TransactionCategory();
//        category.setCategoryId(categoryId);
//        category.setCategoryName(categoryName);
//        category.setBudgetedAmount(budgetedAmount);
//        category.setBudgetActual(actualAmount);
//        category.setStartDate(startDate);
//        category.setEndDate(endDate);
//        category.setIsActive(true); // Assuming all categories are active for this test
//        return category;
//    }
//
//    private TransactionCategory createGasBudgetCategory(LocalDate startDate, LocalDate endDate, Double actual, Double budgetAmount)
//    {
//        TransactionCategory gasBudgetCategory = new TransactionCategory();
//        gasBudgetCategory.setCategoryId("cat-003");
//        gasBudgetCategory.setBudgetedAmount(budgetAmount);
//        gasBudgetCategory.setCategoryName("Gas");
//        gasBudgetCategory.setBudgetActual(actual);
//        gasBudgetCategory.setIsActive(true);
//        gasBudgetCategory.setStartDate(startDate);
//        gasBudgetCategory.setEndDate(endDate);
//        return gasBudgetCategory;
//    }
//
//    private TransactionCategory createGroceriesCategory(LocalDate startDate, LocalDate endDate)
//    {
//        TransactionCategory groceriesCategory = new TransactionCategory();
//        groceriesCategory.setCategoryId("cat-001");
//        groceriesCategory.setBudgetedAmount(450.00);
//        groceriesCategory.setBudgetActual(120.00);
//        groceriesCategory.setCategoryName("Groceries");
//        groceriesCategory.setIsActive(true);
//        groceriesCategory.setStartDate(startDate);
//        groceriesCategory.setEndDate(endDate);
//        return groceriesCategory;
//    }
//
//    private TransactionCategory createPaymentCategory(LocalDate startDate, LocalDate endDate)
//    {
//        TransactionCategory paymentCategory = new TransactionCategory();
//        paymentCategory.setCategoryId("cat-222");
//        paymentCategory.setCategoryName("Payments");
//        paymentCategory.setBudgetedAmount(149.00);
//        paymentCategory.setBudgetActual(120.00);
//        paymentCategory.setIsActive(true);
//        paymentCategory.setStartDate(startDate);
//        paymentCategory.setEndDate(endDate);
//        return paymentCategory;
//    }
//
//    private Transaction createAffirmTransaction(){
//        return new Transaction(
//                "account-12345",               // accountId
//                new BigDecimal("50.75"),       // amount
//                "USD",                         // isoCurrencyCode
//                List.of("Payments"),  // categories
//                "cat-005",                     // categoryId
//                LocalDate.of(2024, 11, 5),     // date
//                "Affirm Purchase",            // description
//                "Affirm",                     // merchantName
//                "Affirm Payment",    // name
//                false,                         // pending
//                "txn-12345",                   // transactionId
//                LocalDate.of(2024, 11, 4),     // authorizedDate
//                "https://example.com/logo.png", // logoUrl
//                LocalDate.of(2024, 11, 5)      // posted
//        );
//    }
//
//    private Transaction createTransactionExample(LocalDate posted, List<String> categories, String categoryId, String description, String merchant, String name, BigDecimal amount){
//        return new Transaction(
//                "account-12345",
//                amount,
//                "USD",
//                categories,
//                categoryId,
//                posted,
//                description,
//                merchant,
//                name,
//                false,
//                "txn-12345",
//                posted,
//                "https://example.com/logo.png",
//                posted
//        );
//    }

    private Transaction createWalmartTransaction() {
        return new Transaction(
                "account-12345",               // accountId
                new BigDecimal("50.75"),       // amount
                "USD",                         // isoCurrencyCode
                List.of("Groceries"),  // categories
                "cat-001",                     // categoryId
                LocalDate.of(2024, 11, 1),     // date
                "Walmart Purchase",            // description
                "Walmart",                     // merchantName
                "Walmart Grocery Purchase",    // name
                false,                         // pending
                "txn-12345",                   // transactionId
                LocalDate.of(2024, 11, 1),     // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 10, 2)      // posted
        );
    }

    private Transaction createWincoTransaction(){
        return new Transaction(
                "account-12345",               // accountId
                new BigDecimal("50.75"),       // amount
                "USD",                         // isoCurrencyCode
                List.of("Groceries"),  // categories
                "cat-001",                     // categoryId
                LocalDate.of(2024, 11, 5),     // date
                "WINCO Purchase",            // description
                "WINCO",                     // merchantName
                "WINCO Grocery Purchase",    // name
                false,                         // pending
                "txn-12345",                   // transactionId
                LocalDate.of(2024, 11, 6),     // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 10, 5)      // posted
        );
    }


    private Transaction createGasTransaction() {
        return new Transaction(
                "account-12345",               // accountId
                new BigDecimal("50.75"),       // amount
                "USD",                         // isoCurrencyCode
                List.of("Gas"),  // categories
                "cat-003",                     // categoryId
                LocalDate.of(2024, 11, 4),     // date
                "PIN Purchase - MAVERICK",            // description
                "MAVERICK",                     // merchantName
                "PIN Purcahse - MAVERICK",    // name
                false,                         // pending
                "txn-12345",                   // transactionId
                LocalDate.of(2024, 11, 4),     // authorizedDate
                "https://example.com/logo.png", // logoUrl
                LocalDate.of(2024, 11, 5)      // posted
        );
    }

    private RecurringTransaction createAffirmRecurringTransaction() {
        return new RecurringTransaction(
                "account-12345",                  // accountId
                new BigDecimal("50.75"),          // amount
                "USD",                            // isoCurrencyCode
                List.of("Payments"),              // categories
                "cat-005",                        // categoryId
                LocalDate.of(2024, 11, 5),        // date
                "Affirm Purchase",                // description
                "Affirm",                         // merchantName
                "Affirm Payment",                 // name
                false,                            // pending
                "txn-12345",                      // transactionId
                LocalDate.of(2024, 11, 4),        // authorizedDate
                "https://example.com/logo.png",   // logoUrl
                LocalDate.of(2024, 11, 5),        // posted
                "stream-12345",                   // streamId
                LocalDate.of(2024, 10, 1),        // firstDate
                LocalDate.of(2024, 12, 1),        // lastDate
                "MONTHLY",                        // frequency
                new BigDecimal("50.75"),          // averageAmount
                new BigDecimal("50.75"),          // lastAmount
                true,                             // active
                "Subscription"                    // type
        );
    }

    private RecurringTransaction createRecurringTransactionExample(LocalDate posted, List<String> categories, String categoryId, String description, String merchant, String name, BigDecimal amount) {
        return new RecurringTransaction(
                "account-12345",                  // accountId
                amount,                           // amount
                "USD",                            // isoCurrencyCode
                categories,                       // categories
                categoryId,                       // categoryId
                posted,                           // date
                description,                      // description
                merchant,                         // merchantName
                name,                             // name
                false,                            // pending
                "txn-12345",                      // transactionId
                posted,                           // authorizedDate
                "https://example.com/logo.png",   // logoUrl
                posted,                           // posted
                "stream-12345",                   // streamId
                LocalDate.of(2024, 1, 1),         // firstDate
                LocalDate.of(2024, 12, 31),       // lastDate
                "MONTHLY",                        // frequency
                new BigDecimal("100.00"),         // averageAmount
                amount,                           // lastAmount
                true,                             // active
                "Bill"                            // type
        );
    }

    @AfterEach
    void tearDown() {
    }
}