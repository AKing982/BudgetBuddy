package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPColumn;
import com.app.budgetbuddy.entities.BPColumnEntity;
import org.springframework.stereotype.Component;

@Component
public class BPColumnToEntityConverter implements Converter<BPColumn, BPColumnEntity>
{
    @Override
    public BPColumnEntity convert(BPColumn bpColumn)
    {
        if(bpColumn == null)
        {
            return null;
        }
        BPColumnEntity entity = new BPColumnEntity();
        entity.setColumnType(bpColumn.columnType());
        entity.setColumnIndex(bpColumn.columnIndex());
        entity.setPeriod(bpColumn.period());
        entity.setHeader(bpColumn.isHeader());
        entity.setStartDate(bpColumn.dateRange().getStartDate());
        entity.setEndDate(bpColumn.dateRange().getEndDate());
        entity.setBpTemplateDetail(null);
        return entity;
    }
}
