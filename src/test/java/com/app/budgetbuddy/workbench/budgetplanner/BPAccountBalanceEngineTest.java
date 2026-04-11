package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import org.checkerframework.checker.units.qual.A;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BPAccountBalanceEngineTest
{
    @Mock
    private BPForecastingService bpForecastingService;

    @InjectMocks
    private BPAccountBalanceEngine bpAccountBalanceEngine;

    private static final String ACCOUNT_ID = "acct-001";
    private static final BigDecimal STARTING_BALANCE = new BigDecimal("1000.00");

    private DateRange janRange;
    private DateRange febRange;
    private BPColumn janColumn;
    private BPColumn febColumn;
    private DateRange marRange;
    private BPColumn marColumn;
    private SubBudget subBudget;

    @BeforeEach
    void setUp() {
        janRange  = new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31));
        febRange  = new DateRange(LocalDate.of(2024, 2, 1), LocalDate.of(2024, 2, 29));
        marRange  = new DateRange(LocalDate.of(2024, 3, 1), LocalDate.of(2024, 3, 31));

        janColumn = new BPColumn(0, janRange, Period.MONTHLY, BPColumnType.ACTUAL, false);
        febColumn = new BPColumn(1, febRange, Period.MONTHLY, BPColumnType.ACTUAL, false);
        marColumn = new BPColumn(2, marRange, Period.MONTHLY, BPColumnType.ACTUAL, false);
        Budget budget = new Budget();
        budget.setUserId(1L);

        subBudget = SubBudget.builder()
                .id(1L)
                .budget(budget)
                .startDate(LocalDate.of(2024, 1, 1))
                .endDate(LocalDate.of(2024, 3, 31))
                .allocatedAmount(new BigDecimal("5000.00"))
                .build();
    }

    private BPCategory income(DateRange range, int columnIndex, String amount) {
        return BPCategory.builder()
                .name("Salary")
                .type(BPType.INCOME)
                .range(range)
                .actual(new BigDecimal(amount))
                .budgeted(BigDecimal.ZERO)
                .columnIndex(columnIndex)
                .isActive(true)
                .build();
    }

    private BPCategory expense(DateRange range, int columnIndex, String amount) {
        return BPCategory.builder()
                .name("Expenses")
                .type(BPType.EXPENSE)
                .range(range)
                .actual(new BigDecimal(amount))
                .budgeted(BigDecimal.ZERO)
                .columnIndex(columnIndex)
                .isActive(true)
                .build();
    }

    @Test
    void buildAccountBalances_whenColumnsIsEmpty_thenReturnEmptyList() {
        List<BPCategory> incomes   = List.of(income(janRange, 0, "2548.23"));
        List<BPCategory> expenses  = List.of(expense(janRange, 0, "2461.37"));

        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
                Collections.emptyList(), incomes, expenses);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }


    @Test
    void buildAccountBalances_whenIncomesIsEmpty_thenReturnEmptyList() {
        List<BPCategory> expenses = List.of(expense(janRange, 0, "2461.37"));

        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
                List.of(janColumn), Collections.emptyList(), expenses);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void buildAccountBalances_whenExpensesIsEmpty_thenReturnEmptyList() {
        List<BPCategory> incomes = List.of(income(janRange, 0, "2548.23"));

        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
                List.of(janColumn), incomes, Collections.emptyList());

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void buildAccountBalances_whenSingleColumn_thenClosingBalanceIsIncomeMinusExpenses() {
        // net = 2548.23 - 2461.37 = 86.86
        List<BPCategory> incomes  = List.of(income(janRange, 0, "2548.23"));
        List<BPCategory> expenses = List.of(expense(janRange, 0, "2461.37"));

        BPAccountBalance expected = BPAccountBalance.builder()
                .columnIndex(0)
                .dateRange(janRange)
                .currentBalance(BigDecimal.ZERO)
                .closingBalance(new BigDecimal("86.86"))
                .build();

        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
                List.of(janColumn), incomes, expenses);

        assertNotNull(actual);
        assertEquals(1, actual.size());
        assertBalance(expected, actual.get(0));
    }

    @Test
    void buildAccountBalances_whenSingleColumnExpensesExceedIncome_thenClosingBalanceIsNegative() {
        // net = 1500.00 - 2000.00 = -500.00
        List<BPCategory> incomes  = List.of(income(janRange, 0, "1500.00"));
        List<BPCategory> expenses = List.of(expense(janRange, 0, "2000.00"));

        BPAccountBalance expected = BPAccountBalance.builder()
                .columnIndex(0)
                .dateRange(janRange)
                .currentBalance(BigDecimal.ZERO)
                .closingBalance(new BigDecimal("-500.00"))
                .build();

        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
                List.of(janColumn), incomes, expenses);

        assertNotNull(actual);
        assertEquals(1, actual.size());
        assertBalance(expected, actual.get(0));
    }

    @Test
    void buildAccountBalances_whenSingleColumnIncomeEqualsExpenses_thenClosingBalanceIsZero() {
        // net = 2000.00 - 2000.00 = 0.00
        List<BPCategory> incomes  = List.of(income(janRange, 0, "2000.00"));
        List<BPCategory> expenses = List.of(expense(janRange, 0, "2000.00"));

        BPAccountBalance expected = BPAccountBalance.builder()
                .columnIndex(0)
                .dateRange(janRange)
                .currentBalance(BigDecimal.ZERO)
                .closingBalance(BigDecimal.ZERO.setScale(2))
                .build();

        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
                List.of(janColumn), incomes, expenses);

        assertNotNull(actual);
        assertEquals(1, actual.size());
        assertBalance(expected, actual.get(0));
    }

    @Test
    void buildAccountBalances_whenTwoColumns_thenFebCurrentBalanceEqualsJanClosingBalance() {
        // Jan: net = 2548.23 - 2461.37 = 86.86,  closing = 86.86
        // Feb: net = 2257.57 - 1485.36 = 772.21, closing = 86.86 + 772.21 = 859.07
        List<BPCategory> incomes = List.of(
                income(janRange, 0, "2548.23"),
                income(febRange, 1, "2257.57"));
        List<BPCategory> expenses = List.of(
                expense(janRange, 0, "2461.37"),
                expense(febRange, 1, "1485.36"));

        BPAccountBalance expectedJan = BPAccountBalance.builder()
                .columnIndex(0).dateRange(janRange)
                .currentBalance(BigDecimal.ZERO)
                .closingBalance(new BigDecimal("86.86"))
                .build();
        BPAccountBalance expectedFeb = BPAccountBalance.builder()
                .columnIndex(1).dateRange(febRange)
                .currentBalance(new BigDecimal("86.86"))
                .closingBalance(new BigDecimal("859.07"))
                .build();

        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
                List.of(janColumn, febColumn), incomes, expenses);

        assertNotNull(actual);
        assertEquals(2, actual.size());
        assertBalance(expectedJan, actual.get(0));
        assertBalance(expectedFeb, actual.get(1));
    }


    @Test
    void buildAccountBalances_whenTwoColumnsSecondMonthNegativeNet_thenRollingBalanceReduces() {
        // Jan: net = 2000.00 - 1500.00 =  500.00, closing = 500.00
        // Feb: net = 1000.00 - 1300.00 = -300.00, closing = 500.00 + (-300.00) = 200.00
        List<BPCategory> incomes = List.of(
                income(janRange, 0, "2000.00"),
                income(febRange, 1, "1000.00"));
        List<BPCategory> expenses = List.of(
                expense(janRange, 0, "1500.00"),
                expense(febRange, 1, "1300.00"));

        BPAccountBalance expectedJan = BPAccountBalance.builder()
                .columnIndex(0).dateRange(janRange)
                .currentBalance(BigDecimal.ZERO)
                .closingBalance(new BigDecimal("500.00"))
                .build();
        BPAccountBalance expectedFeb = BPAccountBalance.builder()
                .columnIndex(1).dateRange(febRange)
                .currentBalance(new BigDecimal("500.00"))
                .closingBalance(new BigDecimal("200.00"))
                .build();

        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
                List.of(janColumn, febColumn), incomes, expenses);

        assertNotNull(actual);
        assertEquals(2, actual.size());
        assertBalance(expectedJan, actual.get(0));
        assertBalance(expectedFeb, actual.get(1));
    }

    @Test
    void buildAccountBalances_whenThreeColumns_thenBalanceRollsCorrectlyAcrossAllColumns() {
        // Jan: net = 2548.23 - 2461.37 = 86.86,  closing = 86.86
        // Feb: net = 2257.57 - 1485.36 = 772.21, closing = 859.07
        // Mar: net = 3100.00 - 2200.00 = 900.00, closing = 1759.07
        List<BPCategory> incomes = List.of(
                income(janRange, 0, "2548.23"),
                income(febRange, 1, "2257.57"),
                income(marRange, 2, "3100.00"));
        List<BPCategory> expenses = List.of(
                expense(janRange, 0, "2461.37"),
                expense(febRange, 1, "1485.36"),
                expense(marRange, 2, "2200.00"));

        BPAccountBalance expectedJan = BPAccountBalance.builder()
                .columnIndex(0).dateRange(janRange)
                .currentBalance(BigDecimal.ZERO)
                .closingBalance(new BigDecimal("86.86"))
                .build();
        BPAccountBalance expectedFeb = BPAccountBalance.builder()
                .columnIndex(1).dateRange(febRange)
                .currentBalance(new BigDecimal("86.86"))
                .closingBalance(new BigDecimal("859.07"))
                .build();
        BPAccountBalance expectedMar = BPAccountBalance.builder()
                .columnIndex(2).dateRange(marRange)
                .currentBalance(new BigDecimal("859.07"))
                .closingBalance(new BigDecimal("1759.07"))
                .build();

        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
                List.of(janColumn, febColumn, marColumn), incomes, expenses);

        assertNotNull(actual);
        assertEquals(3, actual.size());
        assertBalance(expectedJan, actual.get(0));
        assertBalance(expectedFeb, actual.get(1));
        assertBalance(expectedMar, actual.get(2));
    }


    private void assertBalance(BPAccountBalance expected, BPAccountBalance actual)
    {
        assertEquals(expected.getColumnIndex(), actual.getColumnIndex());
        assertEquals(expected.getDateRange(), actual.getDateRange());
        assertEquals(0, expected.getCurrentBalance().compareTo(actual.getCurrentBalance()),
                "currentBalance mismatch — expected " + expected.getCurrentBalance()
                        + " but got " + actual.getCurrentBalance());
        assertEquals(0, expected.getClosingBalance().compareTo(actual.getClosingBalance()),
                "closingBalance mismatch — expected " + expected.getClosingBalance()
                        + " but got " + actual.getClosingBalance());
    }


