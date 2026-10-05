package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.BPTemplatePointerService;
import com.app.budgetbuddy.workbench.runner.BPTemplatePointerRunner;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/bp-template-pointers")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class BPTemplatePointerController
{
    private final BPTemplatePointerRunner bpTemplatePointerRunner;
    private final BPTemplatePointerService bpTemplatePointerService;

    @Autowired
    public BPTemplatePointerController(BPTemplatePointerRunner templatePointerRunner,
                                       BPTemplatePointerService bpTemplatePointerService)
    {
        this.bpTemplatePointerRunner = templatePointerRunner;
        this.bpTemplatePointerService = bpTemplatePointerService;
    }

    @GetMapping("/{templateDetailId}/all")
    public ResponseEntity<List<BPTemplatePointer>> getAllPointersForTemplateDetail(@PathVariable @NotNull Long templateDetailId)
    {
        try
        {
            List<BPTemplatePointer> pointers = bpTemplatePointerService.findByTemplateDetailId(templateDetailId);
            if(pointers == null || pointers.isEmpty())
            {
                throw new DataException("No pointers found for templateDetailId=" + templateDetailId);
            }
            return ResponseEntity.ok(pointers);
        }catch(DataException ex){
            log.error("Error while getting all pointers for template detail {}", templateDetailId, ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("{templateDetailId}/new-current")
    public ResponseEntity<BPTemplatePointer> createNewCurrentPointer(@PathVariable @NotNull Long templateDetailId,
                                                                     @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate currentDate)
    {
        try
        {
            Optional<BPTemplatePointer> currentPointerOpt = bpTemplatePointerRunner.createCurrentPointer(templateDetailId, currentDate);
            if(currentPointerOpt.isEmpty())
            {
                throw new DataException("Error creating current pointer for templateDetailId=" + templateDetailId);
            }
            BPTemplatePointer pointer = currentPointerOpt.get();
            return ResponseEntity.ok(pointer);
        }catch(DataException ex){
            log.error("Error while creating new current pointer for template detail {}", templateDetailId, ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/new-future-pointer")
    public ResponseEntity<BPTemplatePointer> createNewFuturePointer(@RequestBody @NotNull MoveFuturePointerRequest futurePointerRequest)
    {
        LocalDate currentDate = futurePointerRequest.currentPointerDate();
        LocalDate newPointerDate = futurePointerRequest.newPointerDate();
        if(currentDate == null || newPointerDate == null)
        {
            return ResponseEntity.badRequest().build();
        }
        try
        {
            Long templateDetailId = futurePointerRequest.templateDetailId();
            DateRange dateRange = new DateRange(newPointerDate, getLastPointerDate(newPointerDate));
            Optional<BPTemplatePointer> futurePointerOpt = bpTemplatePointerRunner.createFuturePointer(templateDetailId, currentDate, dateRange);
            if(futurePointerOpt.isEmpty())
            {
                throw new DataException("Error creating future pointer for templateDetailId=" + templateDetailId);
            }
            BPTemplatePointer pointer = futurePointerOpt.get();
            return ResponseEntity.ok(pointer);
        }catch(DataException ex){
            log.error("Error while creating new future pointer for template detail {}", futurePointerRequest.templateDetailId(), ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("{templateDetailId}/resync")
    public ResponseEntity<PointerResync> resyncPointers(@PathVariable @NotNull Long templateDetailId,
                                                        @RequestParam @NotNull LocalDate currentDate)
    {
        try
        {
            List<BPTemplatePointer> pointers = bpTemplatePointerService.findByTemplateDetailId(templateDetailId);
            BPTemplatePointer currentPointer = findPointer(false, pointers);
            BPTemplatePointer futurePointer = findPointer(true, pointers);
            Optional<PointerResync> resynced = bpTemplatePointerRunner.syncPointers(currentPointer, futurePointer, currentDate);
            if(resynced.isEmpty())
            {
                throw new DataException("Error resyncing pointers for templateDetailId=" + templateDetailId);
            }
            PointerResync pointerResync = resynced.get();
            return ResponseEntity.ok(pointerResync);
        }catch(DataException ex){
            log.error("Error while resyncing pointers for template detail {}", templateDetailId, ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    private LocalDate getLastPointerDate(LocalDate newFuturePointerDate)
    {
        return newFuturePointerDate.plusWeeks(1).minusDays(1);
    }

    private BPTemplatePointer findPointer(boolean isFuture, List<BPTemplatePointer> pointers)
    {
        return pointers.stream()
                .filter(e -> e.getPointerMode().equals(isFuture ? PointerMode.FUTURE : PointerMode.CURRENT))
                .findFirst()
                .orElseThrow(() -> new DataException("No pointer found"));
    }
}
