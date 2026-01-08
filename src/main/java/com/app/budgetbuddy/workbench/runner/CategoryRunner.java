package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.CategorySaveData;
import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.Locations;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.services.CSVTransactionService;
import com.app.budgetbuddy.services.UserLogService;
import com.app.budgetbuddy.workbench.categories.CategorizerService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
@Slf4j
public class CategoryRunner
{
    private final CategorizerService<TransactionCSV> csvCategorizerService;
    private final CSVTransactionService csvTransactionService;
    private final UserLogService userLogService;
    private final List<TransactionCSV> categorizedCSVTransactions = new ArrayList<>();

    @Autowired
    public CategoryRunner(@Qualifier("csvCategorizer") CategorizerService<TransactionCSV> categorizerService,
                          CSVTransactionService csvTransactionService,
                          UserLogService userLogService)
    {
        this.csvCategorizerService = categorizerService;
        this.csvTransactionService = csvTransactionService;
        this.userLogService = userLogService;
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

    private String trimMerchantName(String merchantName)
    {
        String trimmedMerchantName = merchantName.trim();
        log.info("Original Merchant Name: {}", trimmedMerchantName);
        Locations[] locations = Locations.values();
        for(Locations location : locations)
        {
            String locationValue = location.getValue();
            log.info("Location Value: {}", locationValue);
            String toLowerValue = locationValue.toLowerCase();
            log.info("ToLower Value: {}", toLowerValue);
            if(trimmedMerchantName.toLowerCase().contains(locationValue.toLowerCase()))
            {
                log.info("Merchant Name contains: {}", locationValue);
                int toUpperIndex = trimmedMerchantName.indexOf(toLowerValue);
                int toUpperLength = toLowerValue.length();
                trimmedMerchantName = trimmedMerchantName.substring(0, toUpperIndex + toUpperLength + 1).trim();
                log.info("Trimmed Merchant Name substring: {}", trimmedMerchantName);
                break;
            }
        }
        return trimmedMerchantName;
    }

    public Optional<TransactionCSV> categorizeSingleCSVTransaction(final CategorySaveData categorySaveData)
    {
        if(categorySaveData == null)
        {
            return Optional.empty();
        }
        return null;
    }

    public List<TransactionCSV> categorizeCSVTransactionsByRange(Long userId,
                                                                    LocalDate startDate,
                                                                    LocalDate endDate)
    {
        try
        {
            List<TransactionCSV> transactionCSVS = csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate);
            for(TransactionCSV transactionCSV : transactionCSVS)
            {
                Long csvTransactionId = transactionCSV.getId();

                // Trim and replace any transaction that has a bad merchant name
                String trimmedMerchantName = trimMerchantName(transactionCSV.getMerchantName());
                log.info("Trimmed Merchant Name: {}", trimmedMerchantName);

                // Categorize the transaction
                CategoryType categoryType = csvCategorizerService.categorize(transactionCSV);
                String category = categoryType.getType();

                // Update the existing transaction with the new category type
                Optional<TransactionCSV> transactionCSVOptional = csvTransactionService.updateTransactionCSVCategoryAndMerchantName(csvTransactionId, trimmedMerchantName, category);
                if(transactionCSVOptional.isEmpty())
                {
                    log.error("There was an error updating the transaction category for transaction id {}", csvTransactionId);
                    continue;
                }
                TransactionCSV updatedTransactionCSV = transactionCSVOptional.get();
                categorizedCSVTransactions.add(updatedTransactionCSV);
            }
            return categorizedCSVTransactions;
        }catch(Exception e){
            log.error("There was an error fetching the transaction categories: {}", e.getMessage());
            return Collections.emptyList();
        }
    }
}
