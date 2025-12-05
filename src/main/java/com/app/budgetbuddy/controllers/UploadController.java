package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.UploadStatus;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.services.TransactionService;
import com.app.budgetbuddy.services.UserService;
import com.univocity.parsers.common.record.Record;
import com.univocity.parsers.csv.CsvParser;
import com.univocity.parsers.csv.CsvParserSettings;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/upload")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class UploadController
{
    private final UserService userService;
    private final TransactionService transactionService;

    @Autowired
    public UploadController(UserService userService,
                            TransactionService transactionService)
    {
        this.userService = userService;
        this.transactionService = transactionService;
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
        if(userHasUploadAccess)
        {
            InputStream inputStream = file.getInputStream();
            CsvParserSettings settings = new CsvParserSettings();
            settings.setHeaderExtractionEnabled(true);
            CsvParser parser = new CsvParser(settings);
            List<Record> parseAllRecords = parser.parseAllRecords(inputStream);
            parseAllRecords.forEach(record -> {
                TransactionCSV transactionCSV = new TransactionCSV();
                transactionCSV.setAccount(record.getString("Account"));
                transactionCSV.setSuffix(Integer.parseInt(record.getString("Suffix")));
                transactionCSV.setSequenceNo(Long.parseLong(record.getString("Sequence No")));
                transactionCSV.setTransactionDate(convertDateToLocalDate(record.getDate("TransactionDate")));
                transactionCSV.setTransactionAmount(record.getBigDecimal("Transaction Amount"));
                transactionCSV.setDescription(record.getString("Description"));
                transactionCSV.setExtendedDescription(record.getString("Extended Description"));
                transactionCSV.setElectronicTransactionDate(convertDateToLocalDate(record.getDate("Electronic Transaction Date")));
                transactionCSV.setBalance(record.getBigDecimal("Balance"));
                transactionCsvData.add(transactionCSV);
            });
            log.info("Successfully parsed {} transactions from the uploaded CSV file", transactionCsvData.size());
            List<TransactionCSV> filteredTransactionsByDateRange = transactionCsvData.stream()
                    .filter(transactionCSV -> {
                        LocalDate transactionDate = transactionCSV.getTransactionDate();
                        return !transactionDate.isBefore(startDate) && !transactionDate.isAfter(endDate);
                    })
                    .sorted()
                    .toList();
            log.info("Successfully filtered {} transactions by date range: start={}, end={}", startDate, endDate, filteredTransactionsByDateRange.size());
            // After filtering convert the Transaction CSV models to TransactionEntity models
            List<TransactionsEntity> transactionsEntities = transactionService.convertTransactionCSVsToEntities(filteredTransactionsByDateRange);
            log.info("Successfully converted {} Transaction CSV models to TransactionEntity models", filteredTransactionsByDateRange.size());
            transactionService.saveTransactionEntities(transactionsEntities);
            log.info("Successfully saved {} TransactionEntity models to the database", filteredTransactionsByDateRange.size());
            if(filteredTransactionsByDateRange.isEmpty())
            {
                String message = "No Transactions by the date range start=" + startDate + ", end=" + endDate + ",";
                return ResponseEntity.badRequest().body(new UploadStatus(message, false));
            }
        }
        else
        {
            log.error("User {} does not have upload access", userId);
            String userUploadMessage = "User " + userId + " does not have upload access";
            return ResponseEntity.status(403).body(new UploadStatus(userUploadMessage,false));
        }
        return ResponseEntity.ok(new UploadStatus("Successfully uploaded CSV file", true));
    }

    private LocalDate convertDateToLocalDate(Date date)
    {
        return LocalDate.ofInstant(date.toInstant(), java.time.ZoneId.systemDefault());
    }
}
