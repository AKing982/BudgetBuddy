package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPColumnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.IntStream;

@Service
public class BPColumnBuilderServiceImpl implements BPColumnBuilderService
{

    @Override
    public List<BPColumn> buildColumns(Period period, List<DateRange> dateRanges, int indexOffset)
    {
        if(dateRanges == null)
        {
            return Collections.emptyList();
        }
        return IntStream.range(0, dateRanges.size())
                .mapToObj(index -> new BPColumn(indexOffset + index, dateRanges.get(index), period, BPColumnType.ACTUAL, false))
                .toList();
    }

    @Override
    public BPColumn buildHeaderColumn(int columnIndex, Period period, DateRange dateRange)
    {
        if(dateRange == null)
        {
            return null;
        }
        return new BPColumn(columnIndex, dateRange, period, null, true);
    }

    @Override
    public BPColumn buildSubColumn(int columnIndex, Period period, DateRange dateRange, BPColumnType columnType)
    {
        if(dateRange == null || columnType == null)
        {
            return null;
        }
        return new BPColumn(columnIndex, dateRange, period, columnType, false);
    }
}
