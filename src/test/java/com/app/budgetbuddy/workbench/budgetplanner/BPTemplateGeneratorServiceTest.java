package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.exceptions.BPTemplateBuilderException;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import com.app.budgetbuddy.services.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class BPTemplateGeneratorServiceTest
{
    @Mock
    private BPTemplateService bpTemplateService;

    @Mock
    private SubBudgetService subBudgetService;

    @Mock
    private BPTemplateGeneratorBuilderService templateGeneratorBuilderService;

    @Mock
    private BPTemplatePersistenceService templatePersistenceService;

    @Mock
    private BPTemplateUpdaterService bpTemplateUpdaterService;

    @InjectMocks
    private BPTemplateGeneratorService bpTemplateGeneratorService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testResyncTemplate_whenTemplateIdIsNull_thenThrowException(){
        assertThrows(TemplateDetailException.class, () -> bpTemplateGeneratorService.resyncTemplate(null, 1L));
        verifyNoInteractions(templatePersistenceService, bpTemplateUpdaterService);
    }

    @Test
    void testResyncTemplate_whenTemplateIdValid_NoBPTemplateDetailsFound_thenThrowException(){
        when(templatePersistenceService.findTemplateDetailByTemplateId(1L))
                .thenThrow(new TemplateDetailException("Budget template detail not found"));

        assertThrows(TemplateDetailException.class, () -> bpTemplateGeneratorService.resyncTemplate(1L, 1L));
        verifyNoInteractions(bpTemplateUpdaterService);
    }

    @Test
    void testResyncTemplate_whenTemplateDetailIdValidAndIncomeSTD_thenReturnUpdatedBPCategories(){
        BPTemplateDetail templateDetail = createTestTemplateDetail();
        List<BPCategory> updatedBPCategories = createTestUpdatedBPCategories(templateDetail.getId());
        List<BPCategory> unmatchedBPCategories = List.of();

        BPTemplate template = new BPTemplate();
        template.setId(1L);
        template.setBpTemplateDetail(templateDetail);
        template.setTemplateType(BPTemplateType.INCOME_STD);
        template.setActive(true);

        when(templatePersistenceService.findTemplateDetailByTemplateId(1L)).thenReturn(templateDetail);
        when(bpTemplateService.getTemplateTypeById(1L)).thenReturn(BPTemplateType.INCOME_STD);
        when(bpTemplateUpdaterService.updateBPCategories(templateDetail, 1L, true)).thenReturn(updatedBPCategories);
        when(bpTemplateUpdaterService.createUnmatchedBPCategories(templateDetail, true, 1L)).thenReturn(unmatchedBPCategories);
        when(bpTemplateService.getTemplateByUserAndId(1L, 1L)).thenReturn(Optional.of(template));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.resyncTemplate(1L, 1L);

        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(BPTemplateType.INCOME_STD, actual.get().getTemplateType());
        assertEquals(1L, actual.get().getId());
        assertEquals(1L, actual.get().getBpTemplateDetail().getId());
        verify(templatePersistenceService).saveCategoryChanges(updatedBPCategories, unmatchedBPCategories, 1L);
    }

    @Test
    void testResyncTemplate_whenTemplateDetailIdValidAndMonthlySTD_thenResyncWithoutIncome(){
        BPTemplateDetail templateDetail = createTestTemplateDetail();
        List<BPCategory> updatedBPCategories = createTestUpdatedBPCategories(templateDetail.getId());

        BPTemplate template = new BPTemplate();
        template.setId(1L);
        template.setBpTemplateDetail(templateDetail);
        template.setTemplateType(BPTemplateType.MONTHLY_STD);
        template.setActive(true);

        when(templatePersistenceService.findTemplateDetailByTemplateId(1L)).thenReturn(templateDetail);
        when(bpTemplateService.getTemplateTypeById(1L)).thenReturn(BPTemplateType.MONTHLY_STD);
        when(bpTemplateUpdaterService.updateBPCategories(templateDetail, 1L, false)).thenReturn(updatedBPCategories);
        when(bpTemplateUpdaterService.createUnmatchedBPCategories(templateDetail, false, 1L)).thenReturn(List.of());
        when(bpTemplateService.getTemplateByUserAndId(1L, 1L)).thenReturn(Optional.of(template));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.resyncTemplate(1L, 1L);

        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(BPTemplateType.MONTHLY_STD, actual.get().getTemplateType());
        verify(bpTemplateUpdaterService, never()).updateBPCategories(templateDetail, 1L, true);
        verify(templatePersistenceService).saveCategoryChanges(updatedBPCategories, List.of(), 1L);
    }

    @Test
    void testGenerateNewTemplate_whenTemplateTypeIsNull_thenReturnEmptyOptional(){
        Optional<BPTemplate> actual = bpTemplateGeneratorService.generateNewTemplate(null, Period.MONTHLY, createTestDateRanges(), 1L, 1);
        assertNotNull(actual);
        assertFalse(actual.isPresent());
        verifyNoInteractions(templateGeneratorBuilderService, templatePersistenceService);
    }

    @Test
    void testGenerateNewTemplate_whenMonthlyStdTemplate_thenReturnTemplate(){
        BPTemplateType monthly = BPTemplateType.MONTHLY_STD;
        Period period = Period.MONTHLY;
        Integer startDay = 1;
        List<DateRange> dateRanges = createTestDateRanges();
        List<SubBudget> subBudgets = createTestSubBudgets();

        BPTemplateDetail templateDetail = createTestTemplateDetail();

        BPTemplate initialTemplate = new BPTemplate();
        initialTemplate.setBpTemplateDetail(templateDetail);
        initialTemplate.setActive(true);
        initialTemplate.setPeriod(period);
        initialTemplate.setTemplateType(monthly);

        BPTemplatePointer initialPointer = createTestFuturePointer(
                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));

        BPTemplateEntity savedTemplateEntity = new BPTemplateEntity();
        savedTemplateEntity.setId(1L);

        BPTemplate finalTemplate = new BPTemplate();
        finalTemplate.setId(1L);
        finalTemplate.setBpTemplateDetail(templateDetail);
        finalTemplate.setActive(true);
        finalTemplate.setPeriod(period);
        finalTemplate.setTemplateType(monthly);

        when(subBudgetService.getSubBudgetsByDateRanges(dateRanges, 1L)).thenReturn(subBudgets);
        when(templateGeneratorBuilderService.buildInitialTemplate(monthly, period, subBudgets, startDay)).thenReturn(initialTemplate);
        when(templateGeneratorBuilderService.buildInitialPointer(eq(templateDetail.getLayoutGrid().columns()), eq(1L), any(LocalDate.class)))
                .thenReturn(initialPointer);
        when(templatePersistenceService.persistNewTemplate(initialTemplate, initialPointer, 1L)).thenReturn(savedTemplateEntity);
        when(templateGeneratorBuilderService.buildFinalTemplate(initialTemplate, 1L)).thenReturn(finalTemplate);

        Optional<BPTemplate> actual = bpTemplateGeneratorService.generateNewTemplate(monthly, period, dateRanges, 1L, startDay);

        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(1L, actual.get().getId());
        assertEquals(BPTemplateType.MONTHLY_STD, actual.get().getTemplateType());
        assertEquals(Period.MONTHLY, actual.get().getPeriod());
        assertEquals(1L, actual.get().getBpTemplateDetail().getId());
        assertEquals(BPLayoutType.CLASSIC, actual.get().getBpTemplateDetail().getLayoutType());
        BPLayoutGrid actualGrid = actual.get().getBpTemplateDetail().getLayoutGrid();
        assertNotNull(actualGrid);
        assertEquals(3, actualGrid.columns().size());
        assertEquals(4, actualGrid.rows().size());
        assertEquals(0, actualGrid.columns().get(0).getColumnIndex());
        assertEquals(LocalDate.of(2025, 1, 1), actualGrid.columns().get(0).getDateRange().getStartDate());
        assertEquals(LocalDate.of(2025, 1, 31), actualGrid.columns().get(0).getDateRange().getEndDate());

        // Build pointer → persist → build final, in that order
        InOrder inOrder = inOrder(templateGeneratorBuilderService, templatePersistenceService);
        inOrder.verify(templateGeneratorBuilderService).buildInitialPointer(eq(templateDetail.getLayoutGrid().columns()), eq(1L), any(LocalDate.class));
        inOrder.verify(templatePersistenceService).persistNewTemplate(initialTemplate, initialPointer, 1L);
        inOrder.verify(templateGeneratorBuilderService).buildFinalTemplate(initialTemplate, 1L);
    }

    @Test
    void testGenerateNewTemplate_whenBuildInitialTemplateFails_thenReturnEmptyOptional(){
        BPTemplateType monthly = BPTemplateType.MONTHLY_STD;
        Period period = Period.MONTHLY;
        Integer startDay = 1;
        List<DateRange> dateRanges = createTestDateRanges();

        when(subBudgetService.getSubBudgetsByDateRanges(dateRanges, 1L)).thenReturn(List.of());
        when(templateGeneratorBuilderService.buildInitialTemplate(monthly, period, List.of(), startDay))
                .thenThrow(new BPTemplateBuilderException("Error building initial template"));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.generateNewTemplate(monthly, period, dateRanges, 1L, startDay);

        assertNotNull(actual);
        assertFalse(actual.isPresent());
        verifyNoInteractions(templatePersistenceService);
    }

    @Test
    void testGenerateNewTemplate_whenPersistFails_thenReturnEmptyOptional(){
        BPTemplateType monthly = BPTemplateType.MONTHLY_STD;
        Period period = Period.MONTHLY;
        Integer startDay = 1;
        List<DateRange> dateRanges = createTestDateRanges();
        List<SubBudget> subBudgets = createTestSubBudgets();

        BPTemplate initialTemplate = new BPTemplate();
        initialTemplate.setBpTemplateDetail(createTestTemplateDetail());
        initialTemplate.setTemplateType(monthly);
        initialTemplate.setPeriod(period);

        BPTemplatePointer initialPointer = createTestFuturePointer(
                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));

        when(subBudgetService.getSubBudgetsByDateRanges(dateRanges, 1L)).thenReturn(subBudgets);
        when(templateGeneratorBuilderService.buildInitialTemplate(monthly, period, subBudgets, startDay)).thenReturn(initialTemplate);
        when(templateGeneratorBuilderService.buildInitialPointer(anyList(), eq(1L), any(LocalDate.class))).thenReturn(initialPointer);
        when(templatePersistenceService.persistNewTemplate(initialTemplate, initialPointer, 1L))
                .thenThrow(new TemplateDetailException("Template detail cannot be null"));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.generateNewTemplate(monthly, period, dateRanges, 1L, startDay);

        assertNotNull(actual);
        assertFalse(actual.isPresent());
        verify(templateGeneratorBuilderService, never()).buildFinalTemplate(any(), any());
    }

    @Test
    void testGenerateDefaultTemplate_whenValid_thenReturnMonthlyTemplate(){
        List<SubBudget> subBudgets = createTestSubBudgets();
        BPTemplateDetail templateDetail = createTestTemplateDetail();

        BPTemplate initialTemplate = new BPTemplate();
        initialTemplate.setBpTemplateDetail(templateDetail);
        initialTemplate.setTemplateType(BPTemplateType.MONTHLY_STD);
        initialTemplate.setPeriod(Period.MONTHLY);

        BPTemplatePointer initialPointer = createTestFuturePointer(
                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)));

        BPTemplateEntity savedTemplateEntity = new BPTemplateEntity();
        savedTemplateEntity.setId(1L);

        BPTemplate finalTemplate = new BPTemplate();
        finalTemplate.setId(1L);
        finalTemplate.setBpTemplateDetail(templateDetail);
        finalTemplate.setTemplateType(BPTemplateType.MONTHLY_STD);
        finalTemplate.setPeriod(Period.MONTHLY);

        when(subBudgetService.getSubBudgetsByDateRanges(anyList(), eq(1L))).thenReturn(subBudgets);
        when(templateGeneratorBuilderService.buildInitialTemplate(BPTemplateType.MONTHLY_STD, Period.MONTHLY, subBudgets, 0))
                .thenReturn(initialTemplate);
        when(templateGeneratorBuilderService.buildInitialPointer(anyList(), eq(1L), any(LocalDate.class))).thenReturn(initialPointer);
        when(templatePersistenceService.persistNewTemplate(initialTemplate, initialPointer, 1L)).thenReturn(savedTemplateEntity);
        when(templateGeneratorBuilderService.buildFinalTemplate(initialTemplate, 1L)).thenReturn(finalTemplate);

        Optional<BPTemplate> actual = bpTemplateGeneratorService.generateDefaultTemplate(1L);

        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(1L, actual.get().getId());
        assertEquals(BPTemplateType.MONTHLY_STD, actual.get().getTemplateType());
        assertEquals(Period.MONTHLY, actual.get().getPeriod());
    }

    @Test
    void testMoveFuturePointerAndResyncTemplate_whenTemplateIdIsNull_thenReturnEmptyOptional(){
        BPTemplatePointer futurePointer = createTestFuturePointer(
                new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.moveFuturePointerAndResyncTemplate(null, 1L, futurePointer, LocalDate.of(2026, 11, 4));

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
        verifyNoInteractions(templatePersistenceService, templateGeneratorBuilderService);
    }

    @Test
    void testMoveFuturePointerAndResyncTemplate_whenUserIdIsNull_thenReturnEmptyOptional(){
        BPTemplatePointer futurePointer = createTestFuturePointer(
                new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.moveFuturePointerAndResyncTemplate(1L, null, futurePointer, LocalDate.of(2026, 11, 4));

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
        verifyNoInteractions(templatePersistenceService, templateGeneratorBuilderService);
    }

    @Test
    void testMoveFuturePointerAndResyncTemplate_whenFuturePointerIsNull_thenReturnEmptyOptional(){
        Optional<BPTemplate> actual = bpTemplateGeneratorService.moveFuturePointerAndResyncTemplate(1L, 1L, null, LocalDate.of(2026, 11, 4));

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
        verifyNoInteractions(templatePersistenceService, templateGeneratorBuilderService);
    }

    @Test
    void testMoveFuturePointerAndResyncTemplate_whenNextFuturePointerDateIsNull_thenReturnEmptyOptional(){
        BPTemplatePointer futurePointer = createTestFuturePointer(
                new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.moveFuturePointerAndResyncTemplate(1L, 1L, futurePointer, null);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
        verifyNoInteractions(templatePersistenceService, templateGeneratorBuilderService);
    }

    @Test
    void testMoveFuturePointerAndResyncTemplate_whenTemplateDetailNotFound_thenReturnEmptyOptional(){
        BPTemplatePointer futurePointer = createTestFuturePointer(
                new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20)));

        when(templatePersistenceService.findTemplateDetailByTemplateId(1L))
                .thenThrow(new TemplateDetailException("Budget template detail not found"));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.moveFuturePointerAndResyncTemplate(1L, 1L, futurePointer, LocalDate.of(2026, 11, 4));

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
        verify(templatePersistenceService, never()).persistFuturePointerMove(any(), any(), any());
    }

    @Test
    void testMoveFuturePointerAndResyncTemplate_whenBuildingColumnsFails_thenReturnEmptyOptionalAndNothingPersisted(){
        DateRange currentDateRange = new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20));
        BPTemplatePointer futurePointer = createTestFuturePointer(currentDateRange);
        LocalDate nextFutureDate = LocalDate.of(2026, 11, 4);

        BPTemplateDetail existingDetail = createTestTemplateDetail();
        existingDetail.setFuturePointer(futurePointer);

        when(templatePersistenceService.findTemplateDetailByTemplateId(1L)).thenReturn(existingDetail);
        when(bpTemplateService.getTemplateTypeById(1L)).thenReturn(BPTemplateType.INCOME_STD);
        when(templateGeneratorBuilderService.buildFutureColumns(BPTemplateType.INCOME_STD, existingDetail.getLayoutGrid().columns(), nextFutureDate))
                .thenThrow(new BPTemplateBuilderException("Unsupported template type for future pointer move"));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.moveFuturePointerAndResyncTemplate(1L, 1L, futurePointer, nextFutureDate);

        assertNotNull(actual);
        assertTrue(actual.isEmpty());
        verify(templatePersistenceService, never()).persistFuturePointerMove(any(), any(), any());
        verifyNoInteractions(bpTemplateUpdaterService);
    }

    @Test
    void testMoveFuturePointerAndResyncTemplate_whenFuturePointerValid_thenReturnTemplate(){
        DateRange currentDateRange = new DateRange(LocalDate.of(2026, 10, 7), LocalDate.of(2026, 10, 20));
        BPTemplatePointer futurePointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(currentDateRange)
                .isUpdateEnabled(true)
                .isLocked(true)
                .id(1L)
                .build();
        LocalDate nextFutureDate = LocalDate.of(2026, 11, 4);

        // Template detail BEFORE the move
        BPTemplateDetail existingDetail = new BPTemplateDetail();
        existingDetail.setId(1L);
        existingDetail.setTemplateId(1L);
        existingDetail.setLayoutType(BPLayoutType.CLASSIC);
        existingDetail.setLayoutGrid(createTestBPLayoutGrid());
        existingDetail.setFuturePointer(futurePointer);
        List<BPColumn> existingColumns = existingDetail.getLayoutGrid().columns();

        // What the builder produces: 10/21–11/3 and 11/4–11/17 appended, pointer on 11/4–11/17
        List<BPColumn> futureColumns = createFuturePointerColumns(
                currentDateRange, nextFutureDate, Period.BIWEEKLY, existingColumns.size());
        List<BPColumn> allColumns = new ArrayList<>(existingColumns);
        allColumns.addAll(futureColumns);

        BPTemplatePointer movedFuturePointer = BPTemplatePointer.builder()
                .templateDetailId(1L)
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(futureColumns.get(futureColumns.size() - 1).getDateRange())
                .isUpdateEnabled(true)
                .isLocked(false)
                .id(1L)
                .build();

        // Template AFTER the move, as returned by the resync
        BPTemplate expected = new BPTemplate();
        expected.setId(1L);

        BPTemplateDetail expectedDetail = new BPTemplateDetail();
        expectedDetail.setId(1L);
        expectedDetail.setTemplateId(1L);
        expectedDetail.setLayoutType(BPLayoutType.CLASSIC);
        expectedDetail.setLayoutGrid(createTestBPLayoutGridWithFutureColumns(futureColumns));
        expectedDetail.setFuturePointer(movedFuturePointer);

        expected.setTemplateType(BPTemplateType.INCOME_STD);
        expected.setActive(true);
        expected.setPeriod(Period.BIWEEKLY);
        expected.setBpTemplateDetail(expectedDetail);

        List<BPCategory> updatedBPCategories = createTestUpdatedBPCategories(1L);

        // Move
        when(templatePersistenceService.findTemplateDetailByTemplateId(1L)).thenReturn(existingDetail);
        when(bpTemplateService.getTemplateTypeById(1L)).thenReturn(BPTemplateType.INCOME_STD);
        when(templateGeneratorBuilderService.buildFutureColumns(BPTemplateType.INCOME_STD, existingColumns, nextFutureDate))
                .thenReturn(futureColumns);
        when(templateGeneratorBuilderService.buildMovedPointer(futurePointer, allColumns, 1L, nextFutureDate))
                .thenReturn(movedFuturePointer);

        // Resync that runs after the move
        when(bpTemplateUpdaterService.updateBPCategories(existingDetail, 1L, true)).thenReturn(updatedBPCategories);
        when(bpTemplateUpdaterService.createUnmatchedBPCategories(existingDetail, true, 1L)).thenReturn(List.of());
        when(bpTemplateService.getTemplateByUserAndId(1L, 1L)).thenReturn(Optional.of(expected));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.moveFuturePointerAndResyncTemplate(1L, 1L, futurePointer, nextFutureDate);

        assertNotNull(actual);
        assertTrue(actual.isPresent());
        BPTemplate actualTemplate = actual.get();
        assertEquals(expected.getId(), actualTemplate.getId());
        assertEquals(expected.getTemplateType(), actualTemplate.getTemplateType());
        assertEquals(expected.getPeriod(), actualTemplate.getPeriod());
        assertEquals(expected.isActive(), actualTemplate.isActive());

        BPTemplateDetail actualDetail = actualTemplate.getBpTemplateDetail();
        assertEquals(expectedDetail.getId(), actualDetail.getId());
        assertEquals(expectedDetail.getLayoutType(), actualDetail.getLayoutType());

        // Columns: 3 existing + 2 new, with the right indexes and ranges
        List<BPColumn> expectedColumns = expectedDetail.getLayoutGrid().columns();
        List<BPColumn> actualColumns   = actualDetail.getLayoutGrid().columns();
        assertEquals(5, actualColumns.size());
        for (int i = 0; i < expectedColumns.size(); i++) {
            assertEquals(expectedColumns.get(i).getColumnIndex(), actualColumns.get(i).getColumnIndex());
            assertEquals(expectedColumns.get(i).getDateRange().getStartDate(), actualColumns.get(i).getDateRange().getStartDate());
            assertEquals(expectedColumns.get(i).getDateRange().getEndDate(),   actualColumns.get(i).getDateRange().getEndDate());
        }

        // Every row got a cell for each new column
        List<BPGridRow> expectedRows = expectedDetail.getLayoutGrid().rows();
        List<BPGridRow> actualRows   = actualDetail.getLayoutGrid().rows();
        assertEquals(expectedRows.size(), actualRows.size());
        for (int i = 0; i < expectedRows.size(); i++) {
            assertEquals(5, actualRows.get(i).cells().size());
        }

        // Pointer moved to the last new column
        DateRange actualPointerRange = actualDetail.getFuturePointer().getCurrentDateRange();
        assertEquals(LocalDate.of(2026, 11, 4),  actualPointerRange.getStartDate());
        assertEquals(LocalDate.of(2026, 11, 17), actualPointerRange.getEndDate());

        // Build → persist → resync, in that order
        InOrder inOrder = inOrder(templateGeneratorBuilderService, templatePersistenceService, bpTemplateUpdaterService);
        inOrder.verify(templateGeneratorBuilderService).buildFutureColumns(BPTemplateType.INCOME_STD, existingColumns, nextFutureDate);
        inOrder.verify(templateGeneratorBuilderService).buildMovedPointer(futurePointer, allColumns, 1L, nextFutureDate);
        inOrder.verify(templatePersistenceService).persistFuturePointerMove(1L, futureColumns, movedFuturePointer);
        inOrder.verify(bpTemplateUpdaterService).updateBPCategories(existingDetail, 1L, true);
        inOrder.verify(templatePersistenceService).saveCategoryChanges(updatedBPCategories, List.of(), 1L);
    }



    private List<BPGridCell> createFuturePointerCells(List<BPColumn> futureColumns) {
        List<BPGridCell> cells = new ArrayList<>();
        for (BPColumn column : futureColumns) {
            cells.add(new BPGridCell(column.getColumnIndex(), column.getDateRange(),
                    BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, false, true));
        }
        return cells;
    }

    private BPLayoutGrid createTestBPLayoutGridWithFutureColumns(List<BPColumn> futureColumns) {
        List<BPColumn> columns = new ArrayList<>(createTestColumns());
        columns.addAll(futureColumns);
        return new BPLayoutGrid(columns, createTestGridRows(createFuturePointerCells(futureColumns)));
    }


    private LocalDate periodEnd(LocalDate start, Period period) {
        return switch (period) {
            case WEEKLY    -> start.plusWeeks(1).minusDays(1);
            case BIWEEKLY  -> start.plusWeeks(2).minusDays(1);
            case MONTHLY   -> start.plusMonths(1).minusDays(1);
            case BIMONTHLY -> start.plusMonths(2).minusDays(1);
            case QUARTERLY -> start.plusMonths(3).minusDays(1);
            default -> throw new IllegalArgumentException("Unsupported period: " + period);
        };
    }


    private BPTemplate createExpectedTemplateAfterPointerMove(DateRange currentRange,
                                                              LocalDate nextFuturePointerDate,
                                                              Period period) {
        List<BPColumn> futureColumns = createFuturePointerColumns(
                currentRange, nextFuturePointerDate, period, createTestColumns().size());

        BPTemplateDetail detail = new BPTemplateDetail();
        detail.setId(1L);
        detail.setTemplateId(1L);
        detail.setLayoutType(BPLayoutType.CLASSIC);
        detail.setLayoutGrid(createTestBPLayoutGridWithFutureColumns(futureColumns));
        detail.setFuturePointer(createMovedFuturePointer(futureColumns));

        BPTemplate template = new BPTemplate();
        template.setId(1L);
        template.setTemplateType(BPTemplateType.INCOME_STD);
        template.setActive(true);
        template.setPeriod(period);
        template.setBpTemplateDetail(detail);
        return template;
    }

    private BPTemplatePointer createMovedFuturePointer(List<BPColumn> futureColumns) {
        return createTestFuturePointer(futureColumns.get(futureColumns.size() - 1).getDateRange());
    }

    private BPTemplatePointer createTestFuturePointer(DateRange currentDateRange) {
        return BPTemplatePointer.builder()
                .id(1L)
                .templateDetailId(1L)
                .pointerMode(PointerMode.FUTURE)
                .currentDateRange(currentDateRange)
                .isUpdateEnabled(true)
                .isLocked(true)
                .build();
    }

    /**
     * Builds the columns a future-pointer move should add: one per period, starting the day
     * after the pointer's current range ends, until a column contains nextFuturePointerDate.
     * e.g. BIWEEKLY, current 10/7–10/20, next 11/4 → 10/21–11/3 and 11/4–11/17.
     */
    private List<BPColumn> createFuturePointerColumns(DateRange currentRange,
                                                      LocalDate nextFuturePointerDate,
                                                      Period period,
                                                      int startColumnIndex) {
        List<BPColumn> columns = new ArrayList<>();
        LocalDate start = currentRange.getEndDate().plusDays(1);
        int columnIndex = startColumnIndex;

        while (!start.isAfter(nextFuturePointerDate)) {
            LocalDate end = periodEnd(start, period);
            columns.add(BPColumn.builder()
                    .columnIndex(columnIndex++)
                    .dateRange(new DateRange(start, end))
                    .period(period)
                    .columnType(BPColumnType.ACTUAL)   // swap for your future/planned column type if you have one
                    .isHeader(false)
                    .build());
            start = end.plusDays(1);
        }
        return columns;
    }

    private List<BPCategory> createTestUpdatedBPCategories(Long templateDetailId) {
        List<BPCategory> categories = new ArrayList<>();

        BPCategory income = new BPCategory();
        income.setTemplateDetailId(templateDetailId);
        income.setName("Income");
        income.setType(BPType.INCOME);
        income.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        income.setPlannedAmount(BigDecimal.ZERO);
        income.setActual(new BigDecimal("4000.03"));
        income.setBudgeted(new BigDecimal("4000.00"));
        income.setColumnIndex(1);
        categories.add(income);

        BPCategory groceries = new BPCategory();
        groceries.setTemplateDetailId(templateDetailId);
        groceries.setName("Groceries");
        groceries.setType(BPType.EXPENSE);
        groceries.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        groceries.setPlannedAmount(BigDecimal.ZERO);
        groceries.setActual(new BigDecimal("494.25"));
        groceries.setBudgeted(new BigDecimal("400.00"));
        groceries.setColumnIndex(2);
        categories.add(groceries);

        BPCategory rent = new BPCategory();
        rent.setTemplateDetailId(templateDetailId);
        rent.setName("Rent");
        rent.setType(BPType.BUDGET);
        rent.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        rent.setPlannedAmount(new BigDecimal("5000.00"));
        rent.setActual(BigDecimal.valueOf(1927.00));
        rent.setBudgeted(BigDecimal.valueOf(1927));
        rent.setColumnIndex(0);
        categories.add(rent);

        return categories;
    }

    private List<DateRange> createTestDateRanges() {
        List<DateRange> dateRanges = new ArrayList<>();

        dateRanges.add(new DateRange(
                LocalDate.of(2025, 1, 1),
                LocalDate.of(2025, 1, 31)));

        dateRanges.add(new DateRange(
                LocalDate.of(2025, 2, 1),
                LocalDate.of(2025, 2, 28)));

        dateRanges.add(new DateRange(
                LocalDate.of(2025, 3, 1),
                LocalDate.of(2025, 3, 31)));

        return dateRanges;
    }

    private Budget createTestBudget()
    {
        Budget budget = new Budget();
        budget.setId(1L);
        budget.setUserId(1L);
        return budget;
    }

    private List<SubBudget> createTestSubBudgets() {
        List<SubBudget> subBudgets = new ArrayList<>();

        SubBudget januarySubBudget = new SubBudget();
        januarySubBudget.setId(1L);
        januarySubBudget.setBudget(createTestBudget());
        januarySubBudget.setStartDate(LocalDate.of(2025, 1, 1));
        januarySubBudget.setEndDate(LocalDate.of(2025, 1, 31));
        januarySubBudget.setSubBudgetName("January 2025");
        januarySubBudget.setAllocatedAmount(new BigDecimal("5000.00"));
        januarySubBudget.setSpentOnBudget(new BigDecimal("3200.00"));
        januarySubBudget.setActive(true);
        subBudgets.add(januarySubBudget);

        SubBudget februarySubBudget = new SubBudget();
        februarySubBudget.setId(2L);
        februarySubBudget.setBudget(createTestBudget());
        februarySubBudget.setStartDate(LocalDate.of(2025, 2, 1));
        februarySubBudget.setEndDate(LocalDate.of(2025, 2, 28));
        februarySubBudget.setSubBudgetName("February 2025");
        februarySubBudget.setAllocatedAmount(new BigDecimal("5000.00"));
        februarySubBudget.setSpentOnBudget(new BigDecimal("3600.00"));
        februarySubBudget.setActive(true);
        subBudgets.add(februarySubBudget);

        SubBudget marchSubBudget = new SubBudget();
        marchSubBudget.setId(3L);
        marchSubBudget.setBudget(createTestBudget());
        marchSubBudget.setStartDate(LocalDate.of(2025, 3, 1));
        marchSubBudget.setEndDate(LocalDate.of(2025, 3, 31));
        marchSubBudget.setSubBudgetName("March 2025");
        marchSubBudget.setAllocatedAmount(new BigDecimal("5200.00"));
        marchSubBudget.setSpentOnBudget(new BigDecimal("3100.00"));
        marchSubBudget.setActive(true);
        subBudgets.add(marchSubBudget);

        return subBudgets;
    }

    private List<BPColumn> createTestColumns() {
        List<BPColumn> columns = new ArrayList<>();

        columns.add(BPColumn.builder()
                .columnIndex(0)
                .dateRange(new DateRange(
                        LocalDate.of(2025, 1, 1),
                        LocalDate.of(2025, 1, 31)))
                .period(Period.MONTHLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(1)
                .dateRange(new DateRange(
                        LocalDate.of(2025, 2, 1),
                        LocalDate.of(2025, 2, 28)))
                .period(Period.MONTHLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        columns.add(BPColumn.builder()
                .columnIndex(2)
                .dateRange(new DateRange(
                        LocalDate.of(2025, 3, 1),
                        LocalDate.of(2025, 3, 31)))
                .period(Period.MONTHLY)
                .columnType(BPColumnType.ACTUAL)
                .isHeader(false)
                .build());

        return columns;
    }

    private BPTemplateDetail createTestTemplateDetail() {
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setId(1L);
        templateDetail.setTemplateId(1L);
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());
        return templateDetail;
    }

    private List<BPGridRow> createTestGridRows(List<BPGridCell> extraCells) {
        List<BPGridRow> rows = new ArrayList<>();

        // Income row
        rows.add(new BPGridRow(
                "Income",
                BPType.INCOME,
                withCells(List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("5000.00"),
                                new BigDecimal("5000.00"),
                                BigDecimal.ZERO, true, false),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("5000.00"),
                                new BigDecimal("5000.00"),
                                BigDecimal.ZERO, false, true),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("5200.00"),
                                new BigDecimal("5000.00"),
                                BigDecimal.ZERO, false, true)
                ), extraCells)
        ));

        // Expenses row
        rows.add(new BPGridRow(
                "Expenses",
                BPType.EXPENSE,
                withCells(List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("3200.00"),
                                new BigDecimal("3500.00"),
                                BigDecimal.ZERO, false, true),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("3600.00"),
                                new BigDecimal("3500.00"),
                                BigDecimal.ZERO, false, true),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("3100.00"),
                                new BigDecimal("3500.00"),
                                BigDecimal.ZERO, false, true)
                ), extraCells)
        ));

        // Balance row
        rows.add(new BPGridRow(
                "Balance",
                BPType.BALANCE,
                withCells(List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("1800.00"),
                                new BigDecimal("1500.00"),
                                BigDecimal.ZERO, true, false),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("1400.00"),
                                new BigDecimal("1500.00"),
                                BigDecimal.ZERO, true, false),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("2100.00"),
                                new BigDecimal("1500.00"),
                                BigDecimal.ZERO, true, false)
                ), extraCells)
        ));

        // Savings row
        rows.add(new BPGridRow(
                "Savings",
                BPType.BUDGET,
                withCells(List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("500.00"),
                                new BigDecimal("500.00"),
                                BigDecimal.ZERO, false, true),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("300.00"),
                                new BigDecimal("500.00"),
                                BigDecimal.ZERO, false, true),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("600.00"),
                                new BigDecimal("500.00"),
                                BigDecimal.ZERO, false, true)
                ), extraCells)
        ));

        return rows;
    }

    private List<BPGridCell> withCells(List<BPGridCell> base, List<BPGridCell> extra) {
        List<BPGridCell> cells = new ArrayList<>(base);
        cells.addAll(extra);
        return cells;
    }

    private List<BPGridRow> createTestGridRows() {
        return createTestGridRows(List.of());
    }


    private BPLayoutGrid createTestBPLayoutGrid() {
        return new BPLayoutGrid(createTestColumns(), createTestGridRows());
    }



    @AfterEach
    void tearDown() {
    }
}