//    @Test
//    void testBuildAccountBalances_whenTwoColumns_thenSecondBalanceRollsFromFirst()
//    {
//        // col 1: salary $2,548.23 - expenses $2,461.37 = net $86.86 → closing $1,086.86
//        // col 2: salary $2,257.57 - expenses $1,485.36 = net $772.21 → closing $1,086.86 + $772.21 = $1,859.07
//        DateRange febRange  = new DateRange(LocalDate.of(2024, 2, 1), LocalDate.of(2024, 2, 29));
//        BPColumn  febColumn = new BPColumn(1, febRange, Period.MONTHLY, BPColumnType.ACTUAL, false);
//
//        // --- col 0 cells ---
//        BPCell janSalary   = new BPCell(janColumn, 2548.23, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janRent     = new BPCell(janColumn, 1927.03, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janGas      = new BPCell(janColumn,   35.37, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janGrocery  = new BPCell(janColumn,  240.09, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janPayment  = new BPCell(janColumn,   29.24, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janElectric = new BPCell(janColumn,  120.95, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janOther    = new BPCell(janColumn,    9.00, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janSubs     = new BPCell(janColumn,   39.63, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janOrder    = new BPCell(janColumn,   60.06, false, false, false, false, BPCellColor.DEFAULT);
//
//        // --- col 1 cells ---
//        BPCell febSalary   = new BPCell(febColumn, 2257.57, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell febRent     = new BPCell(febColumn, 1927.00, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell febGas      = new BPCell(febColumn,   51.68, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell febGrocery  = new BPCell(febColumn,  262.72, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell febPayment  = new BPCell(febColumn,  290.21, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell febOther    = new BPCell(febColumn,  416.05, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell febSubs     = new BPCell(febColumn,   82.83, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell febOrder    = new BPCell(febColumn,  129.37, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell febHaircut  = new BPCell(febColumn,   26.00, false, false, false, false, BPCellColor.DEFAULT);
//
//        // --- rows with both columns' cells ---
//        BPRow salaryRow   = new BPRow("Salary",        CategoryType.PAYROLL,      List.of(janSalary,   febSalary));
//        BPRow rentRow     = new BPRow("Rent",          CategoryType.RENT,         List.of(janRent,     febRent));
//        BPRow gasRow      = new BPRow("Gas",           CategoryType.GAS,          List.of(janGas,      febGas));
//        BPRow groceryRow  = new BPRow("Groceries",     CategoryType.GROCERIES,    List.of(janGrocery,  febGrocery));
//        BPRow paymentRow  = new BPRow("Payments",      CategoryType.PAYMENT,      List.of(janPayment,  febPayment));
//        BPRow electricRow = new BPRow("Electric",      CategoryType.ELECTRIC,     List.of(janElectric));
//        BPRow otherRow    = new BPRow("Other Stuff",   CategoryType.OTHER,        List.of(janOther,    febOther));
//        BPRow subsRow     = new BPRow("Subscriptions", CategoryType.SUBSCRIPTION, List.of(janSubs,     febSubs));
//        BPRow orderRow    = new BPRow("Order Out",     CategoryType.ORDER_OUT,    List.of(janOrder,    febOrder));
//        BPRow haircutRow  = new BPRow("Haircut",       CategoryType.HAIRCUT,      List.of(febHaircut));
//
//        List<BPRow> rows = List.of(
//                salaryRow, rentRow, gasRow, groceryRow, paymentRow,
//                electricRow, otherRow, subsRow, orderRow, haircutRow);
//
//        // col 0 expected
//        BPAccountBalance expectedJan = BPAccountBalance.builder()
//                .columnIndex(0)
//                .dateRange(janRange)
//                .currentBalance(STARTING_BALANCE)
//                .plannedBalance(new BigDecimal("1086.86"))
//                .availableBalance(new BigDecimal("1086.86"))
//                .closingBalance(new BigDecimal("1086.86"))
//                .build();
//
//        // col 1 expected — closing of jan feeds in as current
//        BPAccountBalance expectedFeb = BPAccountBalance.builder()
//                .columnIndex(1)
//                .dateRange(febRange)
//                .currentBalance(new BigDecimal("1086.86"))
//                .plannedBalance(new BigDecimal("158.57"))
//                .availableBalance(new BigDecimal("158.57"))
//                .closingBalance(new BigDecimal("158.57"))
//                .build();
//
//        BPLayout layout = new BPLayout(List.of(janColumn, febColumn), rows);
//
//        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
//                ACCOUNT_ID, STARTING_BALANCE, layout);
//
//        assertNotNull(actual);
//        assertEquals(2, actual.size());
//
//        // assert jan
//        BPAccountBalance actualJan = actual.get(0);
//        assertEquals(expectedJan.getColumnIndex(), actualJan.getColumnIndex());
//        assertEquals(expectedJan.getDateRange(),   actualJan.getDateRange());
//        assertEquals(0, expectedJan.getCurrentBalance().compareTo(actualJan.getCurrentBalance()));
//        assertEquals(0, expectedJan.getPlannedBalance().compareTo(actualJan.getPlannedBalance()));
//        assertEquals(0, expectedJan.getClosingBalance().compareTo(actualJan.getClosingBalance()));
//
//        // assert feb — current balance must equal jan closing
//        BPAccountBalance actualFeb = actual.get(1);
//        assertEquals(expectedFeb.getColumnIndex(), actualFeb.getColumnIndex());
//        assertEquals(expectedFeb.getDateRange(),   actualFeb.getDateRange());
//        assertEquals(0, expectedFeb.getCurrentBalance().compareTo(actualFeb.getCurrentBalance()));
//        assertEquals(0, expectedFeb.getPlannedBalance().compareTo(actualFeb.getPlannedBalance()));
//        assertEquals(0, expectedFeb.getClosingBalance().compareTo(actualFeb.getClosingBalance()));
//
//        // rolling balance assertion — feb current must equal jan closing
//        assertEquals(0, actualJan.getClosingBalance().compareTo(actualFeb.getCurrentBalance()));
//    }

