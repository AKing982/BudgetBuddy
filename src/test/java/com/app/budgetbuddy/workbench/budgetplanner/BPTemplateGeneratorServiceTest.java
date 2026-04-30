package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPColumnEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import com.app.budgetbuddy.entities.BPTemplateEntity;
import com.app.budgetbuddy.exceptions.TemplateDetailException;
import com.app.budgetbuddy.services.*;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
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
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BPTemplateGeneratorServiceTest
{
    @Mock
    private BPTemplateService bpTemplateService;

    @Mock
    private BPTemplateDetailsService bpTemplateDetailsService;

    @Mock
    private BPTemplateBuilderService bpTemplateBuilderService;

    @Mock
    private BPColumnService bpColumnService;

    @Mock
    private BPCategoryService bpcategoryService;

    @Mock
    private SubBudgetService subBudgetService;

    @Mock
    private BPTemplateUpdaterService bpTemplateUpdaterService;

    @InjectMocks
    private BPTemplateGeneratorService bpTemplateGeneratorService;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testResyncTemplate_whenTemplateIdIsNull_thenThrowException(){
        assertThrows(IllegalArgumentException.class, () -> bpTemplateGeneratorService.resyncTemplate(null, 1L));
    }

    @Test
    void testResyncTemplate_whenTemplateIdValid_NoBPTemplateDetailsFound_thenThrowException(){
        Mockito.when(bpTemplateDetailsService.findByTemplateId(1L)).thenReturn(Optional.empty());

        assertThrows(TemplateDetailException.class, () -> bpTemplateGeneratorService.resyncTemplate(1L, 1L));
    }

    @Test
    void testResyncTemplate_whenTemplateDetailIdValidAndIncomeSTD_thenReturnUpdatedBPCategories(){
        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setTemplateId(1L);
        templateDetail.setId(1L);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());
        Mockito.when(bpTemplateDetailsService.findByTemplateId(1L)).thenReturn(Optional.of(templateDetail));

        Mockito.when(bpTemplateService.getTemplateTypeById(1L)).thenReturn(BPTemplateType.INCOME_STD);
        List<BPCategory> updatedBPCategories = new ArrayList<>();
        BPCategory updatedIncomeBPCategory = new BPCategory();
        updatedIncomeBPCategory.setTemplateDetailId(templateDetail.getId());
        updatedIncomeBPCategory.setName("Income");
        updatedIncomeBPCategory.setType(BPType.INCOME);
        updatedIncomeBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        updatedIncomeBPCategory.setPlannedAmount(BigDecimal.ZERO);
        updatedIncomeBPCategory.setActual(new BigDecimal("4000.03"));
        updatedIncomeBPCategory.setBudgeted(new BigDecimal("4000.00"));
        updatedIncomeBPCategory.setColumnIndex(1);
        updatedBPCategories.add(updatedIncomeBPCategory);

        BPCategory updatedGroceriesBPCategory = new BPCategory();
        updatedGroceriesBPCategory.setTemplateDetailId(templateDetail.getId());
        updatedGroceriesBPCategory.setName("Groceries");
        updatedGroceriesBPCategory.setType(BPType.EXPENSE);
        updatedGroceriesBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        updatedGroceriesBPCategory.setPlannedAmount(BigDecimal.ZERO);
        updatedGroceriesBPCategory.setActual(new BigDecimal("494.25"));
        updatedGroceriesBPCategory.setBudgeted(new BigDecimal("400.00"));
        updatedGroceriesBPCategory.setColumnIndex(2);
        updatedBPCategories.add(updatedGroceriesBPCategory);

        BPCategory updatedRentBPCategory = new BPCategory();
        updatedRentBPCategory.setTemplateDetailId(templateDetail.getId());
        updatedRentBPCategory.setName("Rent");
        updatedRentBPCategory.setType(BPType.BUDGET);
        updatedRentBPCategory.setRange(new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)));
        updatedRentBPCategory.setPlannedAmount(new BigDecimal("5000.00"));
        updatedRentBPCategory.setActual(BigDecimal.valueOf(1927.00));
        updatedRentBPCategory.setBudgeted(BigDecimal.valueOf(1927));
        updatedRentBPCategory.setColumnIndex(0);
        updatedBPCategories.add(updatedRentBPCategory);

        Mockito.when(bpTemplateUpdaterService.updateBPCategories(templateDetail, 1L, true))
                .thenReturn(updatedBPCategories);

        BPTemplate template = new BPTemplate();
        template.setId(1L);
        template.setBpTemplateDetail(templateDetail);
        template.setTemplateType(BPTemplateType.INCOME_STD);
        template.setActive(true);

        Mockito.when(bpTemplateService.getTemplateByUserAndId(1L, 1L))
                .thenReturn(Optional.of(template));

        Optional<BPTemplate> actual = bpTemplateGeneratorService.resyncTemplate(1L, 1L);
        assertNotNull(actual);
        assertTrue(actual.isPresent());
        assertEquals(BPTemplateType.INCOME_STD, actual.get().getTemplateType());
        assertEquals(1L, actual.get().getId());
        assertEquals(1L, actual.get().getBpTemplateDetail().getId());
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

    @Test
    void testGenerateNewTemplate_whenTemplateTypeIsNull_thenReturnEmptyOptional(){
        BPIncomeCriteria incomeCriteria = mock(BPIncomeCriteria.class);
        List<SubBudget> subBudgets = List.of(mock(SubBudget.class));
        List<DateRange> dateRanges = createTestDateRanges();
        Optional<BPTemplate> actual = bpTemplateGeneratorService.generateNewTemplate(null, Period.MONTHLY, dateRanges, 1L, 1);
        assertNotNull(actual);
        assertFalse(actual.isPresent());
    }

    @Test
    void testGenerateNewTemplate_whenMonthlyStdTemplate_thenReturnTemplate(){
        BPTemplateType monthly = BPTemplateType.MONTHLY_STD;
        Period period = Period.MONTHLY;
        List<SubBudget> subBudgets = createTestSubBudgets();
        Integer startDay = 1;
        List<DateRange> dateRanges = createTestDateRanges();

        BPTemplateDetail templateDetail = new BPTemplateDetail();
        templateDetail.setId(1L);
        templateDetail.setTemplateId(1L);
        templateDetail.setLayoutType(BPLayoutType.CLASSIC);
        templateDetail.setLayoutGrid(createTestBPLayoutGrid());

        BPTemplate initialTemplate = new BPTemplate();
        initialTemplate.setId(1L);
        initialTemplate.setBpTemplateDetail(templateDetail);
        initialTemplate.setActive(true);
        initialTemplate.setPeriod(period);
        initialTemplate.setTemplateType(monthly);

        // stub the entity returned by saveTemplate so getId() doesn't NPE
        BPTemplateEntity savedTemplateEntity = new BPTemplateEntity();
        savedTemplateEntity.setId(1L);

        // stub the entity returned by saveModel
        BPTemplateDetailEntity savedDetailEntity = new BPTemplateDetailEntity();
        savedDetailEntity.setId(1L);

        // stub the columns returned by saveColumns
        List<BPColumnEntity> savedColumnEntities = new ArrayList<>();

        // final template returned by buildTemplate after save
        BPTemplate finalTemplate = new BPTemplate();
        finalTemplate.setId(1L);
        finalTemplate.setBpTemplateDetail(templateDetail);
        finalTemplate.setActive(true);
        finalTemplate.setPeriod(period);
        finalTemplate.setTemplateType(monthly);

        when(subBudgetService.getSubBudgetsByDateRanges(dateRanges, 1L))
                .thenReturn(subBudgets);

        when(bpTemplateBuilderService.buildInitialTemplate(monthly, period, false, List.of(), null, subBudgets, startDay))
                .thenReturn(initialTemplate);

        when(bpTemplateService.saveTemplate(initialTemplate, 1L))
                .thenReturn(savedTemplateEntity);

        when(bpTemplateDetailsService.saveModel(templateDetail, savedTemplateEntity))
                .thenReturn(savedDetailEntity);

        when(bpColumnService.saveColumns(templateDetail.getLayoutGrid().columns(), savedDetailEntity))
                .thenReturn(savedColumnEntities);

        when(bpTemplateBuilderService.buildTemplate(initialTemplate, initialTemplate.getBpGoalsDetail(), templateDetail))
                .thenReturn(finalTemplate);
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
    }

    @Test
    void testGenerateNewTemplate_whenMonthlyStdAndInitialTemplateIsNull_thenReturnEmptyOptional(){
        BPTemplateType monthly = BPTemplateType.MONTHLY_STD;
        Period period = Period.MONTHLY;
        Integer startDay = 1;
        List<DateRange> dateRanges = createTestDateRanges();

        Mockito.when(bpTemplateBuilderService.buildInitialTemplate(monthly, period, false, List.of(), null, List.of(), startDay))
                .thenReturn(null);

        Optional<BPTemplate> actual = bpTemplateGeneratorService.generateNewTemplate(monthly, period, dateRanges, 1L, startDay);
        assertNotNull(actual);
        assertFalse(actual.isPresent());
    }

    @Test
    void testSaveAndReturnTemplate_whenBPTemplateDetailIsNull_thenThrowException(){
        BPTemplate template = new BPTemplate();
        template.setId(1L);
        template.setBpTemplateDetail(null);
        template.setTemplateType(BPTemplateType.MONTHLY_STD);
        template.setActive(true);
        template.setPeriod(Period.MONTHLY);

        Long userId = 1L;
        assertThrows(TemplateDetailException.class, () -> {
            bpTemplateGeneratorService.saveAndReturnTemplate(template, null, userId);
        });
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

    private List<BPGridRow> createTestGridRows() {
        List<BPGridRow> rows = new ArrayList<>();

        // Income row — one cell per column
        rows.add(new BPGridRow(
                "Income",
                BPType.INCOME,
                List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("5000.00"),
                                new BigDecimal("5000.00"),
                                BigDecimal.ZERO, true, false),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("5000.00"),
                                new BigDecimal("5000.00"),
                                BigDecimal.ZERO,
                                false, true),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("5200.00"),
                                new BigDecimal("5000.00"),
                                BigDecimal.ZERO,false, true)
                )
        ));

        // Expenses row
        rows.add(new BPGridRow(
                "Expenses",
                BPType.EXPENSE,
                List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("3200.00"),
                                new BigDecimal("3500.00"),
                                BigDecimal.ZERO,false, true),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("3600.00"),
                                new BigDecimal("3500.00"),
                                BigDecimal.ZERO,false, true),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("3100.00"),
                                new BigDecimal("3500.00"),
                                BigDecimal.ZERO,false, true)
                )
        ));

        // Balance row — isBalance = true
        rows.add(new BPGridRow(
                "Balance",
                BPType.BALANCE,
                List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("1800.00"),
                                new BigDecimal("1500.00"),
                                BigDecimal.ZERO,true, false),
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
                )
        ));

        // Savings row
        rows.add(new BPGridRow(
                "Savings",
                BPType.BUDGET,
                List.of(
                        new BPGridCell(0,
                                new DateRange(LocalDate.of(2025, 1, 1), LocalDate.of(2025, 1, 31)),
                                new BigDecimal("500.00"),
                                new BigDecimal("500.00"),
                                BigDecimal.ZERO,false, true),
                        new BPGridCell(1,
                                new DateRange(LocalDate.of(2025, 2, 1), LocalDate.of(2025, 2, 28)),
                                new BigDecimal("300.00"),
                                new BigDecimal("500.00"),
                                BigDecimal.ZERO, false, true),
                        new BPGridCell(2,
                                new DateRange(LocalDate.of(2025, 3, 1), LocalDate.of(2025, 3, 31)),
                                new BigDecimal("600.00"),
                                new BigDecimal("500.00"),
                                BigDecimal.ZERO,false, true)
                )
        ));

        return rows;
    }

    private BPLayoutGrid createTestBPLayoutGrid() {
        return new BPLayoutGrid(createTestColumns(), createTestGridRows());
    }



    @AfterEach
    void tearDown() {
    }
}