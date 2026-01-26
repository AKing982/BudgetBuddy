package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.entities.TransactionRuleEntity;
import com.app.budgetbuddy.workbench.categories.TransactionRuleService;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/transaction-rules")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class TransactionRuleController
{
    private final TransactionRuleService transactionRuleService;

    @Autowired
    public TransactionRuleController(TransactionRuleService transactionRuleService)
    {
        this.transactionRuleService = transactionRuleService;
    }

    @GetMapping("/{userId}/rules")
    public ResponseEntity<List<TransactionRule>> getTransactionRulesByUserId(@PathVariable Long userId)
    {
        try
        {
            List<TransactionRule> transactionRules = transactionRuleService.findByUserId(userId);
            return ResponseEntity.ok(transactionRules);
        }catch(Exception e){
            log.error("There was an error retrieving transaction rules for user {}", userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @DeleteMapping("/{userId}/delete/{ruleId}")
    public ResponseEntity<Boolean> deleteTransactionRuleById(@PathVariable Long userId,
                                                             @PathVariable Long id)
    {
        try
        {
            return null;
        }catch(Exception e){
            log.error("There was an error deleting transaction rule {} for user {}", id, userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{userId}/update/{ruleId}")
    public ResponseEntity<TransactionRule> updateTransactionRule(@PathVariable Long userId,
                                                                  @PathVariable Long ruleId)
    {
        try
        {
            return null;
        }catch(Exception e){
            log.error("There was an error updating transaction rule {} for user {}", ruleId, userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{userId}/add")
    public ResponseEntity<TransactionRule> addTransactionRule(@PathVariable Long userId,
                                                              @RequestBody @NotNull TransactionRule transactionRule)
    {
        try
        {
            TransactionRuleEntity transactionRuleEntity = transactionRuleService.create(transactionRule);
            transactionRuleService.save(transactionRuleEntity);
            return ResponseEntity.status(HttpStatus.CREATED).body(transactionRule);
        }catch(Exception e){
            log.error("There was an error adding transaction rule {} for user {}", transactionRule, userId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/category")
    public ResponseEntity<List<TransactionRule>> getTransactionRulesByUserAndCategory(@PathVariable Long userId,
                                                                                      @RequestParam @NotNull String category)
    {
        try
        {
            return null;
        }catch(Exception e){
            log.error("There was an error retrieving transaction rules for user {} and category {}", userId, category, e);
            return ResponseEntity.internalServerError().build();
        }
    }

}
