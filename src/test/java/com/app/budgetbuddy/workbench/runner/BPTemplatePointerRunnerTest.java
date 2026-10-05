package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPColumnService;
import com.app.budgetbuddy.workbench.budgetplanner.BPColumnBuilderService;
import com.app.budgetbuddy.workbench.budgetplanner.BPTemplatePointerBuilderService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;

@ExtendWith(MockitoExtension.class)
class BPTemplatePointerRunnerTest {

    @Mock
    private BPTemplatePointerBuilderService bpTemplatePointerBuilderService;

    @Mock
    private BPColumnService bpColumnService;

    @InjectMocks
    private BPTemplatePointerRunner bpTemplatePointerRunner;

    @Test
    void testCreateCurrentPointer_whenTemplateDetailIdIsNull_thenReturnEmptyOptional() {

        LocalDate currentDate = LocalDate.of(2026, 1, 1);
        assertTrue(bpTemplatePointerRunner.createCurrentPointer(1L, currentDate).isEmpty());
    }


    @Test
    void testCreateCurrentPointer_whenCurrentDateInColumns_thenReturnCurrentPointer(){
        LocalDate currentDate = LocalDate.of(2026, 7, 5);
        List<BPColumn> columns = createTestColumns();
        Mockito.when(bpColumnService.getColumnsByTemplateDetailId(anyLong()))
                .thenReturn(columns);
        BPTemplatePointer expected = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .currentDateRange(new DateRange(LocalDate.of(2026, 7, 1), LocalDate.of(2026, 7, 15)))
                .pointerMode(PointerMode.CURRENT)
                .isUpdateEnabled(false)
                .isLocked(true)
                .status("Active")
                .build();
        Mockito.when(bpTemplatePointerBuilderService.createTemplatePointer(anyList(), anyLong(), anyBoolean(), any(LocalDate.class)))
                .thenReturn(Optional.of(expected));

        Optional<BPTemplatePointer> actual = bpTemplatePointerRunner.createCurrentPointer(1L, currentDate);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
    }

