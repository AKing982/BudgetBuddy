package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.domain.Locations;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.UploadStatus;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.CSVTransactionEntity;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.runner.CategoryRunner;
import com.univocity.parsers.common.record.Record;
import com.univocity.parsers.csv.CsvParser;
import com.univocity.parsers.csv.CsvParserSettings;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class UploadController
{
    private final UserService userService;
    private final AccountService accountService;
    private final CSVAccountRepository csvAccountRepository;
    private final CSVUploaderService<TransactionCSV, AccountCSV, CSVAccountEntity> accountCSVUploaderService;
    private final CSVTransactionService csvTransactionService;
    private final CategoryRunner categoryRunner;

    @Autowired
    public UploadController(UserService userService,
                            AccountService accountService,
                            CSVAccountRepository csvAccountRepository,
                            @Qualifier("accountCSVUploaderServiceImpl") CSVUploaderService<TransactionCSV, AccountCSV, CSVAccountEntity> accountCSVUploaderService,
                            CSVTransactionService csvTransactionService,
                            CategoryRunner categoryRunner)
    {
        this.userService = userService;
        this.accountService = accountService;
        this.csvAccountRepository = csvAccountRepository;
        this.accountCSVUploaderService = accountCSVUploaderService;
        this.csvTransactionService = csvTransactionService;
        this.categoryRunner = categoryRunner;
    }

    @GetMapping("/{userId}/byDates")
    public ResponseEntity<Boolean> checkIfTransactionsExistByDateRanges(@PathVariable Long userId,
                                                                        @RequestParam("startDate") LocalDate startDate,
                                                                        @RequestParam("endDate") LocalDate endDate)
    {
        if(userId < 1L || startDate == null || endDate == null)
        {
            return ResponseEntity.badRequest().build();
        }
        List<TransactionCSV> transactionCSVS = csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate);
        System.out.println(transactionCSVS.size());
        if(transactionCSVS.isEmpty())
        {
            log.info("No transactions exist for user {} between {} and {}", userId, startDate, endDate);
            return ResponseEntity.ok(false);
        }
        log.info("Transactions exist for user {} between {} and {}", userId, startDate, endDate);
        return ResponseEntity.ok(true);
    }

    @PostMapping("/{userId}/csv")
    public ResponseEntity<UploadStatus> uploadCSV(@PathVariable Long userId,
                                                  @RequestParam("startDate") LocalDate startDate,
                                                  @RequestParam("endDate") LocalDate endDate,
                                                  @RequestParam("file") MultipartFile file) throws IOException
    {
        List<TransactionCSV> transactionCsvData = new ArrayList<>();
        if(file.isEmpty())
        {
            log.error("No file was uploaded");
            return ResponseEntity.badRequest().body(new UploadStatus("No File was uploaded", false));
        }
        boolean userHasUploadAccess = userService.doesUserHaveOverride(userId);
        try
        {
            if(userHasUploadAccess)
            {
                InputStream inputStream = file.getInputStream();
                CsvParserSettings settings = new CsvParserSettings();
                settings.setHeaderExtractionEnabled(true);
                settings.getFormat().setLineSeparator("\n");
                SimpleDateFormat formatter = new SimpleDateFormat("MM/d/yyyy");
                CsvParser parser = new CsvParser(settings);
//                boolean transactionsExistForDateRange = validateCSVTransactionExistForDateRange(userId, startDate, endDate);
//                if(transactionsExistForDateRange)
//                {
//                    log.error("Transactions already exist for user {} between {} and {}", userId, startDate, endDate);
//                    return ResponseEntity.status(409).body(new UploadStatus("Transactions already exist for the selected date range. Please choose a different date range or delete existing transactions first.", false));
//                }
                List<Record> parseAllRecords = parser.parseAllRecords(inputStream);
                parseAllRecords.forEach(record -> {
                    TransactionCSV transactionCSV = new TransactionCSV();
                    transactionCSV.setAccount(record.getString("Account"));
                    transactionCSV.setSuffix(Integer.parseInt(record.getString("Suffix")));
                    transactionCSV.setSequenceNo(removeLeadingZeros(record.getString("Sequence Number")));
                    transactionCSV.setTransactionDate(convertDateToLocalDate(record.getString("Transaction Date"), formatter));
                    transactionCSV.setTransactionAmount(parseCurrency(record.getString("Transaction Amount")));
                    transactionCSV.setDescription(record.getString("Description"));
                    transactionCSV.setBalance(parseCurrency(record.getString("Balance")));
                    transactionCSV.setMerchantName(getMerchantNameByExtendedDescription(record.getString("Extended Description"), record.getString("Description")));
                    transactionCSV.setExtendedDescription(record.getString("Extended Description"));
                    transactionCSV.setElectronicTransactionDate(convertDateToLocalDate(record.getString("Electronic Transaction Date"), formatter));
                    transactionCSV.setBalance(parseCurrency(record.getString("Balance")));
                    log.info("{}", transactionCSV.toString());
                    transactionCsvData.add(transactionCSV);
                });
                if(transactionCsvData.isEmpty())
                {
                    log.error("No transactions were parsed from the uploaded CSV file");
                    return ResponseEntity.badRequest().body(new UploadStatus("No transactions were parsed from the uploaded CSV file", false));
                }
                log.info("Successfully parsed {} transactions from the uploaded CSV file", transactionCsvData.size());
                List<TransactionCSV> filteredTransactionsByDateRange = filterTransactionCSVByDateRange(transactionCsvData, startDate, endDate);
                log.info("Successfully filtered csv transactions by date range: start={}, end={}, size={}", startDate, endDate, filteredTransactionsByDateRange.size());
                // After filtering convert the Transaction CSV models to TransactionEntity models
                // Check if the user has any accounts with the indicated suffix's from the transaction CSVs
                List<AccountEntity> userPlaidAccounts = accountService.findByUser(userId);
                log.info("User {} has {} Plaid accounts", userId, userPlaidAccounts.size());
                if(userPlaidAccounts.isEmpty())
                {
                    log.info("No User Plaid accounts found... Creating Account CSV info");
                    // Next step is to generate CSVAccounts
                    Set<AccountCSV> accountCSVList = accountCSVUploaderService.createCSVList(filteredTransactionsByDateRange, userId);
                    List<CSVAccountEntity> csvAccountEntityList = accountCSVUploaderService.createEntityList(accountCSVList);
                    accountCSVUploaderService.saveEntities(csvAccountEntityList);
                    log.info("Successfully created {} CSVAccountEntities for user {}", csvAccountEntityList.size(), userId);
                }
                log.info("Successfully converted {} Transaction CSV models to TransactionEntity models", filteredTransactionsByDateRange.size());
                filteredTransactionsByDateRange.forEach(transactionCSV -> log.info("{}", transactionCSV));
                List<CSVTransactionEntity> csvTransactionEntityList = csvTransactionService.createCSVTransactionEntities(filteredTransactionsByDateRange, userId);
                if(csvTransactionEntityList.isEmpty())
                {
                    log.error("No CSVTransactionEntities were created for user {} between {} and {}", userId, startDate, endDate);
                    return ResponseEntity.badRequest().body(new UploadStatus("No CSVTransactionEntities were created from the uploaded CSV file", false));
                }
                csvTransactionService.saveAllCSVTransactionEntities(csvTransactionEntityList);

                // Categorize the CSV Transactions for the uploaded date range
                categoryRunner.categorizeCSVTransactionsByRange(userId, startDate, endDate);
            }
            else
            {
                log.error("User {} does not have upload access", userId);
                String userUploadMessage = "User " + userId + " does not have upload access";
                return ResponseEntity.status(403).body(new UploadStatus(userUploadMessage,false));
            }
            return ResponseEntity.ok(new UploadStatus("Successfully uploaded CSV file", true));
        }catch(Exception ex){
            log.error("There was an error uploading CSV file", ex);
            return ResponseEntity.internalServerError().body(new UploadStatus("There was an error uploading CSV file: " + ex.getMessage(), false));
        }

    }


    private boolean validateCSVTransactionExistForDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return csvTransactionService.existsByUserAndDateRange(userId, startDate, endDate);
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

    private String getMerchantNameByExtendedDescription(String extendedDescription, String description)
    {
        if(extendedDescription == null || extendedDescription.trim().isEmpty())
        {
            log.info("Extended Description is null or empty");
            return description != null ? description : " ";
        }
        try
        {
            String trimmedExtendedDescription = extendedDescription.trim();
            log.info("Original Merchant Name: {}", trimmedExtendedDescription);
            Locations[] locations = Locations.values();
            for(Locations location : locations)
            {
                String locationValue = location.getValue();
                log.info("Location Value: {}", locationValue);
                String toLowerValue = locationValue.toLowerCase();
                log.info("ToLower Value: {}", toLowerValue);
                if(trimmedExtendedDescription.toLowerCase().contains(locationValue.toLowerCase()))
                {
                    log.info("Merchant Name contains: {}", locationValue);
                    int toUpperIndex = trimmedExtendedDescription.indexOf(toLowerValue);
                    int toUpperLength = toLowerValue.length();
                    trimmedExtendedDescription = trimmedExtendedDescription.substring(0, toUpperIndex + toUpperLength + 1).trim();
                    log.info("Trimmed Merchant Name substring: {}", trimmedExtendedDescription);
                    break;
                }
            }
            return trimmedExtendedDescription;
        }catch(Exception ex){
            log.error("There was an error converting extended description to merchant name", ex);
            throw ex;
        }
    }

    private Long removeLeadingZeros(String sequenceNumber)
    {
        String sanitized = sequenceNumber.replaceAll("^+0*", "");
        sanitized = sanitized.split("\\.")[0];
        try
        {
            return Long.parseLong(sanitized);
        }catch(NumberFormatException e){
            log.error("Error removing leading zeros from sequence number: {}", sequenceNumber, e);
            throw new IllegalArgumentException("Error removing leading zeros from sequence number: " + sequenceNumber);
        }
    }

    private BigDecimal parseCurrency(String currencyString)
    {
        if(currencyString == null || currencyString.trim().isEmpty())
        {
            return BigDecimal.ZERO;
        }
        String cleaned = currencyString.replaceAll("[$, \\s]", "");
        try
        {
            return new BigDecimal(cleaned);
        }catch(NumberFormatException e){
            log.error("Error parsing currency string: {}", currencyString, e);
            throw new IllegalArgumentException("Error parsing currency string: " + currencyString);
        }
    }

    private LocalDate convertDateToLocalDate(String dateString, SimpleDateFormat formatter)
    {
        log.info("Date String: {}", dateString);
        if(dateString == null || dateString.trim().isEmpty())
        {
            return null;
        }
        try
        {

            String normalizedDate = dateString.replace("-", "/");
            if (normalizedDate.matches("\\d{4}/\\d{2}/\\d{2}")) {
                formatter.applyPattern("yyyy/MM/dd");
            } else if (normalizedDate.matches("\\d{2}/\\d{2}/\\d{4}")) {
                formatter.applyPattern("MM/dd/yyyy");
            }

            Date date = formatter.parse(normalizedDate);
            return date.toInstant()
                    .atZone(ZoneId.systemDefault())
                    .toLocalDate();
        } catch (ParseException e) {
            log.error("Error parsing date: {}", dateString, e);
            throw new IllegalArgumentException("Error parsing date: " + dateString, e);
        }
    }
}
