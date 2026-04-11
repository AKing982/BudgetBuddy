package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BPColumnService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.function.Function;

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
        if(templateType == null || subBudgets == null || subBudgets.isEmpty())
        {
            throw new DataException("Template type and sub budgets cannot be null or empty");
        }
        return switch(templateType) {
            case MONTHLY_STD  -> buildCombinedLayout(Period.MONTHLY,   subBudgets, DateRange::asSingleRange);
            case BIWEEKLY_STD -> buildCombinedLayout(Period.BIWEEKLY,  subBudgets, DateRange::splitIntoBiWeeks);
            case WEEKLY_STD   -> buildCombinedLayout(Period.WEEKLY,    subBudgets, DateRange::splitIntoWeeks);
            case MONTHLY_PAYCHECK -> buildCombinedLayout(Period.INCOME, subBudgets, DateRange::asSingleRange);
            default -> throw new DataException("Invalid template type: " + templateType);
        };
    }

    private BPLayout buildCombinedLayout(Period period,
                                         List<SubBudget> subBudgets,
                                         Function<DateRange, List<DateRange>> splitter)
    {
        List<BPColumn> allColumns = new ArrayList<>();
        List<BPCategory> allCategories = new ArrayList<>();
        for(SubBudget subBudget : subBudgets)
        {
            DateRange range = new DateRange(subBudget.getStartDate(), subBudget.getEndDate());
            List<DateRange> ranges = splitter.apply(range);
            List<BPColumn> columns = columnBuilder.buildColumns(period, ranges);
            List<BPCategory> categories = bpRowDataBuilderService.buildRowData(subBudget, columns);

            allColumns.addAll(columns);
            allCategories.addAll(categories);
        }

        saveColumns(allColumns);
        saveCategoryRows(allCategories);
        return new BPLayout(allColumns, allCategories);
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
