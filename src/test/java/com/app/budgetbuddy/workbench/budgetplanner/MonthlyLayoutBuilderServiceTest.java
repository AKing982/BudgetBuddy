//package com.app.budgetbuddy.workbench.budgetplanner;
//
//import com.app.budgetbuddy.domain.*;
//import com.app.budgetbuddy.exceptions.DataException;
//import org.junit.jupiter.api.AfterEach;
//import org.junit.jupiter.api.BeforeEach;
//import org.junit.jupiter.api.Test;
//import org.junit.jupiter.api.extension.ExtendWith;
//import org.mockito.InjectMocks;
//import org.mockito.Mock;
//import org.mockito.junit.jupiter.MockitoExtension;
//
//import java.time.LocalDate;
//import java.util.List;
//
//import static org.junit.jupiter.api.Assertions.*;
//import static org.mockito.ArgumentMatchers.any;
//import static org.mockito.ArgumentMatchers.eq;
//import static org.mockito.Mockito.*;
//
//@ExtendWith(MockitoExtension.class)
//class MonthlyLayoutBuilderServiceTest
//{
//    @Mock
//    private BPColumnBuilderService bpColumnBuilderService;
//
//    @Mock
//    private BPRowBuilderService bpRowBuilderService;
//
//    @Mock
//    private BPCellBuilderService bpCellBuilderService;
//
//    @InjectMocks
//    private BPLayoutBuilderService monthlyLayoutBuilderService;
//
//    private BudgetSchedule validSchedule;
//    private List<DateRange> dateRanges;
//    private List<BPColumn> mockColumns;
//    private List<BPRow> mockRows;
//
//    @BeforeEach
//    void setUp() {
//        DateRange janRange = new DateRange(LocalDate.of(2024, 1, 1),  LocalDate.of(2024, 1, 31));
//        DateRange febRange = new DateRange(LocalDate.of(2024, 2, 1),  LocalDate.of(2024, 2, 29));
//        DateRange marRange = new DateRange(LocalDate.of(2024, 3, 1),  LocalDate.of(2024, 3, 31));
//
//        dateRanges = List.of(janRange, febRange, marRange);
//
//        BudgetScheduleRange janScheduleRange = BudgetScheduleRange.builder()
//                .startRange(LocalDate.of(2024, 1, 1))
//                .endRange(LocalDate.of(2024, 1, 31))
//                .build();
//        BudgetScheduleRange febScheduleRange = BudgetScheduleRange.builder()
//                .startRange(LocalDate.of(2024, 2, 1))
//                .endRange(LocalDate.of(2024, 2, 29))
//                .build();
//        BudgetScheduleRange marScheduleRange = BudgetScheduleRange.builder()
//                .startRange(LocalDate.of(2024, 3, 1))
//                .endRange(LocalDate.of(2024, 3, 31))
//                .build();
//
//        validSchedule = BudgetSchedule.builder()
//                .budgetScheduleId(1L)
//                .startDate(LocalDate.of(2024, 1, 1))
//                .endDate(LocalDate.of(2024, 3, 31))
//                .scheduleRange(new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 3, 31)))
//                .periodType(Period.MONTHLY)
//                .budgetScheduleRanges(List.of(janScheduleRange, febScheduleRange, marScheduleRange))
//                .totalPeriods(3)
//                .status("ACTIVE")
//                .build();
//
//        mockColumns = List.of(
//                new BPColumn(0, janRange, Period.MONTHLY, BPColumnType.ACTUAL, false),
//                new BPColumn(1, febRange, Period.MONTHLY, BPColumnType.ACTUAL, false),
//                new BPColumn(2, marRange, Period.MONTHLY, BPColumnType.ACTUAL, false)
//        );
//
//        mockRows = List.of(
//                new BPRow("Salary",    CategoryType.PAYROLL,   List.of()),
//                new BPRow("Rent",      CategoryType.RENT,      List.of()),
//                new BPRow("Groceries", CategoryType.GROCERIES, List.of())
//        );
//    }
//
//    @Test
//    void testBuildLayout_whenTemplateTypeIsNull_thenThrowException()
//    {
//        assertThrows(DataException.class, () ->
//                monthlyLayoutBuilderService.buildLayout(null, validSchedule));
//    }
//
//    @Test
//    void testBuildLayout_whenBudgetScheduleIsNull_thenThrowException()
//    {
//        assertThrows(DataException.class, () ->
//                monthlyLayoutBuilderService.buildLayout(BPTemplateType.MONTHLY_STD, null));
//    }
//
////    @Test
////    void testBuildLayout_whenTemplateIsMonthly_thenReturnLayout(){
////        when(bpColumnBuilderService.buildColumns(BPTemplateType.MONTHLY_STD, Period.MONTHLY, dateRanges))
////                .thenReturn(mockColumns);
////        when(bpRowBuilderService.buildCategoryRows(any(), eq(mockColumns)))
////                .thenReturn(mockRows);
////        when(bpCellBuilderService.buildBalanceCells(any(), any(), any()))
////            .thenReturn(List.of());
////        when(bpCellBuilderService.buildIncomeCells(any(), any(), any()))
////            .thenReturn(List.of());
////
////        BPLayout expected = new BPLayout(mockColumns, mockRows);
////
////        BPLayout actual = monthlyLayoutBuilderService.buildLayout(BPTemplateType.MONTHLY_STD, validSchedule);
////        assertNotNull(actual);
////        assertEquals(expected.columns().size(), actual.columns().size());
////        assertEquals(expected.rows().size(),    actual.rows().size());
////        assertEquals(expected.columns(),        actual.columns());
////        assertEquals(expected.rows(),           actual.rows());
////    }
//
//    @Test
//    void testBuildLayout_whenValidArgs_thenColumnBuilderIsCalled()
//    {
//        when(bpColumnBuilderService.buildColumns(
//                BPTemplateType.MONTHLY_STD, Period.MONTHLY, dateRanges))
//                .thenReturn(mockColumns);
//
////        when(bpRowBuilderService.buildCategoryRows(any(), eq(mockColumns)))
////                .thenReturn(mockRows);
//
//        monthlyLayoutBuilderService.buildLayout(BPTemplateType.MONTHLY_STD, validSchedule);
//
//        verify(bpColumnBuilderService).buildColumns(BPTemplateType.MONTHLY_STD, Period.MONTHLY, dateRanges);
//    }
//
//    @Test
//    void testBuildLayout_whenValidArgs_thenReturnLayoutWithCorrectColumnCount()
//    {
//        when(bpColumnBuilderService.buildColumns(
//                BPTemplateType.MONTHLY_STD, Period.MONTHLY, dateRanges))
//                .thenReturn(mockColumns);
//
////        when(bpRowBuilderService.buildCategoryRows(any(), eq(mockColumns)))
////                .thenReturn(mockRows);
//
//        BPLayout expected = new BPLayout(mockColumns, mockRows);
//
//        BPLayout actual = monthlyLayoutBuilderService.buildLayout(
//                BPTemplateType.MONTHLY_STD, validSchedule);
//
//        assertNotNull(actual);
//        assertEquals(expected.columns().size(), actual.columns().size());
//        assertEquals(expected.rows().size(),    actual.rows().size());
//        assertEquals(expected.columns(),        actual.columns());
//        assertEquals(expected.rows(),           actual.rows());
//    }
//
//
//    @AfterEach
//    void tearDown() {
//    }
//}