    @Test
    void testCreateFuturePointer_whenTemplateDetailIdIsNull_thenReturnEmptyOptional(){
        LocalDate currentDate = LocalDate.of(2026, 9, 23);
        DateRange futureRange = new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20));
        assertTrue(bpTemplatePointerRunner.createFuturePointer(null, currentDate, futureRange).isEmpty());
    }

    @Test
    void testCreateFuturePointer_whenFutureRangeIsNull_thenReturnEmptyOptional(){
        LocalDate currentDate = LocalDate.of(2026, 9, 23);
        assertTrue(bpTemplatePointerRunner.createFuturePointer(1L, currentDate, null).isEmpty());
    }

    @Test
    void testCreateFuturePointer_whenFutureRangeContainsCurrentDate_thenReturnEmptyOptional(){
        LocalDate currentDate = LocalDate.of(2026, 9, 23);
        DateRange futureRange = new DateRange(LocalDate.of(2026, 9, 23), LocalDate.of(2026, 10, 20));
        assertTrue(bpTemplatePointerRunner.createFuturePointer(1L, currentDate, futureRange).isEmpty());
    }

    @Test
    void testCreateFuturePointer_whenFutureRangeDoesNotContainCurrentDate_thenReturnFuturePointer(){
        LocalDate currentDate = LocalDate.of(2026, 9, 23);
        DateRange futureRange = new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20));
        BPTemplatePointer expected = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .currentDateRange(futureRange)
                .pointerMode(PointerMode.FUTURE)
                .isUpdateEnabled(true)
                .isLocked(false)
                .status("Active")
                .build();

        Mockito.when(bpColumnService.getColumnsByTemplateDetailId(anyLong()))
                .thenReturn(createTestColumns());

        Mockito.when(bpTemplatePointerBuilderService.createTemplatePointer(anyList(), anyLong(), anyBoolean(), any(LocalDate.class)))
                .thenReturn(Optional.of(expected));
        Optional<BPTemplatePointer> actual = bpTemplatePointerRunner.createFuturePointer(1L, currentDate, futureRange);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
    }

    @Test
    void testSyncNewFuturePointer_whenNewDateRangeIsNull_thenReturnEmptyOptional(){
        BPTemplatePointer currentFuturePointer = BPTemplatePointer.builder()
                .currentDateRange(new DateRange(LocalDate.of(2026,  10, 7), LocalDate.of(2026, 10, 20)))
                .pointerMode(PointerMode.FUTURE)
                .isUpdateEnabled(true)
                .isLocked(false)
                .status("Active")
                .build();
        Optional<BPTemplatePointer> actual = bpTemplatePointerRunner.syncNewFuturePointer(null, currentFuturePointer);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSyncNewFuturePointer_whenFuturePointerIsNull_thenReturnEmptyOptional(){
        DateRange newDateRange = new DateRange(LocalDate.of(2026, 10, 21), LocalDate.of(2026, 11, 3));
        Optional<BPTemplatePointer> actual = bpTemplatePointerRunner.syncNewFuturePointer(newDateRange, null);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSyncNewFuturePointer_whenNewDateRangeEqualsCurrentFuturePointerRange_whenReturnCurrentFuturePointer(){
        DateRange newDateRange = new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20));
        BPTemplatePointer currentFuturePointer = BPTemplatePointer.builder()
                .currentDateRange(newDateRange)
                .pointerMode(PointerMode.FUTURE)
                .isUpdateEnabled(true)
                .isLocked(false)
                .status("Active")
                .build();
        Optional<BPTemplatePointer> actual = bpTemplatePointerRunner.syncNewFuturePointer(newDateRange, currentFuturePointer);
        assertTrue(actual.isPresent());
        assertEquals(currentFuturePointer, actual.get());
    }

    @Test
    void testSyncNewFuturePointer_whenNewDateRangeDoesNotContainFuturePointerRange_whenReturnFuturePointerWithUpdatedRange(){
        DateRange newDateRange = new DateRange(LocalDate.of(2026, 10, 21), LocalDate.of(2026, 11, 3));
        BPTemplatePointer currentFuturePointer = BPTemplatePointer.builder()
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)))
                .pointerMode(PointerMode.FUTURE)
                .isUpdateEnabled(true)
                .templateDetailId(1L)
                .isLocked(false)
                .status("Active")
                .build();

        BPTemplatePointer newFuturePointer = BPTemplatePointer.builder()
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 21), LocalDate.of(2026, 11, 3)))
                .pointerMode(PointerMode.FUTURE)
                .isUpdateEnabled(true)
                .isLocked(false)
                .templateDetailId(1L)
                .status("Active")
                .build();
        Mockito.when(bpColumnService.getColumnsByTemplateDetailId(anyLong()))
                .thenReturn(createTestColumns());
        Mockito.when(bpTemplatePointerBuilderService.createShiftedPointer(any(BPTemplatePointer.class), anyList(), any(DateRange.class)))
                .thenReturn(Optional.of(newFuturePointer));
        Optional<BPTemplatePointer> actual = bpTemplatePointerRunner.syncNewFuturePointer(newDateRange, currentFuturePointer);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(newDateRange, actual.get().getCurrentDateRange());
    }

    @Test
    void testSyncPointers_whenCurrentPointerIsNull_thenReturnEmptyOptional(){
        BPTemplatePointer currentFuturePointer = BPTemplatePointer.builder()
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)))
                .pointerMode(PointerMode.FUTURE)
                .isUpdateEnabled(true)
                .templateDetailId(1L)
                .isLocked(false)
                .status("Active")
                .build();
        LocalDate currentDate = LocalDate.of(2026, 10, 7);
        Optional<PointerResync> actual = bpTemplatePointerRunner.syncPointers(null, currentFuturePointer, currentDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSyncPointers_whenFuturePointerIsNull_thenReturnEmptyOptional(){
        BPTemplatePointer currentFuturePointer = BPTemplatePointer.builder()
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)))
                .pointerMode(PointerMode.FUTURE)
                .isUpdateEnabled(true)
                .templateDetailId(1L)
                .isLocked(false)
                .status("Active")
                .build();
        LocalDate currentDate = LocalDate.of(2026, 10, 7);
        Optional<PointerResync> actual = bpTemplatePointerRunner.syncPointers(currentFuturePointer, null, currentDate);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testSyncPointers_whenCurrentPointerAndFuturePointersAreSame_thenReturnResyncedPointers(){
        BPTemplatePointer currentFuturePointer = BPTemplatePointer.builder()
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)))
                .pointerMode(PointerMode.FUTURE)
                .isUpdateEnabled(true)
                .templateDetailId(1L)
                .isLocked(false)
                .status("Active")
                .build();
        LocalDate currentDate = LocalDate.of(2026, 10, 7);
        BPTemplatePointer shiftedFuturePointer = BPTemplatePointer.builder()
                .isLocked(false)
                .pointerMode(PointerMode.FUTURE)
                .isUpdateEnabled(true)
                .currentDateRange(new DateRange(LocalDate.of(2026, 10, 21), LocalDate.of(2026, 11, 3)))
                .templateDetailId(1L)
                .status("Active")
                .build();

        PointerResync expected = new PointerResync(currentFuturePointer, shiftedFuturePointer, true);
        Mockito.when(bpColumnService.getColumnsByTemplateDetailId(anyLong()))
                .thenReturn(createTestColumns());

        Mockito.when(bpTemplatePointerBuilderService.resyncPointers(any(BPTemplatePointer.class), any(LocalDate.class), any(BPTemplatePointer.class), anyList()))
                .thenReturn(Optional.of(expected));

        Optional<PointerResync> actual = bpTemplatePointerRunner.syncPointers(currentFuturePointer, currentFuturePointer, currentDate);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(expected, actual.get());
    }


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


    private List<DateRange> createTestDateRanges(LocalDate startDate, LocalDate endDate){
        DateRange dateRange = new DateRange(startDate, endDate);
        return dateRange.splitIntoBiWeeks();
    }

    @BeforeEach
    void setUp() {
    }

    @AfterEach
    void tearDown() {
    }
}