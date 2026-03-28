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
    private final BPColumnService bpColumnService;

    @Autowired
    public BPColumnBuilderServiceImpl(BPColumnService bpColumnService)
    {
        this.bpColumnService = bpColumnService;
    }

    @Override
    public List<BPColumn> buildColumns(BPTemplateType templateType, Period period, List<DateRange> dateRanges)
    {
        if(templateType == null || period == null || dateRanges == null || dateRanges.isEmpty())
        {
            return Collections.emptyList();
        }
        return IntStream.range(0, dateRanges.size())
                .mapToObj(index -> new BPColumn(index, dateRanges.get(index), period,BPColumnType.ACTUAL, false))
                .toList();
    }

    @Override
    public BPColumn buildHeaderColumn(int columnIndex, DateRange dateRange, Period period)
    {
        if(dateRange == null || period == null)
        {
            return null;
        }
        return new BPColumn(columnIndex, dateRange, period, null, true);
    }

    @Override
    public BPColumn buildSubColumn(int columnIndex, DateRange dateRange, Period period, BPColumnType columnType)
    {
        if(dateRange == null || period == null || columnType == null)
        {
            return null;
        }
        return new BPColumn(columnIndex, dateRange, period, columnType, false);
    }
}
