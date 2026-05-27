package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionCategoryTest;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.workbench.runner.CategoryRunner;
import com.app.budgetbuddy.workbench.runner.PlaidTransactionRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.parameters.P;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

@RestController
@RequestMapping("/api/plaid/test")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class PlaidTestController
{
    private final CategoryRunner categoryRunner;
    private final PlaidTransactionRunner plaidTransactionRunner;
    private final TransactionService transactionService;

    @Autowired
    public PlaidTestController(CategoryRunner categoryRunner,
                               PlaidTransactionRunner plaidTransactionRunner,
                               TransactionService transactionService)
    {
        this.categoryRunner = categoryRunner;
        this.plaidTransactionRunner = plaidTransactionRunner;
        this.transactionService = transactionService;
    }

    @GetMapping("/categorize-by-date")
    public ResponseEntity<List<TransactionCategoryTest>> categorizeTransactionsByDate(@RequestParam LocalDate startDate,
                                                                                      @RequestParam LocalDate endDate,
                                                                                      @RequestParam Long userId,
                                                                                      @RequestParam(required = false) boolean isUncategorized,
                                                                                      @RequestParam(required = false) String filterByCategory)
    {
        try
        {
            List<Transaction> fetchedTransactions = plaidTransactionRunner.getTransactionsResponse(userId, startDate, endDate);
            List<TransactionCategory> transactionCategories = categoryRunner.testCategorizeTransactionsByDateRange(userId, fetchedTransactions, startDate, endDate);
            if(isUncategorized)
            {
                List<TransactionCategory> uncategorizedTransactions = transactionCategories.stream()
                        .filter(e -> e.getCategory().equalsIgnoreCase("Uncategorized"))
                        .toList();
                List<TransactionCategoryTest> uncategorizedTransactionCategoryTests = buildTransactionCategoryTestList(uncategorizedTransactions);
                return ResponseEntity.ok(uncategorizedTransactionCategoryTests);
            }
            List<TransactionCategory> filteredTransactionCategories = transactionCategories.stream()
                    .filter(e -> e.getCategory().equalsIgnoreCase(filterByCategory))
                    .toList();
            if(filterByCategory == null || filterByCategory.isEmpty())
            {
                return ResponseEntity.ok(buildTransactionCategoryTestList(transactionCategories));
            }
            List<TransactionCategoryTest> transactionCategoryTests = buildTransactionCategoryTestList(filteredTransactionCategories);
            return ResponseEntity.ok(transactionCategoryTests);

        }catch(DataException ex){
            log.error("There was an error fetching the transactions by date range", ex);
            return ResponseEntity.internalServerError().build();
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    private List<TransactionCategoryTest> buildTransactionCategoryTestList(List<TransactionCategory> transactionCategories)
    {
        if(transactionCategories.isEmpty())
        {
            return Collections.emptyList();
        }
        return transactionCategories.stream()
                .map(transactionCategory -> {
                    String transactionId = transactionCategory.getTransactionId();
                    Optional<Transaction> transactionOptional = transactionService.findTransactionById(transactionId);
                    Transaction transaction = transactionOptional.get();
                    String merchantName = transaction.getMerchantName();
                    String name = transaction.getName();
                    LocalDate posted = transaction.getPosted();
                    String description = transaction.getDescription();
                    String primaryCategory = transaction.getPrimaryCategory();
                    String secondaryCategory = transaction.getSecondaryCategory();
                    String categoryId = transaction.getCategoryId();
                    String categorizedBy = transactionCategory.getCategorizedBy();
                    String matchedCategory = transactionCategory.getCategory();
                    BigDecimal amount = transaction.getAmount();
                    return TransactionCategoryTest.builder()
                            .matchedCategory(matchedCategory)
                            .amount(amount)
                            .postedDate(posted)
                            .description(description)
                            .primaryCategory(primaryCategory)
                            .secondaryCategory(secondaryCategory)
                            .categoryId(categoryId)
                            .categorizedBy(categorizedBy)
                            .merchantName(merchantName)
                            .name(name)
                            .build();
                })
                .filter(Objects::nonNull)
                .toList();
    }


}
