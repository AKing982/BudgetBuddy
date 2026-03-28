package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.BPCell;
import com.app.budgetbuddy.domain.BPCellColor;
import com.app.budgetbuddy.domain.BPColumn;
import com.app.budgetbuddy.domain.BPRow;
import com.app.budgetbuddy.services.BPCellService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class BPCellBuilderServiceImpl implements BPCellBuilderService
{
    private final BPCellService bpCellService;

    @Autowired
    public BPCellBuilderServiceImpl(BPCellService bpCellService)
    {
        this.bpCellService = bpCellService;
    }

    @Override
    public List<BPCell> buildCells(BPRow row, List<BPColumn> columns)
    {
        return List.of();
    }

    @Override
    public BPCell updateCellAmount(BPCell cell, double amount)
    {
        return null;
    }

    @Override
    public BPCell buildCell(BPColumn column, double amount, BPCellColor color, boolean isOverspent, boolean isEstimated, boolean isEditable, boolean isPercentage)
    {
        return null;
    }

    public List<BPCell> populateCellAmounts(List<BPCell> bpCells, List<BPColumn> columns, Map<Integer, Double> columnAmounts)
    {
        return null;
    }
}
