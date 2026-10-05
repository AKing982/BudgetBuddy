package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.RunnerException;
import com.app.budgetbuddy.services.BPColumnService;
import com.app.budgetbuddy.workbench.budgetplanner.BPTemplatePointerBuilderService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class BPTemplatePointerRunner
{
    private BPTemplatePointerBuilderService bpTemplatePointerBuilderService;
    private BPColumnService bpColumnService;

    @Autowired
    public BPTemplatePointerRunner(BPTemplatePointerBuilderService bpTemplatePointerBuilderService,
                                   BPColumnService bpColumnService)
    {
        this.bpTemplatePointerBuilderService = bpTemplatePointerBuilderService;
        this.bpColumnService = bpColumnService;
    }

    public Optional<BPTemplatePointer> createCurrentPointer(final Long templateDetailId, final LocalDate currentDate)
    {
        try
        {
            if(templateDetailId == null)
            {
                throw new RunnerException("Template date ranges or templateDetailId cannot be empty or null");
            }
            List<BPColumn> columns = bpColumnService.getColumnsByTemplateDetailId(templateDetailId);
            if(columns == null || columns.isEmpty())
            {
                throw new RunnerException("No columns found for templateDetailId=" + templateDetailId);
            }
            return bpTemplatePointerBuilderService.createTemplatePointer(columns, templateDetailId, false, currentDate);
        }catch(RunnerException ex){
            log.error("There was an error creating the current pointer: ", ex);
            return Optional.empty();
        }
    }

    public Optional<BPTemplatePointer> createFuturePointer(final Long templateDetailId, final LocalDate currentDate, final DateRange futureRange)
    {
        try
        {
            if(templateDetailId == null || futureRange == null)
            {
                throw new RunnerException("templateDetailId or future DateRange cannot be empty or null");
            }
            if(futureRange.containsDate(currentDate))
            {
                throw new RunnerException("Future DateRange cannot contain the current date");
            }
            List<BPColumn> columns = bpColumnService.getColumnsByTemplateDetailId(templateDetailId);
            if(columns == null || columns.isEmpty())
            {
                throw new RunnerException("No columns found for templateDetailId=" + templateDetailId);
            }
            return bpTemplatePointerBuilderService.createTemplatePointer(columns, templateDetailId, true, currentDate);
        }catch(RunnerException ex){
            log.error("There was an error creating the future pointer: ", ex);
            return Optional.empty();
        }
    }

    public Optional<BPTemplatePointer> syncNewFuturePointer(final DateRange newDateRange, final BPTemplatePointer futurePointer)
    {
        try
        {
            if(newDateRange == null || futurePointer == null)
            {
                throw new RunnerException("New DateRange or Future Pointer cannot be empty or null");
            }
            DateRange futurePointerDateRange = futurePointer.getCurrentDateRange();
            if(newDateRange.equals(futurePointerDateRange))
            {
                return Optional.of(futurePointer);
            }
            Long templateDetailId = futurePointer.getTemplateDetailId();
            List<BPColumn> columns = bpColumnService.getColumnsByTemplateDetailId(templateDetailId);
            if(columns == null || columns.isEmpty())
            {
                throw new RunnerException("No columns found for templateDetailId=" + templateDetailId);
            }
            return bpTemplatePointerBuilderService.createShiftedPointer(futurePointer, columns, newDateRange);
        }catch(RunnerException ex){
            log.error("There was an error syncing the new future pointer: ", ex);
            return Optional.empty();
        }
    }

    public Optional<PointerResync> syncPointers(final BPTemplatePointer currentPointer, final BPTemplatePointer futurePointer, final LocalDate currentDate)
    {
        try
        {
            if(currentPointer == null || futurePointer == null)
            {
                throw new RunnerException("CurrentPointer or FuturePointer cannot be empty or null");
            }
            Long templateDetailId = currentPointer.getTemplateDetailId();
            List<BPColumn> columns = bpColumnService.getColumnsByTemplateDetailId(templateDetailId);

            // sync the current pointer before calling resyncPointers


            return bpTemplatePointerBuilderService.resyncPointers(currentPointer, currentDate, futurePointer, columns);
        }catch(RunnerException ex){
            log.error("There was an error syncing the pointers: ", ex);
            return Optional.empty();
        }
    }
}
