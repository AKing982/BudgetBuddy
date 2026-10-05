package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPTemplatePointerService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BPTemplatePointerBuilderServiceTest {

    @Mock
    private BPTemplatePointerService bpTemplatePointerService;

    @InjectMocks
    private BPTemplatePointerBuilderService bpTemplatePointerBuilderService;


    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(true);
    }

    @Test
    void testCreateTemplatePointer_whenBPColumnsEmpty_thenReturnEmptyOptional(){
        Long templateDetailId = 1L;
        boolean isFuturePointer = true;
        List<BPColumn> columns = List.of();
        LocalDate currentDate = LocalDate.of(2026, 1, 1);
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createTemplatePointer(columns, templateDetailId, isFuturePointer, currentDate);
        assertNotNull(actual);
        assertFalse(actual.isPresent());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateTemplatePointer_whenCreateCurrentPointerAndDoesntExist_thenReturnBPTemplatePointer(){
        Long templateDetailId = 1L;
        boolean isFuturePointer = false;
        LocalDate currentDate = LocalDate.of(2026, 9, 26);
        List<BPColumn> columns = createTestColumns();

        BPTemplatePointer expected = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.CURRENT)
                .currentDateRange(new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)))
                .isUpdateEnabled(false)
                .isLocked(true)
                .build();

        when(bpTemplatePointerService.findByDateRangeAndTemplateDetailID(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.empty());

        when(bpTemplatePointerService.createAndSave(expected))
                .thenReturn(Optional.of(expected));

        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createTemplatePointer(columns, templateDetailId, isFuturePointer, currentDate);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
    }

    @Test
    void testCreatTemplatePointer_whenCreateFuturePointer_thenReturnBPTemplatePointer(){
        Long templateDetailId = 1L;
        boolean isFuturePointer = true;
        LocalDate currentDate = LocalDate.of(2026, 9, 26);
        List<BPColumn> columns = createTestColumns();
        DateRange expectedFutureDateRange = new DateRange(LocalDate.of(2026, 11, 18), LocalDate.of(2026, 12, 1));
        BPTemplatePointer futurePointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(expectedFutureDateRange)
                .isUpdateEnabled(true)
                .isLocked(false)
                .build();

        when(bpTemplatePointerService.createAndSave(futurePointer))
        .thenReturn(Optional.of(futurePointer));

        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createTemplatePointer(columns, templateDetailId, isFuturePointer, currentDate);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(futurePointer, actual.get());
    }

    @Test
    void testCreateTemplatePointer_whenNullColumns_thenReturnEmptyOptional(){
        Long templateDetailId = 1L;
        boolean isFuturePointer = true;
        List<BPColumn> columns = null;
        LocalDate currentDate = LocalDate.of(2026, 1, 1);
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createTemplatePointer(columns, templateDetailId, isFuturePointer, currentDate);
        assertNotNull(actual);
        assertFalse(actual.isPresent());
        assertTrue(actual.isEmpty());

    }

    @Test
    void testCreateTemplatePointer_whenCurrentDateRangeNullAndCurrentPointer_thenReturnEmptyOptional(){
        Long templateDetailId = 1L;
        boolean isFuturePointer = false;
        List<BPColumn> columns = createTestColumnsWithNullCurrentDateRange();
        LocalDate currentDate = LocalDate.of(2026, 9, 23);
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createTemplatePointer(columns, templateDetailId, isFuturePointer, currentDate);
        assertNotNull(actual);
        assertFalse(actual.isPresent());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateTemplatePointer_whenCurrentPointerAlreadyExistsForCurrentDateRange_thenReturnTemplatePointer(){
        Long templateDetailId = 1L;
        boolean isFuturePointer = false;
        List<BPColumn> columns = createTestColumns();
        LocalDate currentDate = LocalDate.of(2026, 9 ,23);

        DateRange curentDateRange = new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6));
        BPTemplatePointer futurePointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(curentDateRange)
                .isUpdateEnabled(true)
                .isLocked(true)
                .id(1L)
                .build();
        when(bpTemplatePointerService.findByDateRangeAndTemplateDetailID(anyLong(), any(LocalDate.class), any(LocalDate.class)))
                .thenReturn(Optional.of(futurePointer));
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createTemplatePointer(columns, templateDetailId, isFuturePointer, currentDate);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(futurePointer, actual.get());
    }

    @Test
    void testCreateTemplatePointer_whenFuturePointerAlreadyExistsForCurrentDateRange_thenReturnTemplatePointer(){
        Long templateDetailId = 1L;
        boolean isFuturePointer = true;
        List<BPColumn> columns = createTestColumns();
        LocalDate currentDate = LocalDate.of(2026, 9 ,23);

    }

    @Test
    void testCreateShiftedPointer_whenTemplatePointerIsNull_thenReturnEmptyOptional(){
        List<BPColumn> columns = createTestColumns();
        DateRange dateRange = mock(DateRange.class);
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createShiftedPointer(null, columns,  dateRange);
        assertNotNull(actual);
        assertFalse(actual.isPresent());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateShiftedPointer_whenTemplatePointerIsCurrentPointer_shiftToNextDateRange_thenReturnPointer(){
        BPTemplatePointer currentPointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.CURRENT)
                .currentDateRange(new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)))
                .isUpdateEnabled(false)
                .isLocked(true)
                .build();
        List<BPColumn> columns = createTestColumns();
        BPTemplatePointer nextCurrentPointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.CURRENT)
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)))
                .isUpdateEnabled(false)
                .isLocked(true)
                .build();
        DateRange dateRange = mock(DateRange.class);
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createShiftedPointer(currentPointer, columns, dateRange);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(nextCurrentPointer, actual.get());
    }

    @Test
    void testCreateShiftedPointer_whenTemplatePointerIsCurrentPointerAndNextColumnDateRangeIsNull_thenReturnEmptyOptional(){
        BPTemplatePointer currentPointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.CURRENT)
                .currentDateRange(new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)))
                .isUpdateEnabled(false)
                .isLocked(true)
                .build();
        List<BPColumn> columns = createTestColumsWithNullNextPointerDateRange();
        DateRange dateRange = mock(DateRange.class);
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createShiftedPointer(currentPointer, columns, dateRange);
        assertNotNull(actual);
        assertFalse(actual.isPresent());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateShiftedPointer_whenTemplatePointerIsCurrentPointerAndBPColumnIsNull_thenReturnEmptyOptional(){
        BPTemplatePointer currentPointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.CURRENT)
                .currentDateRange(new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)))
                .isUpdateEnabled(false)
                .isLocked(true)
                .build();
        DateRange dateRange = mock(DateRange.class);
        List<BPColumn> columns = createTestColumnsWithNullCurrentDateRangeAndCurrentPointer();
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createShiftedPointer(currentPointer, columns, dateRange);
        assertNotNull(actual);
        assertFalse(actual.isPresent());
        assertTrue(actual.isEmpty());
    }

    @Test
    void testCreateShiftedPointer_whenTemplatePointerIsFuturePointer_AndShiftToDateRange_thenReturnPointer(){
        BPTemplatePointer futurePointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 6)))
                .isUpdateEnabled(false)
                .isLocked(false)
                .build();
        DateRange dateRange = new DateRange(
                LocalDate.of(2026, 11, 18),
                LocalDate.of(2026, 12, 1));

        BPTemplatePointer expectedPointer = BPTemplatePointer.builder()
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(dateRange)
                .isUpdateEnabled(false)
                .isLocked(true)
                .status("Active")
                .templateDetailId(1L)
                .build();
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.createShiftedPointer(futurePointer, createTestColumns(), dateRange);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(expectedPointer, actual.get());
    }

    @Test
    void testResyncCurrentPointerOnNewCurrentPeriod_whenCurrentPointerIsNull_thenReturnEmptyOptional(){

        LocalDate currentDate = LocalDate.of(2026, 10, 1);
        List<BPColumn> columns = createTestColumns();
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.resyncCurrentPointer(null, currentDate, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testResyncCurrentPointerOnNewCurrentPeriod_whenCurrentDateIsNull_thenReturnEmptyOptional(){
        DateRange dateRange = new DateRange(
                LocalDate.of(2026, 9, 23),
                LocalDate.of(2026, 10, 6));

        BPTemplatePointer expectedPointer = BPTemplatePointer.builder()
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(dateRange)
                .isUpdateEnabled(false)
                .isLocked(true)
                .status("Active")
                .templateDetailId(1L)
                .build();
        List<BPColumn> columns = createTestColumns();
        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.resyncCurrentPointer(expectedPointer, null, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testResyncCurrentPointerOnNewCurrentPeriod_whenCurrentPointerOnPreviousPeriodAndCurrentDateOnNewPeriod_thenReturnCurrentPointer(){
        DateRange dateRange = new DateRange(
                LocalDate.of(2026, 9, 23),
                LocalDate.of(2026, 10, 6));

        BPTemplatePointer currentPointer = BPTemplatePointer.builder()
                .pointerMode(PointerMode.CURRENT)
                .currentDateRange(dateRange)
                .isUpdateEnabled(false)
                .isLocked(true)
                .status("Active")
                .templateDetailId(1L)
                .build();
        LocalDate currentDate = LocalDate.of(2026, 10, 7);
        List<BPColumn> columns = createTestColumns();

        BPTemplatePointer expected = BPTemplatePointer.builder()
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)))
                .isUpdateEnabled(false)
                .isLocked(true)
                .status("Active")
                .templateDetailId(1L)
                .pointerMode(PointerMode.CURRENT)
                .build();

        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.resyncCurrentPointer(currentPointer, currentDate, columns);
        assertNotNull(actual);
        assertEquals(expected, actual.get());
    }

    @Test
    void testResyncCurrentPointerOnNewCurrentPeriod_whenCurrentPointerOnCurrentPeriod_thenReturnSamePointer(){
        DateRange dateRange = new DateRange(
                LocalDate.of(2026, 10, 7),
                LocalDate.of(2026, 10, 20));
        LocalDate currentDate = LocalDate.of(2026, 10, 9);
        List<BPColumn> columns = createTestColumns();
        BPTemplatePointer currentPointer = BPTemplatePointer.builder()
                .currentDateRange(dateRange)
                .isLocked(true)
                .isUpdateEnabled(false)
                .status("Active")
                .pointerMode(PointerMode.CURRENT)
                .templateDetailId(1L)
                .build();

        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.resyncCurrentPointer(currentPointer, currentDate, columns);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(currentPointer, actual.get());
    }

    @Test
    void testResyncCurrentPointerOnNewCurrentPeriod_whenCurrentPointerAfterCurrentDate_thenThrowException(){
        LocalDate currentDate = LocalDate.of(2026, 10, 9);
        List<BPColumn> columns = createTestColumns();
        DateRange dateRange = new DateRange(
                LocalDate.of(2026, 10, 11),
                LocalDate.of(2026, 10, 25));
        BPTemplatePointer currentPointer = BPTemplatePointer.builder()
                .currentDateRange(dateRange)
                .isLocked(true)
                .isUpdateEnabled(false)
                .status("Active")
                .pointerMode(PointerMode.CURRENT)
                .templateDetailId(1L)
                .build();

        Optional<BPTemplatePointer> actual = bpTemplatePointerBuilderService.resyncCurrentPointer(currentPointer, currentDate, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testResyncPointers_whenCurrentPointerNull_thenReturnEmptyOptional(){
        LocalDate currentDate = LocalDate.of(2026, 10, 1);
        BPTemplatePointer futurePointer = BPTemplatePointer.builder()
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 5), LocalDate.of(2026, 10, 10)))
                .isLocked(false)
                .isUpdateEnabled(true)
                .status("Active")
                .pointerMode(PointerMode.FUTURE)
                .templateDetailId(1L)
                .build();
        List<BPColumn> columns = createTestColumns();
        Optional<PointerResync> actual = bpTemplatePointerBuilderService.resyncPointers(null, currentDate, futurePointer, columns);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testResyncPointers_whenFuturePointerIsNull_thenReturnEmptyOptional(){
        BPTemplatePointer currentPointer = createPointer(new DateRange(LocalDate.of(2026, 10, 6), LocalDate.of(2026, 10, 19)), PointerMode.CURRENT, true);
        Optional<PointerResync> actual = bpTemplatePointerBuilderService.resyncPointers(currentPointer, LocalDate.of(2026, 10, 10), null, createTestColumns());
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testResyncPointers_whenNoColumnContainsCurrentDate_thenReturnEmptyOptional(){
        BPTemplatePointer currentPointer = createPointer(range(10, 6, 10, 19), PointerMode.CURRENT, true);
        BPTemplatePointer futurePointer  = createPointer(range(11, 3, 11, 16), PointerMode.FUTURE, false);

        Optional<PointerResync> expected = Optional.empty();
        Optional<PointerResync> actual = bpTemplatePointerBuilderService.resyncPointers(currentPointer, LocalDate.of(2026, 12, 1), futurePointer, createTestColumns());

        assertEquals(expected, actual);
    }


    @Test
    void testResyncPointers_whenCurrentAndFuturePointerOnSamePeriod_thenMoveFuturePointerToNextPeriod(){
        BPTemplatePointer currentPointer = createPointer(range(9, 23, 10, 6), PointerMode.CURRENT, true);
        BPTemplatePointer futurePointer  = createPointer(range(9, 23, 10, 6), PointerMode.FUTURE, false);

        BPTemplatePointer expectedFuture = BPTemplatePointer.builder()
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(range(10, 7, 10, 20))
                .isLocked(false)
                .isUpdateEnabled(true)
                .status("Active")
                .templateDetailId(1L)
                .build();
        PointerResync expected = new PointerResync(currentPointer, expectedFuture, true);
        Optional<PointerResync> actual = bpTemplatePointerBuilderService.resyncPointers(currentPointer, LocalDate.of(2026, 10, 1), futurePointer, createTestColumns());
        assertEquals(Optional.of(expected), actual);
    }

    private DateRange range(int startMonth, int startDay, int endMonth, int endDay){
        return new DateRange(LocalDate.of(2026, startMonth, startDay), LocalDate.of(2026, endMonth, endDay));
    }

    private BPTemplatePointer createPointer(DateRange range, PointerMode mode, boolean isLocked){
        return BPTemplatePointer.builder()
                .currentDateRange(range)
                .isLocked(isLocked)
                .isUpdateEnabled(true)
                .status("Active")
                .pointerMode(mode)
                .templateDetailId(1L)
                .build();
    }


    private List<BPColumn> createTestColumnsWithNullCurrentDateRangeAndCurrentPointer(){
        List<BPColumn> columns = new ArrayList<>();
        columns.add(BPColumn.builder()
                .columnIndex(8)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 9, 9),
                        LocalDate.of(2026, 9, 22)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(9)
                .dateRange(null)
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(10)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 10, 7),
                        LocalDate.of(2026, 10, 20)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(11)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 10, 21),
                        LocalDate.of(2026, 11, 3)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());
        return columns;
    }

    private List<BPColumn> createTestColumsWithNullNextPointerDateRange(){
        List<BPColumn> columns = new ArrayList<>();

        columns.add(BPColumn.builder()
                .columnIndex(0)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 5, 20),
                        LocalDate.of(2026, 6, 2)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(1)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 6, 3),
                        LocalDate.of(2026, 6, 16)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(2)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 6, 17),
                        LocalDate.of(2026, 6, 30)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(3)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 7, 1),
                        LocalDate.of(2026, 7, 14)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(4)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 7, 15),
                        LocalDate.of(2026, 7, 28)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(5)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 7, 29),
                        LocalDate.of(2026, 8, 11)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(6)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 8, 12),
                        LocalDate.of(2026, 8, 25)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(7)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 8, 26),
                        LocalDate.of(2026, 9, 8)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(8)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 9, 9),
                        LocalDate.of(2026, 9, 22)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(9)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 9, 23),
                        LocalDate.of(2026, 10, 6)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(10)
                .dateRange(null)
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(11)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 10, 21),
                        LocalDate.of(2026, 11, 3)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(12)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 11, 4),
                        LocalDate.of(2026, 11, 17)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(13)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 11, 18),
                        LocalDate.of(2026, 12, 1)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        return columns;
    }

    private List<BPColumn> createTestColumnsWithNullCurrentDateRange(){
        List<BPColumn> columns = new ArrayList<>();

        columns.add(BPColumn.builder()
                .columnIndex(0)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 5, 20),
                        LocalDate.of(2026, 6, 2)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(1)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 6, 3),
                        LocalDate.of(2026, 6, 16)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(2)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 6, 17),
                        LocalDate.of(2026, 6, 30)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(3)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 7, 1),
                        LocalDate.of(2026, 7, 14)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(4)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 7, 15),
                        LocalDate.of(2026, 7, 28)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(5)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 7, 29),
                        LocalDate.of(2026, 8, 11)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(6)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 8, 12),
                        LocalDate.of(2026, 8, 25)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(7)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 8, 26),
                        LocalDate.of(2026, 9, 8)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(8)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 9, 9),
                        LocalDate.of(2026, 9, 22)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(9)
                .dateRange(null)
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(10)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 10, 7),
                        LocalDate.of(2026, 10, 20)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(11)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 10, 21),
                        LocalDate.of(2026, 11, 3)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(12)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 11, 4),
                        LocalDate.of(2026, 11, 17)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(13)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 11, 18),
                        LocalDate.of(2026, 12, 1)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        return columns;
    }

