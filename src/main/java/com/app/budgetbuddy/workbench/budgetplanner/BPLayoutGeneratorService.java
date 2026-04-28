package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BPColumnService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class BPLayoutGeneratorService
{
    private final BPLayoutBuilderService bpLayoutBuilderService;
    private final BPColumnService bpColumnService;
    private final BPCategoryService bpcategoryService;

    @Autowired
    public BPLayoutGeneratorService(BPLayoutBuilderService bpLayoutBuilderService,
                                    BPColumnService bpColumnService,
                                    BPCategoryService bpcategoryService)
    {
        this.bpLayoutBuilderService = bpLayoutBuilderService;
        this.bpColumnService = bpColumnService;
        this.bpcategoryService = bpcategoryService;
    }

    public BPLayoutGrid generateLayoutGrid(BPTemplateType templateType, BPIncomeCriteria incomeCriteria, boolean requireCategoryHeaders, List<String> categoryHeaders, List<SubBudget> subBudgetList, Integer startDay)
    {
        if(templateType == null || subBudgetList == null || subBudgetList.isEmpty())
        {
            throw new DataException("Template type and sub budgets cannot be null or empty");
        }
        BPLayout layout = bpLayoutBuilderService.buildLayout(templateType,incomeCriteria, requireCategoryHeaders, categoryHeaders, subBudgetList, startDay);
        List<BPColumn> columns = layout.columns();
        List<BPCategory> categories = layout.bpCategories();
        Map<String, List<BPCategory>> categoryRowMap = new LinkedHashMap<>();
        for(BPCategory category : categories)
        {
            categoryRowMap.computeIfAbsent(category.getName(), k -> new ArrayList<>())
                    .add(category);
        }
        List<BPGridRow> gridRows = categoryRowMap.entrySet().stream()
                .map(entry -> {
                    String name = entry.getKey();
                    List<BPCategory> cells = entry.getValue();
                    // fill missing columns with empty cells
                    List<BPGridCell> gridCells = columns.stream()
                            .map(col -> {
                                BPCategory cell = cells.stream()
                                        .filter(c -> c.getColumnIndex() == col.getColumnIndex()
                                                && c.getRange().equals(col.getDateRange()))
                                        .findFirst()
                                        .orElse(null);
                                return new BPGridCell(
                                        col.getColumnIndex(),
                                        col.getDateRange(),
                                        cell != null ? cell.getActual() : BigDecimal.ZERO,
                                        cell != null ? cell.getBudgeted() : BigDecimal.ZERO,
                                        cell != null ? cell.getPlannedAmount() : BigDecimal.ZERO,
                                        cell != null && cell.getType() == BPType.BUDGET,
                                        true
                                );
                            })
                            .toList();
                    BPType type = cells.isEmpty() ? BPType.BUDGET : cells.get(0).getType();
                    return new BPGridRow(name, type, gridCells);
                })
                .toList();

        Set<String> specialRows = Set.of("Salary", "Expenses", "Balance", "Savings");
        List<BPGridRow> orderedRows = new ArrayList<>();
        gridRows.stream().filter(row -> !specialRows.contains(row.category())).forEach(orderedRows::add);
        gridRows.stream().filter(row -> row.category().equals("Salary")).findFirst().ifPresent(orderedRows::add);
        gridRows.stream().filter(row -> row.category().equals("Expenses")).findFirst().ifPresent(orderedRows::add);
        gridRows.stream().filter(row -> row.category().equals("Savings")).findFirst().ifPresent(orderedRows::add);
        gridRows.stream().filter(row -> row.category().equals("Balance")).findFirst().ifPresent(orderedRows::add);
        return new BPLayoutGrid(columns, orderedRows);
    }

    public void saveLayoutGrid(BPLayoutGrid layoutGrid, BPTemplateDetail detail)
    {
        if(layoutGrid == null)
        {
            throw new DataException("Layout grid cannot be null");
        }
//        bpColumnService.saveColumns(layoutGrid.columns(), detail);
        // 2. save categories — bp_column_id now exists
        List<BPCategory> allCategories = layoutGrid.rows().stream()
                .flatMap(row -> {
                    Map<Integer, BPGridCell> cellByIndex = row.cells().stream()
                            .collect(Collectors.toMap(BPGridCell::columnIndex, c -> c));
                    return layoutGrid.columns().stream()
                            .map(col -> {
                                BPGridCell cell = cellByIndex.get(col.getColumnIndex());
                                return BPCategory.builder()
                                        .name(row.category())
                                        .type(row.type())
                                        .columnIndex(col.getColumnIndex())
                                        .range(col.getDateRange())
                                        .actual(cell != null ? cell.actual() : null)
                                        .budgeted(cell != null ? cell.budgeted() : null)
                                        .isActive(true)
                                        .build();
                            });
                })
                .filter(c -> c.getActual() != null)  // skip empty cells
                .toList();
//        bpcategoryService.saveCategories(allCategories);
    }
}

