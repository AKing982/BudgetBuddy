package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.exceptions.CategoryRunnerException;
import com.app.budgetbuddy.services.CSVTransactionService;
import com.app.budgetbuddy.services.TransactionCategoryService;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.services.UserLogService;
import com.app.budgetbuddy.workbench.categories.CategorizerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

@Service
@Slf4j
public class CategoryRunner
{
    private final CategorizerService<TransactionCSV> csvCategorizerService;
    private final CSVTransactionService csvTransactionService;
    private final UserLogService userLogService;
    private final List<TransactionCategory> categorizedCSVTransactions = new ArrayList<>();
    private final TransactionService transactionService;
    private final TransactionCategoryService transactionCategoryService;

    @Autowired
    public CategoryRunner(@Qualifier("csvCategorizer") CategorizerService<TransactionCSV> categorizerService,
                          CSVTransactionService csvTransactionService,
                          UserLogService userLogService,
                          TransactionService transactionService,
                          TransactionCategoryService transactionCategoryService)
    {
        this.csvCategorizerService = categorizerService;
        this.csvTransactionService = csvTransactionService;
        this.userLogService = userLogService;
        this.transactionService = transactionService;
        this.transactionCategoryService = transactionCategoryService;
    }

    @Scheduled(cron = "0 0 * * * 1-5")
    public void scheduleCSVTransactionCategorization()
    {
        LocalDate today = LocalDate.now();
        LocalDate lastMonth = today.minusDays(30);
        List<Long> currentUserIds = userLogService.getActiveUserIds();
        if(currentUserIds.isEmpty())
        {
            log.warn("There are no active users to categorize CSV transactions for");
            return;
        }
        currentUserIds.forEach(userId -> categorizeCSVTransactionsByRange(userId, lastMonth, today));
    }

    public Optional<TransactionCSV> categorizeSingleCSVTransaction(final CategorySaveData categorySaveData)
    {
        if (categorySaveData == null)
        {
            return Optional.empty();
        }
        try
        {
            String category = categorySaveData.category();
            if(category == null || category.isEmpty())
            {
                throw new CategoryRunnerException("Category cannot be empty");
            }
            Long transactionId = parseTransactionId(categorySaveData.transactionId());
            return csvTransactionService.updateTransactionCSVByCategory(transactionId, category);
        }catch(CategoryRunnerException e){
            log.error("There was an error categorizing the category save data: {}", e.getMessage());
            return Optional.empty();
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

    public List<TransactionCategory> categorizeCSVTransactionsByRange(Long userId,
                                                                    LocalDate startDate,
                                                                    LocalDate endDate)
    {
        try
        {
            List<TransactionCSV> transactionCSVS = csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate);
            if(transactionCSVS.isEmpty())
            {
                return Collections.emptyList();
            }
            for(TransactionCSV transactionCSV : transactionCSVS)
            {
                Long csvTransactionId = transactionCSV.getId();
                // Categorize the transaction
                Category category = csvCategorizerService.categorize(transactionCSV);
                String categoryName = category.getCategoryName();
                TransactionCategory transactionCategory = TransactionCategory.builder()
                        .category(categoryName)
                        .categoryId(category.getCategoryId())
                        .csvTransactionId(csvTransactionId)
                        .categorizedDate(category.getCategorizedDate())
                        .createdAt(LocalDateTime.now())
                        .categorizedBy(category.getCategorizedBy())
                        .build();
                categorizedCSVTransactions.add(transactionCategory);
            }
            transactionCategoryService.saveAll(categorizedCSVTransactions);
            return categorizedCSVTransactions;
        }catch(Exception e){
            log.error("There was an error fetching the transaction categories: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
