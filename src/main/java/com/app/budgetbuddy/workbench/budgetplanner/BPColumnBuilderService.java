package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;

import java.util.List;

public interface BPColumnBuilderService
{
    List<BPColumn> buildColumns(Period period, List<DateRange> budgetSchedules, int indexOffset);
    BPColumn buildHeaderColumn(int columnIndex, Period period, DateRange dateRange);
    BPColumn buildSubColumn(int columnIndex, Period period, DateRange dateRange, BPColumnType columnType);
}
