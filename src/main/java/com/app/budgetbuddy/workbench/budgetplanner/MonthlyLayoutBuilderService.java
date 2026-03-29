package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPBudgetCategoryService;
import com.app.budgetbuddy.services.BPCategoryGroupService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Qualifier("monthlyLayoutBuilder")
public class MonthlyLayoutBuilderService implements BPLayoutBuilderService
{
    private final BPColumnBuilderService columnBuilder;
    private final BPCategoryGroupService categoryGroupService;
    private final BPBudgetCategoryService budgetCategoryService;
    private final BPRowBuilderService rowBuilder;

    @Autowired
    public MonthlyLayoutBuilderService(BPColumnBuilderService columnBuilder,
                                       BPRowBuilderService bpRowBuilderService,
                                       BPBudgetCategoryService budgetCategoryService,
                                       BPCategoryGroupService categoryGroupService)
    {
        this.columnBuilder = columnBuilder;
        this.rowBuilder = bpRowBuilderService;
        this.categoryGroupService = categoryGroupService;
        this.budgetCategoryService = budgetCategoryService;
    }


    @Override
    public BPLayout buildLayout(BPTemplateType templateType, BudgetSchedule budgetSchedule)
    {
        if(templateType == null || budgetSchedule == null)
        {
            throw new DataException("Template Type or Budget Schedule cannot be null");
        }
        List<DateRange> weekRanges = budgetSchedule.getBudgetScheduleRanges()
                .stream().map(r -> new DateRange(r.getStartRange(), r.getEndRange()))
                .toList();
        List<BPColumn> columns = columnBuilder.buildColumns(templateType, budgetSchedule.getPeriodType(), weekRanges);
//        if(templateType.equals(BPTemplateType.MONTHLY_STD))
//        {
//            List<BudgetCategoryGroup> budgetCategoryGroups = categoryGroupService.findAll();
//            List<BPRow> rows = rowBuilder.buildCategoryRows(budgetCategoryGroups, columns);
//            return new BPLayout(columns, rows, budgetCategoryGroups.get(0));
//        }
//        List<BPBudgetCategory> budgetCategories = budgetCategoryService.findAll();
//        List<BPRow> rows = rowBuilder.buildCategoryRows(budgetCategories, List.of(), columns);
//        return new BPLayout(columns, rows);
        return null;
    }
}
