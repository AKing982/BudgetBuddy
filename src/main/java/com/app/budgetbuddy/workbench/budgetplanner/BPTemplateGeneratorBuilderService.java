package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BPTemplateBuilderException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.IncomeRangeBuilderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
public class BPTemplateGeneratorBuilderService
{
    private final BPTemplateBuilderService templateBuilderService;
    private final BPColumnBuilderService bpColumnBuilderService;
    private final IncomeRangeBuilderService incomeRangeBuilderService;
    private final BPTemplatePointerBuilderService bpTemplatePointerBuilderService;

    @Autowired
    public BPTemplateGeneratorBuilderService(BPTemplateBuilderService templateBuilderService,
                                             BPColumnBuilderService bpColumnBuilderService,
                                             IncomeRangeBuilderService incomeRangeBuilderService,
                                             BPTemplatePointerBuilderService bpTemplatePointerBuilderService)
    {
        this.templateBuilderService = templateBuilderService;
        this.bpColumnBuilderService = bpColumnBuilderService;
        this.incomeRangeBuilderService = incomeRangeBuilderService;
        this.bpTemplatePointerBuilderService = bpTemplatePointerBuilderService;
    }

    public BPTemplate buildInitialTemplate(BPTemplateType templateType, Period period, List<SubBudget> subBudgets, Integer startDay)
    {
        BPTemplate initialTemplate = templateBuilderService.buildInitialTemplate(
                templateType, period, false, List.of(), null, subBudgets, startDay);
        if(initialTemplate == null || initialTemplate.getBpTemplateDetail() == null)
        {
            throw new BPTemplateBuilderException("Error building initial template");
        }
        return initialTemplate;
    }

    public BPTemplatePointer buildInitialPointer(List<BPColumn> columns, Long templateDetailId, LocalDate currentDate)
    {
        return bpTemplatePointerBuilderService.createTemplatePointer(columns, templateDetailId, false, currentDate)
                .orElseThrow(() -> new BPTemplateBuilderException("Error creating template pointer"));
    }

    public BPTemplate buildFinalTemplate(BPTemplate template, Long savedTemplateId)
    {
        BPTemplate finalTemplate = templateBuilderService.buildTemplate(template, template.getBpGoalsDetail(), template.getBpTemplateDetail());
        finalTemplate.setId(savedTemplateId);
        return finalTemplate;
    }

    public List<BPColumn> buildFutureColumns(final BPTemplateType templateType, final List<BPColumn> existingColumns, final LocalDate nextFuturePointerDate)
    {
        LocalDate lastEnd = getLastDate(existingColumns);
        if(!nextFuturePointerDate.isAfter(lastEnd) || existingColumns.isEmpty())
        {
            return List.of();
        }
        else
        {
            int nextColumnIndex = getNextColumnIndex(existingColumns);
            List<DateRange> dateRanges = new ArrayList<>();
            Period period;
            switch(templateType)
            {
                case INCOME_STD:
                    List<DateRange> existingRanges = existingColumns.stream()
                            .map(BPColumn::getDateRange)
                            .toList();
                    dateRanges = incomeRangeBuilderService.generateIncomeRangesUpToFuturePointerDate(existingRanges, nextFuturePointerDate)
                            .stream()
                            .filter(r -> r.getStartDate().isAfter(lastEnd))
                            .toList();
                    period = Period.BIWEEKLY;
                    break;
                case MONTHLY_STD:
                    DateRange monthRange = new DateRange(lastEnd, nextFuturePointerDate);
                    List<DateRange> monthlyRanges = monthRange.splitIntoMonths();
                    dateRanges.addAll(monthlyRanges);
                    period = Period.MONTHLY;
                    break;
                default:
                    throw new BPTemplateBuilderException("Invalid template type");
            }
            return bpColumnBuilderService.buildColumns(period, dateRanges, nextColumnIndex);
        }
    }

    public BPTemplatePointer buildMovedPointer(BPTemplatePointer currentPointer, List<BPColumn> allColumns, Long templateDetailId, LocalDate nextFuturePointerDate)
    {
        BPTemplatePointer movedPointer = bpTemplatePointerBuilderService.createTemplatePointer(allColumns, templateDetailId, false, nextFuturePointerDate)
                .orElseThrow(() -> new BPTemplateBuilderException("Error building moved future pointer"));
        movedPointer.setId(currentPointer.getId());
        return movedPointer;
    }

    private LocalDate getLastDate(List<BPColumn> columns)
    {
        return columns.stream()
                .map(BPColumn::getDateRange)
                .map(DateRange::getEndDate)
                .max(Comparator.naturalOrder())
                .orElse(LocalDate.now());
    }

    private int getNextColumnIndex(List<BPColumn> columns)
    {
        return columns.stream()
                .map(BPColumn::getColumnIndex)
                .mapToInt(Integer::intValue)
                .max()
                .orElse(-1) + 1;
    }
}
