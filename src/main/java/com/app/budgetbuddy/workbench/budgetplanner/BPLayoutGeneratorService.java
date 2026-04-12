package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BPColumnService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    public BPLayoutGrid generateLayoutGrid(BPTemplateType templateType, BPIncomeCriteria incomeCriteria, boolean requireCategoryHeaders, List<String> categoryHeaders, List<SubBudget> subBudgetList)
    {
        if(templateType == null || subBudgetList == null || subBudgetList.isEmpty())
        {
            throw new DataException("Template type and sub budgets cannot be null or empty");
        }
        BPLayout layout = bpLayoutBuilderService.buildLayout(templateType,incomeCriteria, requireCategoryHeaders, categoryHeaders, subBudgetList);
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
                    Map<Integer, BPCategory> cellByIndex = cells.stream()
                            .collect(Collectors.toMap(BPCategory::getColumnIndex, c -> c));
                    List<BPGridCell> gridCells = columns.stream()
                            .map(col -> {
                                BPCategory cell = cellByIndex.get(col.columnIndex());
                                return new BPGridCell(
                                        col.columnIndex(),
                                        col.dateRange(),
                                        cell != null ? cell.getActual() : null,
                                        cell != null ? cell.getBudgeted() : null,
                                        cell != null && cell.getType() == BPType.BUDGET,
                                        true
                                );
                            })
                            .toList();
                    BPType type = cells.isEmpty() ? BPType.BUDGET : cells.get(0).getType();
                    return new BPGridRow(name, type, gridCells);
                })
                .toList();
        return new BPLayoutGrid(columns, gridRows);
    }

    public void saveLayoutGrid(BPLayoutGrid layoutGrid)
    {
        if(layoutGrid == null)
        {
            throw new DataException("Layout grid cannot be null");
        }
        bpColumnService.saveColumns(layoutGrid.columns());
        // 2. save categories — bp_column_id now exists
        List<BPCategory> allCategories = layoutGrid.rows().stream()
                .flatMap(row -> {
                    Map<Integer, BPGridCell> cellByIndex = row.cells().stream()
                            .collect(Collectors.toMap(BPGridCell::columnIndex, c -> c));
                    return layoutGrid.columns().stream()
                            .map(col -> {
                                BPGridCell cell = cellByIndex.get(col.columnIndex());
                                return BPCategory.builder()
                                        .name(row.category())
                                        .type(row.type())
                                        .columnIndex(col.columnIndex())
                                        .range(col.dateRange())
                                        .actual(cell != null ? cell.actual() : null)
                                        .budgeted(cell != null ? cell.budgeted() : null)
                                        .isActive(true)
                                        .build();
                            });
                })
                .filter(c -> c.getActual() != null)  // skip empty cells
                .toList();
        bpcategoryService.saveCategories(allCategories);
    }
}

