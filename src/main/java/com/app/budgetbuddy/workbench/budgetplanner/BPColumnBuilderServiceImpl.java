package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPColumnService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.IntStream;

@Service
@Slf4j
public class BPColumnBuilderServiceImpl implements BPColumnBuilderService
{

    @Override
    public List<BPColumn> buildColumns(Period period, List<DateRange> dateRanges, int indexOffset)
    {
        if(dateRanges == null)
        {
            return Collections.emptyList();
        }
        List<BPColumn> columns = IntStream.range(0, dateRanges.size())
                .mapToObj(index -> new BPColumn(indexOffset + index, dateRanges.get(index), period, BPColumnType.ACTUAL, false))
                .toList();
        log.info("Columns: {}", columns);
        return columns;
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
