package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.CSVTransactionEntity;
import com.app.budgetbuddy.exceptions.CSVParserException;
import com.app.budgetbuddy.services.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
@Slf4j
public class CSVUploadRunner
{
    private CSVTransactionService csvTransactionService;
    private CSVUploaderService<TransactionCSV, AccountCSV, CSVAccountEntity> accountCSVUploaderService;
    private CSVParserService csvParserService;
    private UserService userService;
    private CategoryRunner categoryRunner;

    @Autowired
    public CSVUploadRunner(CSVTransactionService csvTransactionService,
                           @Qualifier("accountCSVUploaderServiceImpl") CSVUploaderService<TransactionCSV, AccountCSV, CSVAccountEntity> accountCSVUploaderService,
                           CSVParserService csvParserService,
                           UserService userService,
                           CategoryRunner categoryRunner)
    {
        this.csvTransactionService = csvTransactionService;
        this.accountCSVUploaderService = accountCSVUploaderService;
        this.csvParserService = csvParserService;
        this.userService = userService;
        this.categoryRunner = categoryRunner;
    }

    public Boolean parseCSV(MultipartFile file, String institution, LocalDate startDate, LocalDate endDate, Long userId)
    {
        try
        {
            boolean userHasUploadAccess = userService.doesUserHaveOverride(userId);
            if(userHasUploadAccess)
            {
                List<TransactionCSV> parsedCSVs = csvParserService.parseCSV(file, institution);
                List<TransactionCSV> filteredByDates = filterTransactionCSVByDateRange(parsedCSVs, startDate, endDate);
                if(institution.equals("Granite Credit Union"))
                {
                    Set<AccountCSV> accountCSVList = accountCSVUploaderService.createCSVList(filteredByDates, userId);
                    List<CSVAccountEntity> csvAccountEntities = accountCSVUploaderService.createEntityList(accountCSVList);
                    accountCSVUploaderService.saveEntities(csvAccountEntities);
                }
                List<CSVTransactionEntity> csvTransactionEntities = csvTransactionService.createCSVTransactionEntities(filteredByDates, userId);
                csvTransactionService.saveAllCSVTransactionEntities(csvTransactionEntities);
                categoryRunner.categorizeCSVTransactionsByRange(userId, startDate, endDate);
                return true;
            }
            return false;
        }catch(CSVParserException e){
            return false;
        }
    }

    private List<TransactionCSV> filterTransactionCSVByDateRange(List<TransactionCSV> transactionCSVList, LocalDate startDate, LocalDate endDate)
    {
        return transactionCSVList.stream()
                .filter(transactionCSV -> {
                    LocalDate transactionDate = transactionCSV.getTransactionDate();
                    log.info("Transaction Date: {}", transactionDate);
                    return !transactionDate.isBefore(startDate) && !transactionDate.isAfter(endDate);
                })
                .sorted(Comparator.comparing(TransactionCSV::getTransactionDate))
                .toList();
    }
}
