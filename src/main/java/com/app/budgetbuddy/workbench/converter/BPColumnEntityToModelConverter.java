package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.BPColumn;
import com.app.budgetbuddy.domain.DateRange;
import com.app.budgetbuddy.entities.BPColumnEntity;
import org.springframework.stereotype.Component;

@Component
public class BPColumnEntityToModelConverter implements Converter<BPColumnEntity, BPColumn>
{

    @Override
    public BPColumn convert(BPColumnEntity bpColumnEntity)
    {
        if (bpColumnEntity == null)
        {
            return null;
        }
        DateRange dateRange = (bpColumnEntity.getStartDate() != null || bpColumnEntity.getEndDate() != null)
                ? new DateRange(bpColumnEntity.getStartDate(), bpColumnEntity.getEndDate())
                : null;
        return BPColumn.builder()
                .columnIndex(bpColumnEntity.getColumnIndex())
                .dateRange(dateRange)
                .period(bpColumnEntity.getPeriod())
                .columnType(bpColumnEntity.getColumnType())
                .isHeader(bpColumnEntity.isHeader())
                .build();
    }
}
