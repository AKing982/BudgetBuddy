package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetCriteria;
import com.app.budgetbuddy.domain.Envelope;
import com.app.budgetbuddy.domain.EnvelopeBuildDetails;
import com.app.budgetbuddy.domain.EnvelopeCreateRequest;
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
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

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

    @PostMapping("/create")
    public ResponseEntity<EnvelopeBuildDetails> createEnvelope(@RequestBody EnvelopeCreateRequest envelopeCreateRequest,
                                                               @RequestParam Long userId,
                                                               @RequestParam LocalDate startDate,
                                                               @RequestParam LocalDate endDate)
    {
        try
        {
            BudgetCriteria budgetCriteria = subBudgetService.getBudgetCriteriaByUserIdAndDateRange(userId,startDate, endDate)
                    .orElseThrow(() -> new DataException("No budget criteria found for user " + userId + " between " + startDate + " and " + endDate));
            EnvelopeBuildDetails result = budgetEnvelopeRunner.runEnvelopeCreation(envelopeCreateRequest, budgetCriteria);
            return ResponseEntity.ok(result);
        }catch(DataException ex){
            log.error("There was an error creating the envelope: ", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/linked-envelopes")
    public ResponseEntity<List<LinkedEnvelopesEntity>> getLinkedEnvelopesByUserId(@PathVariable Long userId)
    {
        try
        {
            List<LinkedEnvelopesEntity> linkedEnvelopes = linkedEnvelopesService.findByUserId(userId);
            return ResponseEntity.ok(linkedEnvelopes);
        }catch(DataException ex){
            log.error("There was an error retrieving the linked envelopes: ", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/envelopes")
    public ResponseEntity<List<EnvelopeEntity>> getEnvelopesByUserId(@PathVariable Long userId)
    {
        try
        {
            List<EnvelopeEntity> envelopes = envelopeService.findByUserId(userId);
            return ResponseEntity.ok(envelopes);
        }catch(DataException ex){
            log.error("There was an error retrieving the envelopes: ", ex);
            return ResponseEntity.internalServerError().build();
        }
    }
}