//    private List<BPColumn> createTestColumns(){
//        List<BPColumn> columns = new ArrayList<>();
//        LocalDate start = LocalDate.of(2026, 5, 20);
//        for(int i = 0; i < 8; i++){
//            LocalDate end = start.plusWeeks(2).minusDays(1);
//            columns.add(BPColumn.builder()
//                    .columnIndex(i)
//                    .dateRange(new DateRange(start, end))
//                    .period(Period.BIWEEKLY)
//                    .columnType(BPColumnType.ACTUAL)
//                    .isHeader(false)
//                    .build());
//            start = end.plusDays(1);
//        }
//        return columns;
//    }

    private List<BPColumn> createTestColumns() {
        List<BPColumn> columns = new ArrayList<>();

        columns.add(BPColumn.builder()
                .columnIndex(0)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 5, 20),
                        LocalDate.of(2026, 6, 2)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(1)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 6, 3),
                        LocalDate.of(2026, 6, 16)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(2)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 6, 17),
                        LocalDate.of(2026, 6, 30)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(3)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 7, 1),
                        LocalDate.of(2026, 7, 14)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(4)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 7, 15),
                        LocalDate.of(2026, 7, 28)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(5)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 7, 29),
                        LocalDate.of(2026, 8, 11)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(6)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 8, 12),
                        LocalDate.of(2026, 8, 25)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(7)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 8, 26),
                        LocalDate.of(2026, 9, 8)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(8)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 9, 9),
                        LocalDate.of(2026, 9, 22)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(9)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 9, 23),
                        LocalDate.of(2026, 10, 6)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(10)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 10, 7),
                        LocalDate.of(2026, 10, 20)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(11)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 10, 21),
                        LocalDate.of(2026, 11, 3)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(12)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 11, 4),
                        LocalDate.of(2026, 11, 17)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(13)
                .dateRange(new DateRange(
                        LocalDate.of(2026, 11, 18),
                        LocalDate.of(2026, 12, 1)))
                .period(Period.BIWEEKLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        return columns;
    }



    @AfterEach
    void tearDown() {
    }
}