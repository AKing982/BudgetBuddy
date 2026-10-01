package com.app.budgetbuddy.workbench.budgetplanner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.BPColumnException;
import com.app.budgetbuddy.exceptions.BPTemplatePointerException;
import com.app.budgetbuddy.services.BPTemplatePointerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BPTemplatePointerBuilderService
{
    private BPTemplatePointerService bpTemplatePointerService;

    @Autowired
    public BPTemplatePointerBuilderService(BPTemplatePointerService bpTemplatePointerService)
    {
        this.bpTemplatePointerService = bpTemplatePointerService;
    }

    public Optional<BPTemplatePointer> createTemplatePointer(final List<BPColumn> columns, final Long templateDetailId, final boolean isFuturePointer, final LocalDate currentDate)
    {
        try
        {
            if(columns == null || columns.isEmpty())
            {
                throw new BPColumnException("BPColumn list cannot be null or empty for templateDetailId=" + templateDetailId);
            }
            BPTemplatePointer templatePointer;
            if(isFuturePointer)
            {
                BPColumn lastColumn = columns.get(columns.size() - 1);
                templatePointer = BPTemplatePointer.builder()
                        .templateDetailId(templateDetailId)
                        .pointerMode(PointerMode.FUTURE)
                        .currentDateRange(lastColumn.getDateRange())
                        .isUpdateEnabled(true)
                        .isLocked(false)
                        .build();
                BPTemplatePointer savedPointer = bpTemplatePointerService.createAndSave(templatePointer)
                        .orElseThrow(() -> new BPTemplatePointerException("Failed to save template pointer"));
                return Optional.of(savedPointer);
            }
            else
            {
                for(BPColumn column : columns)
                {
                    DateRange dateRange = column.getDateRange();
                    if(dateRange == null)
                    {
                        log.warn("Skipping column index={} with null dateRange for templateDetailId={}", column.getColumnIndex(), templateDetailId);
                        continue;
                    }
                    if(dateRange.containsDate(currentDate))
                    {
                        LocalDate startDate = dateRange.getStartDate();
                        LocalDate endDate = dateRange.getEndDate();
                        Optional<BPTemplatePointer> bpTemplatePointerOptional = bpTemplatePointerService.findByDateRangeAndTemplateDetailID(templateDetailId, startDate, endDate);
                        if(bpTemplatePointerOptional.isPresent())
                        {
                            BPTemplatePointer existingPointer = bpTemplatePointerOptional.get();
                            return Optional.of(existingPointer);
                        }
                        templatePointer = BPTemplatePointer.builder()
                                .templateDetailId(templateDetailId)
                                .pointerMode(PointerMode.CURRENT)
                                .currentDateRange(dateRange)
                                .isUpdateEnabled(false)
                                .isLocked(true)
                                .build();
                        BPTemplatePointer savedPointer = bpTemplatePointerService.createAndSave(templatePointer)
                                .orElseThrow(() -> new BPTemplatePointerException("Failed to save template pointer"));
                        return Optional.of(savedPointer);
                    }
                }
            }
            return Optional.empty();
        }catch(BPColumnException e){
            log.error("Failed to create template pointer: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public Optional<BPTemplatePointer> createShiftedPointer(final BPTemplatePointer templatePointer, final List<BPColumn> columns, DateRange shiftedDateRange)
    {
        try
        {
            if(templatePointer == null)
            {
                throw new BPTemplatePointerException("BPTemplatePointer cannot be null");
            }
            PointerMode pointerMode = templatePointer.getPointerMode();
            DateRange currentPointerDateRange = templatePointer.getCurrentDateRange();
            if(pointerMode == PointerMode.CURRENT)
            {
                for(BPColumn column : columns)
                {
                    DateRange dateRange = column.getDateRange();
                    if(dateRange == null)
                    {
                        log.warn("Skipping column index={} with null dateRange for templateDetailId={}", column.getColumnIndex(), templatePointer.getTemplateDetailId());
                        continue;
                    }
                    if(dateRange.equals(currentPointerDateRange))
                    {
                        // Shift the current pointer date range to the next column
                        DateRange nextColumnDateRange = columns.get(column.getColumnIndex() + 1).getDateRange();
                        if(nextColumnDateRange == null)
                        {
                            log.error("Next column date range cannot be null for templateDetailId={}", templatePointer.getTemplateDetailId());
                            throw new BPTemplatePointerException("Next column date range cannot be null");
                        }
                        return Optional.of(BPTemplatePointer.builder()
                                .templateDetailId(templatePointer.getTemplateDetailId())
                                .pointerMode(PointerMode.CURRENT)
                                .currentDateRange(nextColumnDateRange)
                                .isUpdateEnabled(false)
                                .isLocked(true)
                                .build());
                    }
                }
            }
            else
            {
                // Check that the shifted date range is in the bp columns
                if(isFutureShiftedRangeInColumns(columns, shiftedDateRange))
                {
                    return Optional.of(BPTemplatePointer.builder()
                            .templateDetailId(templatePointer.getTemplateDetailId())
                            .pointerMode(PointerMode.FUTURE)
                            .currentDateRange(shiftedDateRange)
                            .isUpdateEnabled(false)
                            .status("Active")
                            .isLocked(true)
                            .build());
                }
            }
        }catch(BPTemplatePointerException ex){
            log.error("Failed to create shifted pointer: {}", ex.getMessage());
            return Optional.empty();
        }
        return Optional.empty();
    }

    public Optional<BPTemplatePointer> resyncCurrentPointerOnNewCurrentPeriod(final BPTemplatePointer currentPointer, final LocalDate currentDate, final List<BPColumn> columns)
    {
        return null;
    }

    public Optional<BPTemplatePointer> resyncCurrentAndFuturePointersOnOverlap(final BPTemplatePointer currentPointer, final LocalDate currentDate, final BPTemplatePointer futurePointer, final List<BPColumn> columns)
    {
        return null;
    }

    private boolean isFutureShiftedRangeInColumns(List<BPColumn> columns, DateRange shiftedDateRange)
    {
        return columns.stream()
                .anyMatch(e -> e.getDateRange().equals(shiftedDateRange));
    }

}
