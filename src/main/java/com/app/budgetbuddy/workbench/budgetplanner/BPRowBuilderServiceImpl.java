package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.services.BPRowService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
public class BPRowBuilderServiceImpl implements BPRowBuilderService
{
    private final BPRowService rowService;
    private final BPCellBuilderService cellBuilderService;

    @Autowired
    public BPRowBuilderServiceImpl(BPRowService bpRowService,
                                   BPCellBuilderService cellBuilderService)
    {
        this.rowService = bpRowService;
        this.cellBuilderService = cellBuilderService;
    }

    @Override
    public List<BPRow> buildCategoryRows(List<BPBudgetCategory> budgetCategories, List<BudgetCategoryGroup> budgetCategoryGroups, List<BPColumn> columns)
    {
        if(columns.isEmpty())
        {
            return Collections.emptyList();
        }
        List<BPRow> rows = new ArrayList<>();
        if(budgetCategories.isEmpty() && !budgetCategoryGroups.isEmpty())
        {
            BPRow row;
            for(BudgetCategoryGroup budgetCategoryGroup : budgetCategoryGroups)
            {
                String groupName = budgetCategoryGroup.getGroupName();
                List<BPBudgetCategory> groupedBudgetCategories = budgetCategoryGroup.getBudgetCategories();
                if(groupedBudgetCategories.isEmpty())
                {
                    // Initialize the row with empty bp cells
                    row = new BPRow(groupName, CategoryType.NONE, List.of());

                    // Build the Cells for the row
                    List<BPCell> groupCells = cellBuilderService.buildCells(row, columns);

                    // Add the cells to the row
                    row.setCells(groupCells);
                    rows.add(row);
                }
                else
                {
                    List<BPRow> childRows = new ArrayList<>();
                    for(BPBudgetCategory bpBudgetCategory : groupedBudgetCategories)
                    {
                        String category = bpBudgetCategory.getCategory();
                        CategoryType categoryType = CategoryType.getCategoryType(category);
                        BPRow childRow = new BPRow(category, categoryType, List.of());
                        List<BPCell> childCells = cellBuilderService.buildCells(childRow, columns);
                        childRow.setCells(childCells);
                        childRows.add(childRow);
                    }
                    BPRow groupRow = new BPRow(groupName, CategoryType.NONE, List.of());
                    List<BPCell> groupCells = cellBuilderService.buildCells(groupRow, columns);
                    groupRow.setCells(groupCells);
                    rows.add(groupRow);
                    rows.addAll(childRows);
                }
            }
        }
        return rows;
    }

    @Override
    public List<BPRow> buildBalanceRows(List<BPAccountBalance> bpAccountBalances, List<BPColumn> columns)
    {
        if(bpAccountBalances.isEmpty() || columns.isEmpty())
        {
            return Collections.emptyList();
        }
        return null;
    }

    @Override
    public List<BPRow> buildIncomeRows(List<BPIncome> incomes, List<BPColumn> columns)
    {
        return List.of();
    }

    @Override
    public List<BPRow> buildSavingsRows(List<BPSavings> savings, List<BPColumn> columns)
    {
        return List.of();
    }
}
