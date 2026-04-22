package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPCategoryService;
import com.app.budgetbuddy.services.BPColumnService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.function.Function;

@Slf4j
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

    public BPLayout buildLayout(BPTemplateType templateType, BPIncomeCriteria incomeCriteria, boolean requireCategoryHeaders, List<String> categoryHeaders, List<SubBudget> subBudgets, Integer startDay)
    {
        if(templateType == null || subBudgets == null || subBudgets.isEmpty())
        {
            throw new DataException("Template type and sub budgets cannot be null or empty");
        }
        return switch(templateType) {
            case MONTHLY_STD  -> buildCombinedLayout(Period.MONTHLY,   subBudgets, incomeCriteria, requireCategoryHeaders, categoryHeaders, false, startDay, DateRange::asSingleRange);
            case BIWEEKLY_STD -> buildCombinedLayout(Period.BIWEEKLY,  subBudgets, incomeCriteria, requireCategoryHeaders, categoryHeaders, false, startDay, DateRange::splitIntoBiWeeks);
            case WEEKLY_STD   -> buildCombinedLayout(Period.WEEKLY,    subBudgets, incomeCriteria, requireCategoryHeaders, categoryHeaders, false, startDay, DateRange::splitIntoWeeks);
            case INCOME_STD -> buildCombinedLayout(Period.INCOME, subBudgets, incomeCriteria, requireCategoryHeaders, categoryHeaders, true, startDay, DateRange::asSingleRange);
            default -> throw new DataException("Invalid template type: " + templateType);
        };
    }

    private List<DateRange> buildIncomeRanges(final List<SubBudget> subBudgets, final Integer startDay)
    {
        List<LocalDate> allPostedDates = new ArrayList<>();
        for(int i = 0; i < subBudgets.size(); i++)
        {
            SubBudget subBudget = subBudgets.get(i);
            Long userId = subBudget.getBudget().getUserId();
            Long subBudgetId = subBudget.getId();
            log.info("Building income ranges for sub budget: {}", subBudgetId);
            LocalDate startDate = (i == 0 && startDay != null) ? subBudget.getStartDate().withDayOfMonth(startDay) : subBudget.getStartDate();
            LocalDate end = subBudget.getEndDate();
            List<LocalDate> incomePostedDates = transactionCategoryService.getIncomePostedDatesByDateShift(userId, subBudgetId, startDate, end);
            log.info("Income posted dates: {}", incomePostedDates);
            allPostedDates.addAll(incomePostedDates);
        }
        allPostedDates.sort(LocalDate::compareTo);
        if(startDay != null && !allPostedDates.isEmpty())
        {
            allPostedDates.set(0, allPostedDates.get(0).withDayOfMonth(startDay));
        }
        Set<DateRange> uniquePostedRanges = new LinkedHashSet<>();
        for(int i = 0; i < allPostedDates.size() - 1; i++)
        {
            LocalDate current = allPostedDates.get(i);
            LocalDate dayPriorNext = allPostedDates.get(i + 1).minusDays(1);
            uniquePostedRanges.add(new DateRange(current, dayPriorNext));
        }
        log.info("Income ranges: {}", uniquePostedRanges);
        return new ArrayList<>(uniquePostedRanges);
    }

    private BPLayout buildCombinedLayout(Period period,
                                         List<SubBudget> subBudgets,
                                         BPIncomeCriteria income,
                                         boolean requireCategoryHeaders,
                                         List<String> categoryHeaders,
                                         boolean isIncomeTemplate,
                                         Integer startDay,
                                         Function<DateRange, List<DateRange>> splitter)
    {
        List<BPColumn> allColumns = new ArrayList<>();
        List<BPCategory> allCategories = new ArrayList<>();
        int columnIndexOffset = 0;
        if(isIncomeTemplate)
        {
            List<DateRange> incomeRanges = buildIncomeRanges(subBudgets, startDay);
            List<BPColumn> incomeColumns = columnBuilder.buildColumns(period, incomeRanges, columnIndexOffset);
            allColumns.addAll(incomeColumns);
            for(SubBudget subBudget : subBudgets)
            {
                List<BPCategory> categories = bpRowDataBuilderService.buildRowData(true, subBudget, requireCategoryHeaders, categoryHeaders, income, incomeColumns);
                allCategories.addAll(categories);
            }
            log.info("BP Categories: {} for income template", allCategories);
        }
        else
        {
            for(SubBudget subBudget : subBudgets)
            {
                DateRange range = new DateRange(subBudget.getStartDate(), subBudget.getEndDate());
                List<DateRange> ranges = splitter.apply(range);
                List<BPColumn> columns = columnBuilder.buildColumns(period, ranges, columnIndexOffset);
                List<BPCategory> categories = bpRowDataBuilderService.buildRowData(false, subBudget, requireCategoryHeaders, categoryHeaders, income, columns);
                allColumns.addAll(columns);
                allCategories.addAll(categories);
                columnIndexOffset += columns.size();
            }
        }
        return new BPLayout(allColumns, allCategories);
    }

}
