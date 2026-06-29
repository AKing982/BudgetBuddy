package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.EnvelopeEntity;
import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.EnvelopeService;
import com.app.budgetbuddy.services.LinkedEnvelopesService;
import com.app.budgetbuddy.services.SubBudgetService;
import com.app.budgetbuddy.workbench.runner.BudgetEnvelopeRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/budget-envelope")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class BudgetEnvelopeController
{
    private final BudgetEnvelopeRunner budgetEnvelopeRunner;
    private final EnvelopeService envelopeService;
    private final SubBudgetService subBudgetService;
    private final LinkedEnvelopesService linkedEnvelopesService;

    @Autowired
    public BudgetEnvelopeController(BudgetEnvelopeRunner budgetEnvelopeRunner,
                                    EnvelopeService envelopeService,
                                    SubBudgetService subBudgetService,
                                    LinkedEnvelopesService linkedEnvelopesService)
    {
        this.budgetEnvelopeRunner = budgetEnvelopeRunner;
        this.subBudgetService = subBudgetService;
        this.envelopeService = envelopeService;
        this.linkedEnvelopesService = linkedEnvelopesService;
    }

    @PutMapping("/update-linkedEnvelope")
    public ResponseEntity<Optional<LinkedEnvelopesEntity>> updateLinkedEnvelopeByEnvelopes(@RequestParam Long linkedEnvelopeId,
                                                                                           @RequestBody EnvelopeUpdateRequest envelopeUpdateRequest)
    {
        try
        {

        }catch(DataException ex){
            log.error("There was an error updating the linked envelope: ", ex);
            return ResponseEntity.internalServerError().build();
        }
        return null;
    }


    @PostMapping("/create")
    public ResponseEntity<EnvelopeBuildDetails> createEnvelope(@RequestBody EnvelopeCreateRequest envelopeCreateRequest,
                                                               @RequestParam Long userId,
                                                               @RequestParam LocalDate startDate,
                                                               @RequestParam LocalDate endDate)
    {
        try
        {

            List<NewEnvelopeCriteria> envelopeCriteria = envelopeCreateRequest.criteria();
            log.info("Creating envelope for user {} between {} and {} with criteria: {}", userId, startDate, endDate, envelopeCriteria);
            List<DateRange> envelopeDateRanges = getEnvelopeDateRanges(envelopeCreateRequest);
            log.info("Envelope Date Ranges: {}", envelopeDateRanges);
            BudgetCriteria budgetCriteria = subBudgetService.getBudgetCriteriaByUserIdAndDateRange(userId,startDate, endDate)
                    .orElseThrow(() -> new DataException("No budget criteria found for user " + userId + " between " + startDate + " and " + endDate));
            List<SubBudget> envelopeSubBudgets = getEnvelopeSubBudgets(envelopeDateRanges, userId);
            log.info("Envelope Sub Budgets: {}", envelopeSubBudgets);
            EnvelopeBuildDetails result = budgetEnvelopeRunner.runEnvelopeCreation(envelopeCreateRequest, budgetCriteria, envelopeSubBudgets);
            return ResponseEntity.ok(result);
        }catch(DataException ex){
            log.error("There was an error creating the envelope: ", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    private List<DateRange> getEnvelopeDateRanges(EnvelopeCreateRequest envelopeCreateRequest)
    {
        return envelopeCreateRequest.criteria().stream()
                .map(newEnvelopeCriteria -> {
                    LocalDate start = newEnvelopeCriteria.getStartDate();
                    LocalDate end = newEnvelopeCriteria.getTargetDate();
                    return new DateRange(start, end);
                })
                .toList();
    }

    private List<SubBudget> getEnvelopeSubBudgets(List<DateRange> dateRanges, final Long userId)
    {
        return dateRanges.stream()
                .flatMap(dateRange -> {
                    LocalDate monthStart = dateRange.getStartDate().withDayOfMonth(1);
                    LocalDate monthEnd = dateRange.getEndDate().withDayOfMonth(dateRange.getEndDate().lengthOfMonth());
                    return subBudgetService.getSubBudgetsByUserIdAndDateRange(userId, monthStart, monthEnd).stream();
                })
                .collect(Collectors.toMap(SubBudget::getId, s -> s, (a, b) -> a))
                .values()
                .stream()
                .toList();
    }

    @GetMapping("/{userId}/linked-envelopes")
    public ResponseEntity<List<LinkedEnvelopesEntity>> getLinkedEnvelopesByUserId(@PathVariable Long userId,
                                                                                  @RequestParam LocalDate monthStart,
                                                                                  @RequestParam LocalDate monthEnd)
    {
        try
        {
            LocalDate actualMonthEnd = monthEnd.minusDays(1);
            log.info("Retrieving linked envelopes for user {} between {} and {}", userId, monthStart, actualMonthEnd);
            List<LinkedEnvelopesEntity> linkedEnvelopes = linkedEnvelopesService.findByUserIdAndDates(userId, monthStart,actualMonthEnd);
            log.info("Retrieved {} linked envelopes for user {} between {} and {}", linkedEnvelopes.size(), userId, monthStart, actualMonthEnd);
            return ResponseEntity.ok(linkedEnvelopes);
        }catch(DataException ex){
            log.error("There was an error retrieving the linked envelopes: ", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/envelopes")
    public ResponseEntity<List<EnvelopeEntity>> getEnvelopesByUserId(@PathVariable Long userId,
                                                                     @RequestParam LocalDate monthStart,
                                                                     @RequestParam LocalDate monthEnd)
    {
        try
        {
            LocalDate actualMonthEnd = monthEnd.minusDays(1);
            log.info("Retrieving envelopes for user {} between {} and {}", userId, monthStart, actualMonthEnd);
            List<EnvelopeEntity> envelopes = envelopeService.findByUserIdAndDates(userId, monthStart, actualMonthEnd);
            log.info("Retrieved {} envelopes for user {} between {} and {}", envelopes.size(), userId, monthStart, actualMonthEnd);

            log.info("Envelopes: {}", envelopes);
            return ResponseEntity.ok(envelopes);
        }catch(DataException ex){
            log.error("There was an error retrieving the envelopes: ", ex);
            return ResponseEntity.internalServerError().build();
        }
    }
}
