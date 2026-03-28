package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPCell;
import com.app.budgetbuddy.domain.BPCellColor;
import com.app.budgetbuddy.domain.BPColumn;
import com.app.budgetbuddy.domain.BPRow;

import java.util.List;

public interface BPCellBuilderService
{
    List<BPCell> buildCells(BPRow row, List<BPColumn> columns);
    BPCell updateCellAmount(BPCell cell, double amount);
    BPCell buildCell(BPColumn column, double amount, BPCellColor color, boolean isOverspent, boolean isEstimated, boolean isEditable, boolean isPercentage);
}