//    @Test
//    void testBuildAccountBalances_whenActualThenEstimated_thenForecastRollsFromActual()
//    {
//        // jan (ACTUAL): 1000 + 2548.23 - 2461.37 = 1086.86
//        // mar (ESTIMATED): 1086.86 + 2400.00 - 1900.00 = 1586.86
//        BPCell janSalary   = new BPCell(janColumn, 2548.23, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janRent     = new BPCell(janColumn, 1927.03, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janGas      = new BPCell(janColumn,   35.37, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janGrocery  = new BPCell(janColumn,  240.09, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janPayment  = new BPCell(janColumn,   29.24, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janElectric = new BPCell(janColumn,  120.95, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janOther    = new BPCell(janColumn,    9.00, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janSubs     = new BPCell(janColumn,   39.63, false, false, false, false, BPCellColor.DEFAULT);
//        BPCell janOrder    = new BPCell(janColumn,   60.06, false, false, false, false, BPCellColor.DEFAULT);
//
//        List<BPRow> rows = List.of(
//                new BPRow("Salary",        CategoryType.PAYROLL,      List.of(janSalary)),
//                new BPRow("Rent",          CategoryType.RENT,         List.of(janRent)),
//                new BPRow("Gas",           CategoryType.GAS,          List.of(janGas)),
//                new BPRow("Groceries",     CategoryType.GROCERIES,    List.of(janGrocery)),
//                new BPRow("Payments",      CategoryType.PAYMENT,      List.of(janPayment)),
//                new BPRow("Electric",      CategoryType.ELECTRIC,     List.of(janElectric)),
//                new BPRow("Other Stuff",   CategoryType.OTHER,        List.of(janOther)),
//                new BPRow("Subscriptions", CategoryType.SUBSCRIPTION, List.of(janSubs)),
//                new BPRow("Order Out",     CategoryType.ORDER_OUT,    List.of(janOrder))
//        );
//
//        when(bpForecastingService.forecastIncome(ACCOUNT_ID, marchRange))
//                .thenReturn(new BigDecimal("2400.00"));
//        when(bpForecastingService.forecastExpenses(ACCOUNT_ID, marchRange))
//                .thenReturn(new BigDecimal("1900.00"));
//
//        BPAccountBalance expectedJan = BPAccountBalance.builder()
//                .columnIndex(0)
//                .dateRange(janRange)
//                .currentBalance(STARTING_BALANCE)
//                .plannedBalance(new BigDecimal("1086.86"))
//                .availableBalance(new BigDecimal("1086.86"))
//                .closingBalance(new BigDecimal("1086.86"))
//                .build();
//
//        BPAccountBalance expectedMar = BPAccountBalance.builder()
//                .columnIndex(2)
//                .dateRange(marchRange)
//                .currentBalance(new BigDecimal("1086.86"))
//                .plannedBalance(new BigDecimal("1586.86"))
//                .availableBalance(new BigDecimal("1586.86"))
//                .closingBalance(new BigDecimal("1586.86"))
//                .build();
//
//        BPLayout layout = new BPLayout(List.of(janColumn, marchColumn), rows);
//
//        List<BPAccountBalance> actual = bpAccountBalanceEngine.buildAccountBalances(
//                ACCOUNT_ID, STARTING_BALANCE, layout);
//
//        assertNotNull(actual);
//        assertEquals(2, actual.size());
//
//        BPAccountBalance actualJan = actual.get(0);
//        assertEquals(expectedJan.getColumnIndex(), actualJan.getColumnIndex());
//        assertEquals(expectedJan.getDateRange(),   actualJan.getDateRange());
//        assertEquals(0, expectedJan.getCurrentBalance().compareTo(actualJan.getCurrentBalance()));
//        assertEquals(0, expectedJan.getPlannedBalance().compareTo(actualJan.getPlannedBalance()));
//        assertEquals(0, expectedJan.getClosingBalance().compareTo(actualJan.getClosingBalance()));
//
//        BPAccountBalance actualMar = actual.get(1);
//        assertEquals(expectedMar.getColumnIndex(), actualMar.getColumnIndex());
//        assertEquals(expectedMar.getDateRange(),   actualMar.getDateRange());
//        assertEquals(0, expectedMar.getCurrentBalance().compareTo(actualMar.getCurrentBalance()));
//        assertEquals(0, expectedMar.getPlannedBalance().compareTo(actualMar.getPlannedBalance()));
//        assertEquals(0, expectedMar.getClosingBalance().compareTo(actualMar.getClosingBalance()));
//
//        // critical — estimated current must equal actual closing
//        assertEquals(0, actualJan.getClosingBalance().compareTo(actualMar.getCurrentBalance()));
//
//        verifyNoMoreInteractions(bpForecastingService);
//    }


    @AfterEach
    void tearDown() {
    }
}