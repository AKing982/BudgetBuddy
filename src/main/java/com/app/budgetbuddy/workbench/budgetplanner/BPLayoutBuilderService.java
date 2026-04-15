package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BPColumnService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

@Service
public class BPLayoutBuilderService
{
    private final BPColumnBuilderService columnBuilder;
    private final BPCategoryRowBuilderService bpRowDataBuilderService;
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public BPLayoutBuilderService(BPColumnBuilderService columnBuilder,
                                  BPCategoryRowBuilderService bpRowDataBuilderService,
                                  TransactionCategoryService transactionCategoryService)
    {
        this.columnBuilder = columnBuilder;
        this.bpRowDataBuilderService = bpRowDataBuilderService;
        this.transactionCategoryService = transactionCategoryService;
    }

    public BPLayout buildLayout(BPTemplateType templateType, BPIncomeCriteria incomeCriteria, boolean requireCategoryHeaders, List<String> categoryHeaders, List<SubBudget> subBudgets)
    {
        if(templateType == null || subBudgets == null || subBudgets.isEmpty())
        {
            throw new DataException("Template type and sub budgets cannot be null or empty");
        }
        return switch(templateType) {
            case MONTHLY_STD  -> buildCombinedLayout(Period.MONTHLY,   subBudgets, incomeCriteria, requireCategoryHeaders, categoryHeaders, false, DateRange::asSingleRange);
            case BIWEEKLY_STD -> buildCombinedLayout(Period.BIWEEKLY,  subBudgets, incomeCriteria, requireCategoryHeaders, categoryHeaders, false, DateRange::splitIntoBiWeeks);
            case WEEKLY_STD   -> buildCombinedLayout(Period.WEEKLY,    subBudgets, incomeCriteria, requireCategoryHeaders, categoryHeaders, false, DateRange::splitIntoWeeks);
            case INCOME_STD -> buildCombinedLayout(Period.INCOME, subBudgets, incomeCriteria, requireCategoryHeaders, categoryHeaders, true, DateRange::asSingleRange);
            default -> throw new DataException("Invalid template type: " + templateType);
        };
    }

    private List<DateRange> buildIncomeRanges(final List<SubBudget> subBudgets)
    {
        Set<DateRange> uniquePostedRanges = new LinkedHashSet<>();
        for(SubBudget subBudget : subBudgets)
        {
            Long userId = subBudget.getBudget().getUserId();
            Long subBudgetId = subBudget.getId();
            List<LocalDate> incomePostedDates = transactionCategoryService.getIncomePostedDates(userId, subBudgetId);
            for(int i = 0; i < incomePostedDates.size() - 1; i++)
            {
                LocalDate currentIncomePosted = incomePostedDates.get(i);
                LocalDate incomePostedDate = incomePostedDates.get(i + 1);
                LocalDate dayPriorNextPostedDate = incomePostedDate.minusDays(1);
                DateRange range = new DateRange(currentIncomePosted, dayPriorNextPostedDate);
                uniquePostedRanges.add(range);
            }
        }
        return new ArrayList<>(uniquePostedRanges);
    }

    private BPLayout buildCombinedLayout(Period period,
                                         List<SubBudget> subBudgets,
                                         BPIncomeCriteria income,
                                         boolean requireCategoryHeaders,
                                         List<String> categoryHeaders,
                                         boolean isIncomeTemplate,
                                         Function<DateRange, List<DateRange>> splitter)
    {
        List<BPColumn> allColumns = new ArrayList<>();
        List<BPCategory> allCategories = new ArrayList<>();
        int columnIndexOffset = 0;
        for(SubBudget subBudget : subBudgets)
        {
            DateRange range = new DateRange(subBudget.getStartDate(), subBudget.getEndDate());
            List<DateRange> ranges = splitter.apply(range);
            if(isIncomeTemplate)
            {
                List<DateRange> incomeRanges = buildIncomeRanges(subBudgets);
                List<BPColumn> incomeColumns = columnBuilder.buildColumns(period, incomeRanges, columnIndexOffset);
                List<BPCategory> categories = bpRowDataBuilderService.buildRowData(subBudget, requireCategoryHeaders, categoryHeaders, income, incomeColumns);
                allColumns.addAll(incomeColumns);
                allCategories.addAll(categories);
            }
            List<BPColumn> columns = columnBuilder.buildColumns(period, ranges, columnIndexOffset);
            List<BPCategory> categories = bpRowDataBuilderService.buildRowData(subBudget, requireCategoryHeaders, categoryHeaders, income, columns);

            allColumns.addAll(columns);
            allCategories.addAll(categories);
        }
        return new BPLayout(allColumns, allCategories);
    }

}
