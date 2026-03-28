package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPColumnService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class BPColumnBuilderServiceImplTest
{
    @Mock
    private BPColumnService bpColumnService;

    @InjectMocks
    private BPColumnBuilderServiceImpl bpColumnBuilderService;

    private DateRange validDateRange;

    @BeforeEach
    void setUp() {
        validDateRange = new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31));
    }

    @Test
    void testBuildColumns_whenTemplateTypeIsNull_thenReturnEmptyCollection()
    {
        List<DateRange> dateRanges = List.of(validDateRange);
        List<BPColumn> actual = bpColumnBuilderService.buildColumns(null, Period.MONTHLY, dateRanges);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildColumns_whenPeriodIsNull_thenReturnEmptyCollection()
    {
        List<DateRange> dateRanges = List.of(validDateRange);
        List<BPColumn> actual = bpColumnBuilderService.buildColumns(BPTemplateType.MONTHLY_STD, null, dateRanges);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildColumns_whenDateRangesIsNull_thenReturnEmptyCollection()
    {
        List<BPColumn> actual = bpColumnBuilderService.buildColumns(BPTemplateType.MONTHLY_STD, Period.MONTHLY, null);
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }

    @Test
    void testBuildColumns_whenDateRangesIsEmpty_thenReturnEmptyCollection()
    {
        List<BPColumn> actual = bpColumnBuilderService.buildColumns(BPTemplateType.MONTHLY_STD, Period.MONTHLY, List.of());
        assertNotNull(actual);
        assertTrue(actual.isEmpty());
    }


    @Test
    void testBuildColumns_whenValidMonthlyArgs_thenReturnColumnPerDateRange()
    {
        DateRange jan = new DateRange(LocalDate.of(2024, 1, 1), LocalDate.of(2024, 1, 31));
        DateRange feb = new DateRange(LocalDate.of(2024, 2, 1), LocalDate.of(2024, 2, 29));
        DateRange mar = new DateRange(LocalDate.of(2024, 3, 1), LocalDate.of(2024, 3, 31));

        List<DateRange> dateRanges = List.of(jan, feb, mar);

        List<BPColumn> expected = List.of(
                new BPColumn(0, jan, Period.MONTHLY, BPColumnType.ACTUAL, false),
                new BPColumn(1, feb, Period.MONTHLY, BPColumnType.ACTUAL, false),
                new BPColumn(2, mar, Period.MONTHLY, BPColumnType.ACTUAL, false)
        );

        List<BPColumn> actual = bpColumnBuilderService.buildColumns(
                BPTemplateType.MONTHLY_STD, Period.MONTHLY, dateRanges);

        assertNotNull(actual);
        assertEquals(expected.size(), actual.size());
        for (int i = 0; i < expected.size(); i++)
        {
            assertEquals(expected.get(i).columnIndex(), actual.get(i).columnIndex());
            assertEquals(expected.get(i).dateRange(),   actual.get(i).dateRange());
            assertEquals(expected.get(i).period(),      actual.get(i).period());
            assertEquals(expected.get(i).columnType(),  actual.get(i).columnType());
            assertEquals(expected.get(i).isHeader(),    actual.get(i).isHeader());
        }
    }

    @Test
    void testBuildHeaderColumn_whenValidArgs_thenReturnHeaderColumn()
    {
        BPColumn actual = bpColumnBuilderService.buildHeaderColumn(0, validDateRange, Period.MONTHLY);

        assertNotNull(actual);
        assertTrue(actual.isHeader());
        assertEquals(0, actual.columnIndex());
        assertEquals(validDateRange, actual.dateRange());
        assertEquals(Period.MONTHLY, actual.period());
    }

    @Test
    void testBuildSubColumn_whenValidArgs_thenReturnSubColumn()
    {
        BPColumn actual = bpColumnBuilderService.buildSubColumn(1, validDateRange, Period.MONTHLY, BPColumnType.ACTUAL);

        assertNotNull(actual);
        assertFalse(actual.isHeader());
        assertEquals(1, actual.columnIndex());
        assertEquals(BPColumnType.ACTUAL, actual.columnType());
        assertEquals(validDateRange, actual.dateRange());
    }

    @Test
    void testBuildSubColumn_whenColumnTypeIsEstimated_thenReturnEstimatedColumn()
    {
        BPColumn actual = bpColumnBuilderService.buildSubColumn(1, validDateRange, Period.MONTHLY, BPColumnType.ESTIMATED);

        assertNotNull(actual);
        assertEquals(BPColumnType.ESTIMATED, actual.columnType());
        assertFalse(actual.isHeader());
    }


    @AfterEach
    void tearDown() {
    }
}