package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;

import java.util.List;

public interface BPColumnBuilderService
{
    List<BPColumn> buildColumns(BPTemplateType templateType, Period period, List<DateRange> budgetSchedules);
    BPColumn buildHeaderColumn(int columnIndex, DateRange dateRange, Period period);
    BPColumn buildSubColumn(int columnIndex, DateRange dateRange, Period period, BPColumnType columnType);
}
