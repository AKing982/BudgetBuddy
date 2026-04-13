package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.BPCategoryEntity;
import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
public class BPTemplateDetailEntityToModelConverter implements Converter<BPTemplateDetailEntity, BPTemplateDetail>
{
    @Override
    public BPTemplateDetail convert(BPTemplateDetailEntity bpTemplateDetailEntity)
    {
        return BPTemplateDetail.builder()
                .id(bpTemplateDetailEntity.getId())
                .layoutGrid(buildLayoutGrid(bpTemplateDetailEntity))
                .createdAt(bpTemplateDetailEntity.getCreatedAt())
                .layoutType(bpTemplateDetailEntity.getLayoutType())
                .templateId(bpTemplateDetailEntity.getBpTemplate().getId())
                .build();
    }

    private BPType resolveBPType(String category)
    {
        return switch (category) {
            case "Salary", "Income" -> BPType.INCOME;
            case "Balance"          -> BPType.BALANCE;
            case "Expenses"         -> BPType.EXPENSE;
            default                 -> BPType.BUDGET;
        };
    }

    private BPLayoutGrid buildLayoutGrid(BPTemplateDetailEntity entity)
    {
        List<BPColumn> columns = entity.getColumns().stream()
                .map(col -> BPColumn.builder()
                        .columnIndex(col.getColumnIndex())
                        .dateRange(new DateRange(col.getStartDate(), col.getEndDate()))
                        .period(col.getPeriod())
                        .columnType(col.getColumnType())
                        .isHeader(col.isHeader())
                        .build())
                .collect(Collectors.toList());

        Map<String, List<BPCategoryEntity>> byCategory = entity.getBudgetCategories().stream()
                .collect(Collectors.groupingBy(BPCategoryEntity::getCategory, LinkedHashMap::new, Collectors.toList()));

        List<BPGridRow> gridRows = byCategory.entrySet().stream()
                .map(entry -> new BPGridRow(
                        entry.getKey(),
                        resolveBPType(entry.getKey()),
                        entry.getValue().stream()
                                .map(e -> new BPGridCell(
                                        e.getBpColumn().getColumnIndex(),
                                        new DateRange(e.getStartDate(), e.getEndDate()),
                                        e.getActualAmount(),
                                        e.getBudgetedAmount(),
                                        true, true))
                                .collect(Collectors.toList())))
                .collect(Collectors.toList());

        return new BPLayoutGrid(columns, gridRows);
    }
}
