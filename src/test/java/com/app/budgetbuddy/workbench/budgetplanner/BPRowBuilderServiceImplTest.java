package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPRowService;
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
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BPRowBuilderServiceImplTest
{
    @Mock
    private BPRowService bpRowService;

    @Mock
    private BPCellBuilderService cellBuilderService;

    @InjectMocks
    private BPRowBuilderServiceImpl monthlyBPRowBuilderService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testBuildCategoryRows_whenAllInputsExceptBudgetCategoryGroupsEmpty_thenReturnEmptyList(){
        List<BPBudgetCategory> budgetCategoryList = List.of();
        List<BudgetCategoryGroup> budgetCategoryGroups = new ArrayList<>();
        budgetCategoryGroups.add(new BudgetCategoryGroup("", List.of(), List.of()));
        List<BPColumn> columns = List.of(new BPColumn(0, null, null, null, false));
        List<BPRow> actual = monthlyBPRowBuilderService.buildCategoryRows(budgetCategoryList, budgetCategoryGroups, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildCategoryRows_whenAllInputsExceptBudgetCategoriesThenReturnEmptyList(){
        List<BPBudgetCategory> budgetCategoryList = List.of(new BPBudgetCategory());
        List<BudgetCategoryGroup> budgetCategoryGroups = new ArrayList<>();
        List<BPColumn> columns = new ArrayList<>();
        List<BPRow> actual = monthlyBPRowBuilderService.buildCategoryRows(budgetCategoryList, budgetCategoryGroups, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildCategoryRows_whenBPColumnsEmpty_thenReturnEmptyList(){
        List<BPBudgetCategory> budgetCategoryList = List.of(new BPBudgetCategory());
        List<BudgetCategoryGroup> budgetCategoryGroups = new ArrayList<>();
        budgetCategoryGroups.add(new BudgetCategoryGroup("", List.of(), List.of()));
        List<BPColumn> columns = new ArrayList<>();
        List<BPRow> actual = monthlyBPRowBuilderService.buildCategoryRows(budgetCategoryList, budgetCategoryGroups, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildCategoryRows_whenBudgetCategoryGroupsHaveNoCategories_thenReturnGroupHeaderRowsOnly(){
        // ── inputs ──────────────────────────────────────────────────────────────
        List<BPBudgetCategory> budgetCategoryList = new ArrayList<>();

        BudgetCategoryGroup housingGroup = new BudgetCategoryGroup();
        housingGroup.setGroupName("Housing");
        housingGroup.setBudgetCategories(new ArrayList<>());

        BudgetCategoryGroup foodGroup = new BudgetCategoryGroup();
        foodGroup.setGroupName("Food");
        foodGroup.setBudgetCategories(new ArrayList<>());

        List<BudgetCategoryGroup> budgetCategoryGroups = new ArrayList<>();
        budgetCategoryGroups.add(housingGroup);
        budgetCategoryGroups.add(foodGroup);

        BPColumn janColumn = new BPColumn(0,
                new DateRange(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31)),
                Period.MONTHLY, BPColumnType.ACTUAL, false);
        BPColumn febColumn = new BPColumn(1,
                new DateRange(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28)),
                Period.MONTHLY, BPColumnType.ACTUAL, false);
        List<BPColumn> columns = List.of(janColumn, febColumn);

        List<BPCell> emptyCells = List.of(
                new BPCell(janColumn, 0.0, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, 0.0, false, false, true, false, BPCellColor.DEFAULT)
        );
        when(cellBuilderService.buildCells(any(BPRow.class), eq(columns)))
                .thenReturn(emptyCells);

        // ── expected ─────────────────────────────────────────────────────────────
        // Group header rows with 0.0 amounts since no categories contribute any budget
        BPRow expectedHousingRow = new BPRow("Housing", CategoryType.NONE, List.of(
                new BPCell(janColumn, 0.0, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, 0.0, false, false, true, false, BPCellColor.DEFAULT)
        ));

        BPRow expectedFoodRow = new BPRow("Food", CategoryType.NONE, List.of(
                new BPCell(janColumn, 0.0, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, 0.0, false, false, true, false, BPCellColor.DEFAULT)
        ));

        List<BPRow> expected = List.of(expectedHousingRow, expectedFoodRow);

        // ── act ───────────────────────────────────────────────────────────────────
        List<BPRow> actual = monthlyBPRowBuilderService.buildCategoryRows(
                budgetCategoryList, budgetCategoryGroups, columns);

        // ── assert ────────────────────────────────────────────────────────────────
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size(),
                "Expected " + expected.size() + " group header rows but got " + actual.size());

        for (int i = 0; i < expected.size(); i++) {
            BPRow expectedRow = expected.get(i);
            BPRow actualRow   = actual.get(i);

            assertEquals(expectedRow.getCategory(), actualRow.getCategory(),
                    "Row[" + i + "] category mismatch");
            assertEquals(expectedRow.getCategoryType(), actualRow.getCategoryType(),
                    "Row[" + i + "] categoryType mismatch");
            assertEquals(expectedRow.getCells().size(), actualRow.getCells().size(),
                    "Row[" + i + "] cell count mismatch");

            for (int j = 0; j < expectedRow.getCells().size(); j++) {
                BPCell expectedCell = expectedRow.getCells().get(j);
                BPCell actualCell   = actualRow.getCells().get(j);

                assertEquals(expectedCell.amount(), actualCell.amount(), 0.001,
                        "Row[" + i + "] Cell[" + j + "] amount mismatch — expected 0.0 for empty group");
                assertEquals(expectedCell.isEditable(), actualCell.isEditable(),
                        "Row[" + i + "] Cell[" + j + "] isEditable mismatch");
                assertEquals(expectedCell.color(), actualCell.color(),
                        "Row[" + i + "] Cell[" + j + "] color mismatch");
            }
        }
    }

    @Test
    void testBuildCategoryRows_whenBudgetCategoriesIsEmptyAndOnlyBudgetCategoryGroups_thenReturnCategoryRows(){
        // ── inputs ──────────────────────────────────────────────────────────────
        List<BPBudgetCategory> budgetCategoryList = new ArrayList<>();

        // Housing group: Rent $1220, Utilities $127.23, Electric $74.56
        BudgetCategoryGroup housingGroup = new BudgetCategoryGroup();
        housingGroup.setGroupName("Housing");

        BPBudgetCategory bpRentCategory = new BPBudgetCategory();
        bpRentCategory.setCategory("Rent");
        bpRentCategory.setStartDate(LocalDate.of(2026, 1, 1));
        bpRentCategory.setEndDate(LocalDate.of(2026, 1, 7));
        bpRentCategory.setBudgetedAmount(BigDecimal.valueOf(1220.0));

        BPBudgetCategory bpUtilitiesCategory = new BPBudgetCategory();
        bpUtilitiesCategory.setCategory("Utilities");
        bpUtilitiesCategory.setStartDate(LocalDate.of(2026, 1, 1));
        bpUtilitiesCategory.setEndDate(LocalDate.of(2026, 1, 7));
        bpUtilitiesCategory.setBudgetedAmount(BigDecimal.valueOf(127.23));

        BPBudgetCategory bpElectricCategory = new BPBudgetCategory();
        bpElectricCategory.setCategory("Electric");
        bpElectricCategory.setStartDate(LocalDate.of(2026, 1, 1));
        bpElectricCategory.setEndDate(LocalDate.of(2026, 1, 7));
        bpElectricCategory.setBudgetedAmount(BigDecimal.valueOf(74.56));

        housingGroup.setBudgetCategories(List.of(bpRentCategory, bpUtilitiesCategory, bpElectricCategory));

        // Food group: Groceries $122, Order Out $75
        BudgetCategoryGroup foodGroup = new BudgetCategoryGroup();
        foodGroup.setGroupName("Food");

        BPBudgetCategory bpGroceriesCategory = new BPBudgetCategory();
        bpGroceriesCategory.setCategory("Groceries");
        bpGroceriesCategory.setStartDate(LocalDate.of(2026, 1, 1));
        bpGroceriesCategory.setEndDate(LocalDate.of(2026, 1, 7));
        bpGroceriesCategory.setBudgetedAmount(BigDecimal.valueOf(122.0));

        BPBudgetCategory bpOrderOutCategory = new BPBudgetCategory();
        bpOrderOutCategory.setCategory("Order Out");
        bpOrderOutCategory.setStartDate(LocalDate.of(2026, 1, 1));
        bpOrderOutCategory.setEndDate(LocalDate.of(2026, 1, 7));
        bpOrderOutCategory.setBudgetedAmount(BigDecimal.valueOf(75.0));

        foodGroup.setBudgetCategories(List.of(bpGroceriesCategory, bpOrderOutCategory));

        List<BudgetCategoryGroup> budgetCategoryGroups = new ArrayList<>();
        budgetCategoryGroups.add(housingGroup);
        budgetCategoryGroups.add(foodGroup);

        // Columns: January and February 2026
        BPColumn janColumn = new BPColumn(0,
                new DateRange(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31)),
                Period.MONTHLY, BPColumnType.ACTUAL, false);
        BPColumn febColumn = new BPColumn(1,
                new DateRange(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28)),
                Period.MONTHLY, BPColumnType.ACTUAL, false);
        List<BPColumn> columns = List.of(janColumn, febColumn);

        // ── expected rows ────────────────────────────────────────────────────────
        // Housing group header row  (sum of all housing categories for Jan = 1421.79,
        // Feb carries only the base recurring amount = 1220.0 when no Feb-specific
        // override exists — adjust these values to match your implementation)
        double housingJanTotal = 1220.0 + 127.23 + 74.56; // 1421.79
        double housingFebTotal = 1220.0 + 127.23 + 74.56; // same budgeted total for Feb

        BPRow housingRow = new BPRow("Housing", CategoryType.NONE, List.of(
                new BPCell(janColumn, housingJanTotal, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, housingFebTotal, false, false, true, false, BPCellColor.DEFAULT)
        ));

        // Housing child rows
        BPRow rentRow = new BPRow("Rent", CategoryType.RENT, List.of(
                new BPCell(janColumn, 1220.0, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, 1220.0, false, false, true, false, BPCellColor.DEFAULT)
        ));

        BPRow utilitiesRow = new BPRow("Utilities", CategoryType.UTILITIES, List.of(
                new BPCell(janColumn, 127.23, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, 127.23, false, false, true, false, BPCellColor.DEFAULT)
        ));

        BPRow electricRow = new BPRow("Electric", CategoryType.ELECTRIC, List.of(
                new BPCell(janColumn, 74.56, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, 74.56, false, false, true, false, BPCellColor.DEFAULT)
        ));

        // Food group header row
        double foodJanTotal = 122.0 + 75.0; // 197.0
        double foodFebTotal = 122.0 + 75.0;

        BPRow foodRow = new BPRow("Food", CategoryType.NONE, List.of(
                new BPCell(janColumn, foodJanTotal, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, foodFebTotal, false, false, true, false, BPCellColor.DEFAULT)
        ));

        // Food child rows
        BPRow groceriesRow = new BPRow("Groceries", CategoryType.GROCERIES, List.of(
                new BPCell(janColumn, 122.0, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, 122.0, false, false, true, false, BPCellColor.DEFAULT)
        ));

        BPRow orderOutRow = new BPRow("Order Out", CategoryType.ORDER_OUT, List.of(
                new BPCell(janColumn, 75.0, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, 75.0, false, false, true, false, BPCellColor.DEFAULT)
        ));

        // Expected flat list: group header followed by its children, in order
        List<BPRow> expected = List.of(
                housingRow, rentRow, utilitiesRow, electricRow,
                foodRow, groceriesRow, orderOutRow
        );

        when(cellBuilderService.buildCells(argThat(r -> r != null && r.getCategory().equals("Rent")), eq(columns)))
                .thenReturn(List.of(
                        new BPCell(janColumn, 1220.0, false, false, true, false, BPCellColor.DEFAULT),
                        new BPCell(febColumn, 1220.0, false, false, true, false, BPCellColor.DEFAULT)
                ));

        when(cellBuilderService.buildCells(argThat(r -> r != null && r.getCategory().equals("Utilities")), eq(columns)))
                .thenReturn(List.of(
                        new BPCell(janColumn, 127.23, false, false, true, false, BPCellColor.DEFAULT),
                        new BPCell(febColumn, 127.23, false, false, true, false, BPCellColor.DEFAULT)
                ));

        when(cellBuilderService.buildCells(argThat(r -> r != null && r.getCategory().equals("Electric")), eq(columns)))
                .thenReturn(List.of(
                        new BPCell(janColumn, 74.56, false, false, true, false, BPCellColor.DEFAULT),
                        new BPCell(febColumn, 74.56, false, false, true, false, BPCellColor.DEFAULT)
                ));

        when(cellBuilderService.buildCells(argThat(r -> r != null && r.getCategory().equals("Groceries")), eq(columns)))
                .thenReturn(List.of(
                        new BPCell(janColumn, 122.0, false, false, true, false, BPCellColor.DEFAULT),
                        new BPCell(febColumn, 122.0, false, false, true, false, BPCellColor.DEFAULT)
                ));

        when(cellBuilderService.buildCells(argThat(r -> r != null && r.getCategory().equals("Order Out")), eq(columns)))
                .thenReturn(List.of(
                        new BPCell(janColumn, 75.0, false, false, true, false, BPCellColor.DEFAULT),
                        new BPCell(febColumn, 75.0, false, false, true, false, BPCellColor.DEFAULT)
                ));

        when(cellBuilderService.buildCells(argThat(r -> r != null && r.getCategory().equals("Housing")), eq(columns)))
                .thenReturn(List.of(
                        new BPCell(janColumn, 1421.79, false, false, true, false, BPCellColor.DEFAULT),
                        new BPCell(febColumn, 1421.79, false, false, true, false, BPCellColor.DEFAULT)
                ));

        when(cellBuilderService.buildCells(argThat(r -> r != null && r.getCategory().equals("Food")), eq(columns)))
                .thenReturn(List.of(
                        new BPCell(janColumn, 197.0, false, false, true, false, BPCellColor.DEFAULT),
                        new BPCell(febColumn, 197.0, false, false, true, false, BPCellColor.DEFAULT)
                ));

        // ── act ──────────────────────────────────────────────────────────────────
        List<BPRow> actual = monthlyBPRowBuilderService.buildCategoryRows(
                budgetCategoryList, budgetCategoryGroups, columns);

        // ── assert ───────────────────────────────────────────────────────────────
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size(),
                "Row count mismatch — expected " + expected.size() + " but got " + actual.size());

        for (int i = 0; i < expected.size(); i++) {
            BPRow expectedRow = expected.get(i);
            BPRow actualRow   = actual.get(i);

            assertEquals(expectedRow.getCategory(), actualRow.getCategory(),
                    "Row[" + i + "] category mismatch");
            assertEquals(expectedRow.getCategoryType(), actualRow.getCategoryType(),
                    "Row[" + i + "] categoryType mismatch");
            assertEquals(expectedRow.getCells().size(), actualRow.getCells().size(),
                    "Row[" + i + "] cell count mismatch");

            for (int j = 0; j < expectedRow.getCells().size(); j++) {
                BPCell expectedCell = expectedRow.getCells().get(j);
                BPCell actualCell   = actualRow.getCells().get(j);

                assertEquals(expectedCell.amount(), actualCell.amount(), 0.001,
                        "Row[" + i + "] Cell[" + j + "] amount mismatch");
                assertEquals(expectedCell.isEditable(), actualCell.isEditable(),
                        "Row[" + i + "] Cell[" + j + "] isEditable mismatch");
                assertEquals(expectedCell.color(), actualCell.color(),
                        "Row[" + i + "] Cell[" + j + "] color mismatch");
            }
        }
    }

    @Test
    void testBuildBalanceRows_whenBPAccountBalancesAndColumnsIsEmpty_thenReturnEmptyRows(){
        List<BPAccountBalance> accountBalances = new ArrayList<>();
        List<BPColumn> columns = new ArrayList<>();
        List<BPRow> rows = monthlyBPRowBuilderService.buildBalanceRows(accountBalances, columns);
        assertTrue(rows.isEmpty());
    }

    @Test
    void testBuildBalanceRows_whenColumnsIsEmpty_thenReturnEmptyList(){
        List<BPAccountBalance> accountBalances = new ArrayList<>();
        accountBalances.add(new BPAccountBalance());
        List<BPColumn> columns = new ArrayList<>();
        List<BPRow> actual = monthlyBPRowBuilderService.buildBalanceRows(accountBalances, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildBalanceRows_whenBalancesForJanAndFebColumns_thenReturnRows(){
        BPColumn janColumn = new BPColumn(0,
                new DateRange(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31)),
                Period.MONTHLY, BPColumnType.ACTUAL, false);
        BPColumn febColumn = new BPColumn(1,
                new DateRange(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28)),
                Period.MONTHLY, BPColumnType.ACTUAL, false);
        List<BPColumn> columns = List.of(janColumn, febColumn);

        BPAccountBalance janBalance = new BPAccountBalance();
        janBalance.setAccountId("account-1");
        janBalance.setColumnIndex(0);
        janBalance.setDateRange(new DateRange(LocalDate.of(2026, 1, 1), LocalDate.of(2026, 1, 31)));
        janBalance.setCurrentBalance(BigDecimal.valueOf(2500.00));
        janBalance.setPlannedBalance(BigDecimal.valueOf(2000.00));
        janBalance.setAvailableBalance(BigDecimal.valueOf(500.00));
        janBalance.setClosingBalance(BigDecimal.valueOf(1800.00));

        BPAccountBalance febBalance = new BPAccountBalance();
        febBalance.setAccountId("account-1");
        febBalance.setColumnIndex(1);
        febBalance.setDateRange(new DateRange(LocalDate.of(2026, 2, 1), LocalDate.of(2026, 2, 28)));
        febBalance.setCurrentBalance(BigDecimal.valueOf(1800.00));
        febBalance.setPlannedBalance(BigDecimal.valueOf(1500.00));
        febBalance.setAvailableBalance(BigDecimal.valueOf(300.00));
        febBalance.setClosingBalance(BigDecimal.valueOf(1200.00));

        List<BPAccountBalance> balances = List.of(janBalance, febBalance);

        // ── stubs ─────────────────────────────────────────────────────────────
        List<BPCell> janCells = List.of(
                new BPCell(janColumn, 2500.00, false, false, true, false, BPCellColor.DEFAULT)
        );
        List<BPCell> febCells = List.of(
                new BPCell(febColumn, 1800.00, false, false, true, false, BPCellColor.DEFAULT)
        );

        when(cellBuilderService.buildCells(
                argThat(r -> r != null && r.getCategory().equals("account-1") && r.getCategoryType() == CategoryType.NONE),
                eq(columns)))
                .thenReturn(List.of(
                        new BPCell(janColumn, 2500.00, false, false, true, false, BPCellColor.DEFAULT),
                        new BPCell(febColumn, 1800.00, false, false, true, false, BPCellColor.DEFAULT)
                ));

        // ── expected ──────────────────────────────────────────────────────────
        BPRow expectedBalanceRow = new BPRow("account-1", CategoryType.NONE, List.of(
                new BPCell(janColumn, 2500.00, false, false, true, false, BPCellColor.DEFAULT),
                new BPCell(febColumn, 1800.00, false, false, true, false, BPCellColor.DEFAULT)
        ));
        List<BPRow> expected = List.of(expectedBalanceRow);

        // ── act ───────────────────────────────────────────────────────────────
        List<BPRow> actual = monthlyBPRowBuilderService.buildBalanceRows(balances, columns);

        // ── assert ────────────────────────────────────────────────────────────
        assertNotNull(actual);
        assertEquals(expected.size(), actual.size(),
                "Row count mismatch — expected " + expected.size() + " but got " + actual.size());

        for(int i = 0; i < expected.size(); i++){
            BPRow expectedRow = expected.get(i);
            BPRow actualRow   = actual.get(i);

            assertEquals(expectedRow.getCategory(), actualRow.getCategory(),
                    "Row[" + i + "] category mismatch");
            assertEquals(expectedRow.getCategoryType(), actualRow.getCategoryType(),
                    "Row[" + i + "] categoryType mismatch");
            assertEquals(expectedRow.getCells().size(), actualRow.getCells().size(),
                    "Row[" + i + "] cell count mismatch");

            for(int j = 0; j < expectedRow.getCells().size(); j++){
                BPCell expectedCell = expectedRow.getCells().get(j);
                BPCell actualCell   = actualRow.getCells().get(j);

                assertEquals(expectedCell.amount(), actualCell.amount(), 0.001,
                        "Row[" + i + "] Cell[" + j + "] amount mismatch");
                assertEquals(expectedCell.isEditable(), actualCell.isEditable(),
                        "Row[" + i + "] Cell[" + j + "] isEditable mismatch");
                assertEquals(expectedCell.color(), actualCell.color(),
                        "Row[" + i + "] Cell[" + j + "] color mismatch");
            }
        }
    }


    @AfterEach
    void tearDown() {
    }
}