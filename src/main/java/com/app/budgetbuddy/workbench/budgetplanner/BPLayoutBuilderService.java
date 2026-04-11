package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BPColumnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BPLayoutBuilderService
{
    private final BPColumnBuilderService columnBuilder;
    private final BPCategoryRowBuilderService bpRowDataBuilderService;
    private final BPCategoryService bpCategoryService;
    private final BPColumnService bpColumnService;

    @Autowired
    public BPLayoutBuilderService(BPColumnBuilderService columnBuilder,
                                  BPCategoryRowBuilderService bpRowDataBuilderService,
                                  BPCategoryService bpCategoryService,
                                  BPColumnService bpColumnService)
    {
        this.columnBuilder = columnBuilder;
        this.bpRowDataBuilderService = bpRowDataBuilderService;
        this.bpCategoryService = bpCategoryService;
        this.bpColumnService = bpColumnService;
    }

    public BPLayout buildLayout(BPTemplateType templateType, List<SubBudget> subBudgets)
    {
        if(templateType == null || subBudgets == null)
        {
            throw new DataException("Template Type or Budget Schedule cannot be null");
        }
        switch(templateType){
            case MONTHLY_STD -> {
                Period period = Period.MONTHLY;
                DateRange monthRange = new DateRange(subBudget.getStartDate(), subBudget.getEndDate());
                List<DateRange> weeklyRanges = monthRange.splitIntoWeeks();
                List<BPColumn> columns = columnBuilder.buildColumns(period, weeklyRanges);
                saveColumns(columns);
                // Save the columns to the database
                List<BPCategory> rowData = bpRowDataBuilderService.buildRowData(subBudget, columns);
                saveCategoryRows(rowData);
                return new BPLayout(columns, rowData);
            }
            case BIWEEKLY_STD -> {
                Period period = Period.BIWEEKLY;
                DateRange monthRange = new DateRange(subBudget.getStartDate(), subBudget.getEndDate());

                List<DateRange> biWeekRanges = monthRange.splitIntoBiWeeks();
                List<BPColumn> columns = columnBuilder.buildColumns(period, biWeekRanges);
                saveColumns(columns);
                List<BPCategory> rowData = bpRowDataBuilderService.buildRowData(subBudget, columns);
                saveCategoryRows(rowData);
                return new BPLayout(columns, rowData);
            }
            case WEEKLY_STD -> {
                Period period = Period.WEEKLY;
                DateRange monthRange = new DateRange(subBudget.getStartDate(), subBudget.getEndDate());
                List<DateRange> weeklyRanges = monthRange.splitIntoWeeks();
                List<BPColumn> columns = columnBuilder.buildColumns(period, weeklyRanges);
                saveColumns(columns);
                List<BPCategory> rowData = bpRowDataBuilderService.buildRowData(subBudget, columns);
                saveCategoryRows(rowData);
                return new BPLayout(columns, rowData);
            }
            case MONTHLY_PAYCHECK -> {
                Period period = Period.INCOME;
                DateRange monthRange = new DateRange(subBudget.getStartDate(), subBudget.getEndDate());
            }
            default -> throw new DataException("Invalid template type");
        }
        return null;
    }

    private void saveColumns(List<BPColumn> columns)
    {
        bpColumnService.saveColumns(columns);
    }

    private void saveCategoryRows(List<BPCategory> categoryRows)
    {
        bpCategoryService.saveCategories(categoryRows);
    }
}
