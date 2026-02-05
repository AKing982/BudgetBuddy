package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.CategoryRunnerException;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.categories.CategorizerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class CategoryRunner
{
    private final CategorizerService<TransactionCSV> csvCategorizerService;
    private final CSVTransactionService csvTransactionService;
    private final UserLogService userLogService;
    private final SubBudgetService subBudgetService;
    private List<TransactionCategory> categorizedCSVTransactions = new ArrayList<>();
    private final TransactionService transactionService;
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public CategoryRunner(@Qualifier("csvCategorizer") CategorizerService<TransactionCSV> categorizerService,
                          CSVTransactionService csvTransactionService,
                          UserLogService userLogService,
                          SubBudgetService subBudgetService,
                          TransactionService transactionService,
                          TransactionCategoryService transactionCategoryService)
    {
        this.csvCategorizerService = categorizerService;
        this.csvTransactionService = csvTransactionService;
        this.userLogService = userLogService;
        this.subBudgetService = subBudgetService;
        this.transactionService = transactionService;
        this.transactionCategoryService = transactionCategoryService;
    }

    public void categorizeSingleCSVTransaction(final CategorySaveData categorySaveData)
    {
        if(categorySaveData == null)
        {
            throw new CategoryRunnerException("Category save data cannot be null");
        }
        try
        {
            String category = categorySaveData.category();
            if(category == null || category.isEmpty())
            {
                throw new CategoryRunnerException("Category cannot be empty");
            }
            Long transactionId = parseTransactionId(categorySaveData.transactionId());
            transactionCategoryService.updateTransactionCategoriesByIdAndCategory(category, transactionId);

        }catch(CategoryRunnerException e){
            log.error("There was an error categorizing the category save data: {}", e.getMessage());
            throw e;
        }
    }

    private Long parseTransactionId(String transactionId)
    {
        try
        {
            String[] transactionIdSplit = transactionId.split("-");
            return Long.parseLong(transactionIdSplit[1]);
        }catch(Exception e)
        {
            log.error("There was an error parsing the transaction id: {}", transactionId);
            return 0L;
        }
    }

    public void categorizeCSVTransactionsByRange(Long userId,
                                                 LocalDate startDate,
                                                 LocalDate endDate)
    {
        try
        {
            List<SubBudget> subBudgets = subBudgetService.getSubBudgetsByUserIdAndDateRange(userId, startDate, endDate);
            if(subBudgets.isEmpty())
            {
                log.info("There are no sub-budgets for user {} at {}", userId, startDate);
                return;
            }
            int pageNum = 30;
            List<TransactionCSV> transactionCSVS = csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, pageNum);
            if(transactionCSVS.isEmpty())
            {
                log.warn("There are no transactions to categorize for user {} between {} and {}", userId, startDate, endDate);
                return;
            }
            categorizedCSVTransactions = transactionCSVS.stream()
                    .map(transactionCSV -> {
                        Long csvTransactionId = transactionCSV.getId();
                        LocalDate transactionDate = transactionCSV.getTransactionDate();
                        // Categorize the transaction
                        Category category = csvCategorizerService.categorize(transactionCSV);
                        String categoryName = category.getCategoryName();
                        SubBudget matchingSubBudget = subBudgets.stream()
                                .filter(sb -> !transactionDate.isBefore(sb.getStartDate()) &&
                                        !transactionDate.isAfter((sb.getEndDate())))
                                .findFirst()
                                .orElseThrow(() -> new RuntimeException("Sub-budget not found"));
                        Long subBudgetId = matchingSubBudget.getId();
                        return TransactionCategory.builder()
                                .category(categoryName)
                                .subBudgetId(subBudgetId)
                                .csvTransactionId(csvTransactionId)
                                .categorizedDate(category.getCategorizedDate())
                                .createdAt(LocalDateTime.now())
                                .categorizedBy(category.getCategorizedBy())
                                .build();
                    })
                    .collect(Collectors.toList());
            transactionCategoryService.saveAll(categorizedCSVTransactions);
        }catch(Exception e){
            log.error("There was an error fetching the transaction categories: {}", e.getMessage());
            throw e;
        }
    }
}
