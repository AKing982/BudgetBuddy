package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.TransactionRule;
import com.app.budgetbuddy.entities.TransactionRuleEntity;
import com.app.budgetbuddy.services.TransactionRuleService;
import lombok.extern.slf4j.Slf4j;
import org.jetbrains.annotations.NotNull;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

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

    @PutMapping("/{ruleId}/{userId}/update-active")
    public ResponseEntity<TransactionRule> updateTransactionRuleActiveStatus(@PathVariable Long ruleId,
                                                                             @PathVariable Long userId,
                                                                             @RequestParam boolean active)
    {
        try
        {
            transactionRuleService.updateTransactionRuleActiveStatus(active, ruleId, userId);
            Optional<TransactionRuleEntity> transactionRuleEntityOptional = transactionRuleService.findById(ruleId);
            if(transactionRuleEntityOptional.isPresent())
            {
                TransactionRuleEntity transactionRuleEntity = transactionRuleEntityOptional.get();
                TransactionRule transactionRule = transactionRuleService.createCategoryRuleFromEntity(transactionRuleEntity);
                return ResponseEntity.ok(transactionRule);
            }else{
                return ResponseEntity.notFound().build();
            }
        }catch(Exception e){
            log.error("There was an error updating the transaction rule {} active status: ",  ruleId, e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PutMapping("/{userId}/update/{ruleId}")
    public ResponseEntity<TransactionRule> updateTransactionRule(@PathVariable Long ruleId,
                                                                 @RequestBody TransactionRule transactionRule)
    {
        try
        {
            transactionRuleService.updateTransactionRule(transactionRule);
            Optional<TransactionRuleEntity> transactionRuleEntityOptional = transactionRuleService.findById(ruleId);
            if(transactionRuleEntityOptional.isPresent())
            {
                TransactionRuleEntity transactionRuleEntity = transactionRuleEntityOptional.get();
                TransactionRule transactionRule1 = transactionRuleService.createCategoryRuleFromEntity(transactionRuleEntity);
                return ResponseEntity.ok(transactionRule1);
            }
            return ResponseEntity.notFound().build();

        }catch(Exception e){
            log.error("There was an error updating transaction rule {}", ruleId, e);
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
