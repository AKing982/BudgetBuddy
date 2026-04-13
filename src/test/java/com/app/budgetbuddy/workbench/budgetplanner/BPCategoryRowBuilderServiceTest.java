package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPCategoryGroupService;
import com.app.budgetbuddy.services.BudgetCategoryService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BPCategoryRowBuilderServiceTest
{

    @Mock
    private BPCategoryGroupService categoryGroupService;

    @Mock
    private BudgetCategoryService budgetCategoryService;

    @Mock
    private BPAccountBalanceEngine accountBalanceEngine;

    @InjectMocks
    private BPCategoryRowBuilderService bpCategoryRowBuilderService;

    private SubBudget subBudget;

    private LocalDate lastPayDate;
    private LocalDate nextPayDate;

    @BeforeEach
    void setUp() {

        subBudget = new SubBudget();
        subBudget.setId(1L);
        subBudget.setBudget(new Budget());
        subBudget.getBudget().setId(1L);
        subBudget.setStartDate(LocalDate.of(2025, 1, 1));
        subBudget.setEndDate(LocalDate.of(2025, 12, 31));
        subBudget.setSubSavingsTarget(BigDecimal.valueOf(200));
        subBudget.setSubSavingsAmount(BigDecimal.valueOf(100));
        subBudget.setAllocatedAmount(BigDecimal.valueOf(3250));
        subBudget.setActive(true);

        lastPayDate = LocalDate.of(2025, 1, 1);
        nextPayDate = LocalDate.of(2025, 1, 15);
    }

    @Test
    void testBuildBPIncomes_whenSubBudgetIsNull_thenReturnEmptyCollection()
    {
        BPIncomeCriteria incomeCriteria = new BPIncomeCriteria(
                new BigDecimal("3988"), lastPayDate, nextPayDate, PayPeriod.MONTHLY);
        List<BPColumn> columns = List.of(
                new BPColumn(0, new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)), Period.MONTHLY, BPColumnType.ACTUAL, false));

        List<BPCategory> actual = bpCategoryRowBuilderService.buildBPIncomes(null, incomeCriteria, columns);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildBPIncomes_whenIncomeAndSubBudgetAreNull_thenThrowException()
    {
        List<BPColumn> columns = List.of(
                new BPColumn(0, new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)), Period.MONTHLY, BPColumnType.ACTUAL, false));

        assertThrows(DataException.class,
                () -> bpCategoryRowBuilderService.buildBPIncomes(null, null, columns));
    }

    @Test
    void testBuildBPIncomes_whenColumnsIsNull_thenReturnEmptyCollection()
    {
        BPIncomeCriteria incomeCriteria = new BPIncomeCriteria(
                new BigDecimal("3988"), lastPayDate, nextPayDate, PayPeriod.MONTHLY);

        List<BPCategory> actual = bpCategoryRowBuilderService.buildBPIncomes(subBudget, incomeCriteria, null);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }


    @Test
    void testBuildBPIncomes_whenColumnsIsEmpty_thenReturnEmptyCollection()
    {
        BPIncomeCriteria incomeCriteria = new BPIncomeCriteria(
                new BigDecimal("3988"), lastPayDate, nextPayDate, PayPeriod.MONTHLY);

        List<BPCategory> actual = bpCategoryRowBuilderService.buildBPIncomes(subBudget, incomeCriteria, Collections.emptyList());

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildBPIncomes_whenIncomeNotNull_thenReturnBPCategoryList()
    {
        BigDecimal income = new BigDecimal("3988");
        BPColumn janColumn = new BPColumn(0, new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)), Period.MONTHLY, BPColumnType.ACTUAL, false);
        BPColumn febColumn = new BPColumn(1, new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)), Period.MONTHLY, BPColumnType.ACTUAL, false);
        List<BPColumn> columns = List.of(janColumn, febColumn);

        BPIncomeCriteria incomeCriteria = new BPIncomeCriteria(
                income, lastPayDate, nextPayDate, PayPeriod.MONTHLY);

        List<BPCategory> expected = List.of(
                BPCategory.builder()
                        .name("Salary").type(BPType.INCOME)
                        .range(janColumn.getDateRange()).actual(income)
                        .budgeted(BigDecimal.ZERO).isActive(true)
                        .isGroupHeader(false).columnIndex(0).build(),
                BPCategory.builder()
                        .name("Salary").type(BPType.INCOME)
                        .range(febColumn.getDateRange()).actual(income)
                        .budgeted(BigDecimal.ZERO).isActive(true)
                        .isGroupHeader(false).columnIndex(1).build()
        );

        List<BPCategory> actual = bpCategoryRowBuilderService.buildBPIncomes(subBudget, incomeCriteria, columns);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).getName(),        actual.get(i).getName());
            assertEquals(expected.get(i).getRange(),       actual.get(i).getRange());
            assertEquals(expected.get(i).getType(),        actual.get(i).getType());
            assertEquals(expected.get(i).getBudgeted(),    actual.get(i).getBudgeted());
            assertEquals(0, expected.get(i).getActual().compareTo(actual.get(i).getActual()));
            assertEquals(expected.get(i).getColumnIndex(), actual.get(i).getColumnIndex());
        }
    }

    @Test
    void testBuildBPIncomes_whenIncomeIsNull_thenReturnCategoryListFromService()
    {
        BigDecimal janIncomeFetched = new BigDecimal("2548.23");
        BigDecimal febIncomeFetched = new BigDecimal("2257.57");
        BPColumn janColumn = new BPColumn(0, new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)), Period.MONTHLY, BPColumnType.ACTUAL, false);
        BPColumn febColumn = new BPColumn(1, new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)), Period.MONTHLY, BPColumnType.ACTUAL, false);
        List<BPColumn> columns = List.of(janColumn, febColumn);

        BPIncomeCriteria incomeCriteria = new BPIncomeCriteria(
                null, lastPayDate, nextPayDate, PayPeriod.MONTHLY);

        when(budgetCategoryService.getTotalIncomeByDateRange(
                subBudget.getId(), LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)))
                .thenReturn(janIncomeFetched);
        when(budgetCategoryService.getTotalIncomeByDateRange(
                subBudget.getId(), LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)))
                .thenReturn(febIncomeFetched);

        List<BPCategory> expected = List.of(
                BPCategory.builder()
                        .name("Salary").type(BPType.INCOME)
                        .range(janColumn.getDateRange()).actual(janIncomeFetched)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(0).build(),
                BPCategory.builder()
                        .name("Salary").type(BPType.INCOME)
                        .range(febColumn.getDateRange()).actual(febIncomeFetched)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(1).build()
        );

        List<BPCategory> actual = bpCategoryRowBuilderService.buildBPIncomes(subBudget, incomeCriteria, columns);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).getName(),        actual.get(i).getName());
            assertEquals(expected.get(i).getRange(),       actual.get(i).getRange());
            assertEquals(expected.get(i).getType(),        actual.get(i).getType());
            assertEquals(0, expected.get(i).getActual().compareTo(actual.get(i).getActual()));
            assertEquals(expected.get(i).getColumnIndex(), actual.get(i).getColumnIndex());
        }
    }


    @Test
    void testBuildBPIncomes_whenPeriodIsWeekly_thenReturnWeeklyBPIncomes()
    {
        BigDecimal monthlyIncome = new BigDecimal("3988.88");
        BPColumn janWeek1 = new BPColumn(0, new DateRange(LocalDate.of(2025, 1, 1),  LocalDate.of(2025, 1, 7)),  Period.WEEKLY, BPColumnType.ACTUAL, false);
        BPColumn janWeek2 = new BPColumn(1, new DateRange(LocalDate.of(2025, 1, 8),  LocalDate.of(2025, 1, 14)), Period.WEEKLY, BPColumnType.ACTUAL, false);
        BPColumn janWeek3 = new BPColumn(2, new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 21)), Period.WEEKLY, BPColumnType.ACTUAL, false);
        BPColumn janWeek4 = new BPColumn(3, new DateRange(LocalDate.of(2025, 1, 22), LocalDate.of(2025, 1, 28)), Period.WEEKLY, BPColumnType.ACTUAL, false);
        BPColumn janWeek5 = new BPColumn(4, new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 1, 31)), Period.WEEKLY, BPColumnType.ACTUAL, false);
        List<BPColumn> columns = List.of(janWeek1, janWeek2, janWeek3, janWeek4, janWeek5);

        // lastPayDate = 2025-01-01 falls in janWeek1
        // nextPayDate = 2025-01-15 falls in janWeek3
        // janWeek2, janWeek4, janWeek5 get zero — no pay date falls in those ranges
        BPIncomeCriteria incomeCriteria = new BPIncomeCriteria(
                monthlyIncome, lastPayDate, nextPayDate, PayPeriod.WEEKLY);

        BigDecimal weeklyIncome = monthlyIncome.divide(new BigDecimal(2), 2, RoundingMode.HALF_UP);
        List<BPCategory> expected = List.of(
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(janWeek1.getDateRange()).actual(weeklyIncome)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(0).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(janWeek2.getDateRange()).actual(BigDecimal.ZERO)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(1).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(janWeek3.getDateRange()).actual(weeklyIncome)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(2).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(janWeek4.getDateRange()).actual(BigDecimal.ZERO)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(3).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(janWeek5.getDateRange()).actual(BigDecimal.ZERO)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(4).build()
        );

        List<BPCategory> actual = bpCategoryRowBuilderService.buildBPIncomes(subBudget, incomeCriteria, columns);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).getName(),        actual.get(i).getName());
            assertEquals(expected.get(i).getRange(),       actual.get(i).getRange());
            assertEquals(expected.get(i).getType(),        actual.get(i).getType());
            assertEquals(0, expected.get(i).getActual().compareTo(actual.get(i).getActual()),
                    "Income mismatch at column " + i);
            assertEquals(expected.get(i).getColumnIndex(), actual.get(i).getColumnIndex());
        }
    }

    @Test
    void testBuildBPIncomes_whenPeriodIsBiweekly_thenReturnBiweeklyBPIncomes()
    {
        BigDecimal monthlyIncome = new BigDecimal("3988.88");
        BPColumn biWeek1 = new BPColumn(0, new DateRange(LocalDate.of(2025, 1, 1),  LocalDate.of(2025, 1, 14)), Period.BIWEEKLY, BPColumnType.ACTUAL, false);
        BPColumn biWeek2 = new BPColumn(1, new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 28)), Period.BIWEEKLY, BPColumnType.ACTUAL, false);
        BPColumn biWeek3 = new BPColumn(2, new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 2, 11)), Period.BIWEEKLY, BPColumnType.ACTUAL, false);
        BPColumn biWeek4 = new BPColumn(3, new DateRange(LocalDate.of(2025, 2, 12), LocalDate.of(2025, 2, 25)), Period.BIWEEKLY, BPColumnType.ACTUAL, false);
        List<BPColumn> columns = List.of(biWeek1, biWeek2, biWeek3, biWeek4);

        // lastPayDate = 2025-01-01 falls in biWeek1
        // nextPayDate = 2025-01-15 falls in biWeek2
        // biWeek3 and biWeek4 have no pay date — get zero
        BPIncomeCriteria incomeCriteria = new BPIncomeCriteria(
                monthlyIncome, lastPayDate, nextPayDate, PayPeriod.BIWEEKLY);

        BigDecimal biWeeklyIncome = monthlyIncome.divide(new BigDecimal(2), 2, RoundingMode.HALF_UP);

        List<BPCategory> expected = List.of(
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(biWeek1.getDateRange()).actual(biWeeklyIncome)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(0).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(biWeek2.getDateRange()).actual(biWeeklyIncome)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(1).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(biWeek3.getDateRange()).actual(BigDecimal.ZERO)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(2).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(biWeek4.getDateRange()).actual(BigDecimal.ZERO)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(3).build()
        );

        List<BPCategory> actual = bpCategoryRowBuilderService.buildBPIncomes(subBudget, incomeCriteria, columns);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).getName(),        actual.get(i).getName());
            assertEquals(expected.get(i).getRange(),       actual.get(i).getRange());
            assertEquals(expected.get(i).getType(),        actual.get(i).getType());
            assertEquals(0, expected.get(i).getActual().compareTo(actual.get(i).getActual()),
                    "Income mismatch at column " + i);
            assertEquals(expected.get(i).getColumnIndex(), actual.get(i).getColumnIndex());
        }
    }

    @Test
    void testBuildBPIncomes_whenBiweeklyColumnsAndPayDatesNotOnFirstOrFifteenth_thenReturnCorrectIncome()
    {
        BigDecimal monthlyIncome = new BigDecimal("3988.88");

        LocalDate lastPayDate     = LocalDate.of(2025, 1, 6);
        LocalDate nextPayDate     = LocalDate.of(2025, 1, 20);
        // interval = 14 days
        // pay dates: Jan 6, Jan 20, Feb 3, Feb 17 ...
        // Jan 6  → biWeek1 (1/1  - 1/14)  ✓
        // Jan 20 → biWeek2 (1/15 - 1/28)  ✓
        // Feb 3  → biWeek3 (1/29 - 2/11)  ✓
        // Feb 17 → biWeek4 (2/12 - 2/25)  ✓

        BPColumn biWeek1 = new BPColumn(0, new DateRange(LocalDate.of(2025, 1, 1),  LocalDate.of(2025, 1, 14)), Period.BIWEEKLY, BPColumnType.ACTUAL, false);
        BPColumn biWeek2 = new BPColumn(1, new DateRange(LocalDate.of(2025, 1, 15), LocalDate.of(2025, 1, 28)), Period.BIWEEKLY, BPColumnType.ACTUAL, false);
        BPColumn biWeek3 = new BPColumn(2, new DateRange(LocalDate.of(2025, 1, 29), LocalDate.of(2025, 2, 11)), Period.BIWEEKLY, BPColumnType.ACTUAL, false);
        BPColumn biWeek4 = new BPColumn(3, new DateRange(LocalDate.of(2025, 2, 12), LocalDate.of(2025, 2, 25)), Period.BIWEEKLY, BPColumnType.ACTUAL, false);
        List<BPColumn> columns = List.of(biWeek1, biWeek2, biWeek3, biWeek4);

        BPIncomeCriteria incomeCriteria = new BPIncomeCriteria(
                monthlyIncome, lastPayDate, nextPayDate, PayPeriod.BIWEEKLY);

        BigDecimal biWeeklyIncome = monthlyIncome.divide(new BigDecimal(2), 2, RoundingMode.HALF_UP);

        List<BPCategory> expected = List.of(
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(biWeek1.getDateRange()).actual(biWeeklyIncome)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(0).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(biWeek2.getDateRange()).actual(biWeeklyIncome)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(1).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(biWeek3.getDateRange()).actual(biWeeklyIncome)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(2).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME)
                        .range(biWeek4.getDateRange()).actual(biWeeklyIncome)
                        .budgeted(BigDecimal.ZERO).isActive(true).columnIndex(3).build()
        );

        List<BPCategory> actual = bpCategoryRowBuilderService.buildBPIncomes(subBudget, incomeCriteria, columns);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).getName(),        actual.get(i).getName());
            assertEquals(expected.get(i).getRange(),       actual.get(i).getRange());
            assertEquals(expected.get(i).getType(),        actual.get(i).getType());
            assertEquals(0, expected.get(i).getActual().compareTo(actual.get(i).getActual()),
                    "Income mismatch at column " + i);
            assertEquals(expected.get(i).getColumnIndex(), actual.get(i).getColumnIndex());
        }
    }

    @Test
    void testBuildBudgetCategoryGroups_whenUserIdInvalid_thenReturnEmptyList(){
        Long userId = -1L;
        List<String> categoryHeaders = List.of("Housing", "Food");
        List<BPCategory> actual = bpCategoryRowBuilderService.buildBudgetCategoryGroups(userId, categoryHeaders);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildBudgetCategoryGroups_whenCategoryHeadersEmpty_thenReturnEmptyList(){
        Long userId = 1L;
        List<String> categoryHeaders = List.of();
        List<BPCategory> actual = bpCategoryRowBuilderService.buildBudgetCategoryGroups(userId, categoryHeaders);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildBudgetCategoryGroups_whenCategoryHeadersValid_thenReturnGroupHeaders()
    {
        Long userId = 1L;
        List<String> categoryHeaders = List.of("Housing", "Food", "Trip", "Entertainment");

        List<BPCategory> expected = List.of(
                BPCategory.builder().name("Housing").type(BPType.HEADER)
                        .isActive(true).isGroupHeader(true)
                        .actual(BigDecimal.ZERO).budgeted(BigDecimal.ZERO).columnIndex(0).build(),
                BPCategory.builder().name("Food").type(BPType.HEADER)
                        .isActive(true).isGroupHeader(true)
                        .actual(BigDecimal.ZERO).budgeted(BigDecimal.ZERO).columnIndex(0).build(),
                BPCategory.builder().name("Trip").type(BPType.HEADER)
                        .isActive(true).isGroupHeader(true)
                        .actual(BigDecimal.ZERO).budgeted(BigDecimal.ZERO).columnIndex(0).build(),
                BPCategory.builder().name("Entertainment").type(BPType.HEADER)
                        .isActive(true).isGroupHeader(true)
                        .actual(BigDecimal.ZERO).budgeted(BigDecimal.ZERO).columnIndex(0).build()
        );

        List<BPCategory> actual = bpCategoryRowBuilderService.buildBudgetCategoryGroups(userId, categoryHeaders);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for(int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).getName(),         actual.get(i).getName());
            assertEquals(expected.get(i).getType(),         actual.get(i).getType());
            assertEquals(expected.get(i).isActive(),        actual.get(i).isActive());
            assertEquals(expected.get(i).isGroupHeader(),   actual.get(i).isGroupHeader());
            assertEquals(expected.get(i).getColumnIndex(),  actual.get(i).getColumnIndex());
            assertEquals(0, expected.get(i).getBudgeted().compareTo(actual.get(i).getBudgeted()));
            assertEquals(0, expected.get(i).getActual().compareTo(actual.get(i).getActual()));
        }
    }


    @AfterEach
    void tearDown() {
    }
}