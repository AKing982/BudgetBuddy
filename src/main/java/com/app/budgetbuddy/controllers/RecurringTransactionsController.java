package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.RecurringTransactionEntityResponse;
import com.app.budgetbuddy.domain.RecurringTransactionRequest;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.TransactionStream;
import com.plaid.client.model.TransactionsRecurringGetResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping(value="/api/recurring-transactions")
@CrossOrigin(value="http://localhost:3000")
public class RecurringTransactionsController
{
    private final RecurringTransactionService recurringTransactionService;
    private final Logger LOGGER = LoggerFactory.getLogger(RecurringTransactionsController.class);

    @Autowired
    public RecurringTransactionsController(RecurringTransactionService recurringTransactionService){
        this.recurringTransactionService = recurringTransactionService;
    }

    @GetMapping("/")
    public ResponseEntity<List<RecurringTransactionEntity>> getAllRecurringTransactions(){
        return null;
    }

    @GetMapping("/users/{userId}/recurring")
    public ResponseEntity<List<RecurringTransactionEntityResponse>> getAllRecurringTransactionsByUserId(@PathVariable Long userId){
        if(userId < 1L){
            return ResponseEntity.badRequest().body(null);
        }
        try
        {
            List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionService.findAllByUserId(userId);
            List<RecurringTransactionEntityResponse> recurringTransactionEntityResponses = createRecurringTransactionEntityResponse(recurringTransactionEntities);
            return ResponseEntity.ok(recurringTransactionEntityResponses);
        }catch(Exception e){
            LOGGER.error("Error while getting recurring transactions for user {}", userId, e);
        }
        return ResponseEntity.badRequest().body(null);
    }

    private List<RecurringTransactionEntityResponse> createRecurringTransactionEntityResponse(List<RecurringTransactionEntity> recurringTransactionEntities){
        List<RecurringTransactionEntityResponse> recurringTransactionEntityResponses = new ArrayList<>();
        for(RecurringTransactionEntity recurringTransactionEntity : recurringTransactionEntities){
            Long id = recurringTransactionEntity.getId();
            Long userId = recurringTransactionEntity.getUser().getId();
            String accountId = recurringTransactionEntity.getAccount().getId();
            String streamId = recurringTransactionEntity.getStreamId();
            String categoryId = recurringTransactionEntity.getCategory().getId();
            String description = recurringTransactionEntity.getDescription();
            String merchantName = recurringTransactionEntity.getMerchantName();
            LocalDate firstDate = recurringTransactionEntity.getFirstDate();
            LocalDate lastDate = recurringTransactionEntity.getLastDate();
            String frequency = recurringTransactionEntity.getFrequency();
            BigDecimal averageAmount = recurringTransactionEntity.getAverageAmount();
            BigDecimal lastAmount = recurringTransactionEntity.getLastAmount();
            Boolean isActive = recurringTransactionEntity.isActive();
            String type = recurringTransactionEntity.getType();
            RecurringTransactionEntityResponse recurringTransactionEntityResponse = new RecurringTransactionEntityResponse(id, userId, accountId, streamId, categoryId, description, merchantName, firstDate, lastDate, frequency, averageAmount, lastAmount, isActive, type);
            recurringTransactionEntityResponses.add(recurringTransactionEntityResponse);
        }
        return recurringTransactionEntityResponses;
    }

    @GetMapping("/{userId}/by-date-range")
    public ResponseEntity<List<RecurringTransactionEntity>> getRecurringTransactionsByDateRange(@PathVariable Long userId,
                                                                                                @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                                                                @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate endDate){
        try
        {
            List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionService.findByUserAndDateRange(userId, startDate, endDate);
            return ResponseEntity.ok(recurringTransactionEntities);
        }catch(Exception e){
            LOGGER.error("Error while getting recurring transactions for user {}", userId, e);
            return ResponseEntity.internalServerError().body(null);
        }
    }

    @PostMapping("/")
    public ResponseEntity<List<RecurringTransactionEntity>> addRecurringTransaction(@RequestBody RecurringTransactionRequest recurringTransactionEntity){
        try
        {
            List<RecurringTransactionDTO> outflowing = recurringTransactionEntity.outflowStreams();
            List<RecurringTransactionDTO> inflowing = recurringTransactionEntity.inflowStreams();

            List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionService.createRecurringTransactions(outflowing, inflowing);
            LOGGER.info("Successfully created and saved Recurring Transactions: {}", recurringTransactionEntities);
            return ResponseEntity.ok(recurringTransactionEntities);

        }catch(Exception e){
            LOGGER.error("Error while adding recurring transaction {}", recurringTransactionEntity, e);
        }

        return ResponseEntity.badRequest().body(null);
    }


}
