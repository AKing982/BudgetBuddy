package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BPLayoutBuilderServiceTest
{
    @Mock
    private BPColumnBuilderService columnBuilder;

    @Mock
    private BPCategoryRowBuilderService bpRowDataBuilderService;

    @InjectMocks
    private BPLayoutBuilderService bpLayoutBuilderService;

    private SubBudget subBudget;

    private DateRange week1 = new DateRange(LocalDate.of(2024, 1, 1),  LocalDate.of(2024, 1, 7));
    private DateRange week2 = new DateRange(LocalDate.of(2024, 1, 8),  LocalDate.of(2024, 1, 14));
    private DateRange week3 = new DateRange(LocalDate.of(2024, 1, 15), LocalDate.of(2024, 1, 21));
    private DateRange week4 = new DateRange(LocalDate.of(2024, 1, 22), LocalDate.of(2024, 1, 31));

    private BPColumn col0;
    private BPColumn col1;
    private BPColumn col2;
    private BPColumn col3;

    private DateRange janRange = new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31));
    private BPColumn  monthCol = new BPColumn(0, janRange, Period.MONTHLY, BPColumnType.ACTUAL, false);

    private List<BPCategory> mockCategories;

    @BeforeEach
    void setUp() {
        Budget budget = new Budget();
        budget.setUserId(1L);

        subBudget = SubBudget.builder()
                .id(1L)
                .budget(budget)
                .startDate(LocalDate.of(2024, 1, 1))
                .endDate(LocalDate.of(2024, 1, 31))
                .allocatedAmount(new BigDecimal("5000.00"))
                .build();

        col0 = new BPColumn(0, week1, Period.WEEKLY, BPColumnType.ACTUAL, false);
        col1 = new BPColumn(1, week2, Period.WEEKLY, BPColumnType.ACTUAL, false);
        col2 = new BPColumn(2, week3, Period.WEEKLY, BPColumnType.ACTUAL, false);
        col3 = new BPColumn(3, week4, Period.WEEKLY, BPColumnType.ACTUAL, false);

        mockCategories = List.of(
                BPCategory.builder().name("Rent").type(BPType.BUDGET).range(week1)
                        .actual(new BigDecimal("1000.00")).budgeted(new BigDecimal("1000.00"))
                        .columnIndex(0).isActive(true).build(),
                BPCategory.builder().name("Salary").type(BPType.INCOME).range(week1)
                        .actual(new BigDecimal("2500.00")).budgeted(BigDecimal.ZERO)
                        .columnIndex(0).isActive(true).build(),
                BPCategory.builder().name("Expenses").type(BPType.EXPENSE).range(week1)
                        .actual(new BigDecimal("1500.00")).budgeted(BigDecimal.ZERO)
                        .columnIndex(0).isActive(true).build()
        );
    }

//    @Test
//    void buildLayout_whenSubBudgetIsNull_thenThrowDataException()
//    {
//        assertThrows(DataException.class,
//                () -> bpLayoutBuilderService.buildLayout(BPTemplateType.MONTHLY_STD, null));
//    }
//
//    @Test
//    void buildLayout_whenBothArgumentsNull_thenThrowDataException()
//    {
//        assertThrows(DataException.class,
//                () -> bpLayoutBuilderService.buildLayout(null, null));
//    }

//    @Test
//    void buildLayout_whenMonthlyStd_thenLayoutContainsSingleMonthlyColumnAndCategories() {
//        List<BPColumn> columns = List.of(monthCol);
//
//        when(columnBuilder.buildColumns(eq(Period.MONTHLY), anyList())).thenReturn(columns);
//        when(bpRowDataBuilderService.buildRowData(eq(subBudget), eq(columns))).thenReturn(mockCategories);
//
//        BPLayout actual = bpLayoutBuilderService.buildLayout(BPTemplateType.MONTHLY_STD, subBudget);
//
//        assertNotNull(actual);
//        assertEquals(columns, actual.columns());
//        assertEquals(mockCategories, actual.bpCategories());
//    }
//
//    @Test
//    void buildLayout_whenMonthlyStd_thenColumnBuilderCalledWithMonthlyPeriod() {
//        List<BPColumn> columns = List.of(monthCol);
//
//        when(columnBuilder.buildColumns(eq(Period.MONTHLY), anyList())).thenReturn(columns);
//        when(bpRowDataBuilderService.buildRowData(any(), any())).thenReturn(mockCategories);
//
//        bpLayoutBuilderService.buildLayout(BPTemplateType.MONTHLY_STD, subBudget);
//
//        verify(columnBuilder).buildColumns(eq(Period.MONTHLY), anyList());
//    }
//
//
//    @Test
//    void buildLayout_whenWeeklyStd_thenLayoutContainsWeeklyColumnsAndCategories() {
//        List<BPColumn> columns = List.of(col0, col1, col2, col3);
//
//        when(columnBuilder.buildColumns(eq(Period.WEEKLY), anyList())).thenReturn(columns);
//        when(bpRowDataBuilderService.buildRowData(eq(subBudget), eq(columns))).thenReturn(mockCategories);
//
//        BPLayout actual = bpLayoutBuilderService.buildLayout(BPTemplateType.WEEKLY_STD, subBudget);
//
//        assertNotNull(actual);
//        assertEquals(columns, actual.columns());
//        assertEquals(mockCategories, actual.bpCategories());
//    }
//
//    @Test
//    void buildLayout_whenBiweeklyStd_thenLayoutContainsBiweeklyColumnsAndCategories() {
//        DateRange biweek1 = new DateRange(LocalDate.of(2024, 1, 1),  LocalDate.of(2024, 1, 14));
//        DateRange biweek2 = new DateRange(LocalDate.of(2024, 1, 15), LocalDate.of(2024, 1, 31));
//
//        BPColumn bwCol0 = new BPColumn(0, biweek1, Period.BIWEEKLY, BPColumnType.ACTUAL, false);
//        BPColumn bwCol1 = new BPColumn(1, biweek2, Period.BIWEEKLY, BPColumnType.ACTUAL, false);
//        List<BPColumn> columns = List.of(bwCol0, bwCol1);
//
//        when(columnBuilder.buildColumns(eq(Period.BIWEEKLY), anyList())).thenReturn(columns);
//        when(bpRowDataBuilderService.buildRowData(eq(subBudget), eq(columns))).thenReturn(mockCategories);
//
//        BPLayout actual = bpLayoutBuilderService.buildLayout(BPTemplateType.BIWEEKLY_STD, subBudget);
//
//        assertNotNull(actual);
//        assertEquals(columns, actual.columns());
//        assertEquals(mockCategories, actual.bpCategories());
//    }
//
//    @Test
//    void buildLayout_whenBiweeklyStd_thenColumnBuilderCalledWithBiweeklyPeriod() {
//        List<BPColumn> columns = List.of(col0, col1);
//
//        when(columnBuilder.buildColumns(eq(Period.BIWEEKLY), anyList())).thenReturn(columns);
//        when(bpRowDataBuilderService.buildRowData(any(), any())).thenReturn(mockCategories);
//
//        bpLayoutBuilderService.buildLayout(BPTemplateType.BIWEEKLY_STD, subBudget);
//
//        verify(columnBuilder).buildColumns(eq(Period.BIWEEKLY), anyList());
//    }


    @AfterEach
    void tearDown() {
    }
}