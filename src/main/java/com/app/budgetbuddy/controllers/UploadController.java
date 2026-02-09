package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.AccountCSV;
import com.app.budgetbuddy.domain.Locations;
import com.app.budgetbuddy.domain.TransactionCSV;
import com.app.budgetbuddy.domain.UploadStatus;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CSVAccountEntity;
import com.app.budgetbuddy.entities.CSVTransactionEntity;
import com.app.budgetbuddy.exceptions.CSVUploadException;
import com.app.budgetbuddy.repositories.CSVAccountRepository;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.runner.CSVUploadRunner;
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
    private final CSVUploadRunner csvUploadRunner;

    @Autowired
    public UploadController(CSVUploadRunner csvUploadRunner)
    {
        this.csvUploadRunner = csvUploadRunner;
    }

//    @GetMapping("/{userId}/byDates")
//    public ResponseEntity<Boolean> checkIfTransactionsExistByDateRanges(@PathVariable Long userId,
//                                                                        @RequestParam("startDate") LocalDate startDate,
//                                                                        @RequestParam("endDate") LocalDate endDate)
//    {
//        if(userId < 1L || startDate == null || endDate == null)
//        {
//            return ResponseEntity.badRequest().build();
//        }
//        int pageNum = 30;
//        List<TransactionCSV> transactionCSVS = csvTransactionService.findTransactionCSVByUserIdAndDateRange(userId, startDate, endDate, pageNum);
//        System.out.println(transactionCSVS.size());
//        if(transactionCSVS.isEmpty())
//        {
//            log.info("No transactions exist for user {} between {} and {}", userId, startDate, endDate);
//            return ResponseEntity.ok(false);
//        }
//        log.info("Transactions exist for user {} between {} and {}", userId, startDate, endDate);
//        return ResponseEntity.ok(true);
//    }

    @PostMapping("/{userId}/csv")
    public ResponseEntity<UploadStatus> uploadCSV(@PathVariable Long userId,
                                                  @RequestParam("startDate") LocalDate startDate,
                                                  @RequestParam("endDate") LocalDate endDate,
                                                  @RequestParam("institution") String institution,
                                                  @RequestParam("file") MultipartFile file)
    {
        if(file.isEmpty())
        {
            log.error("No file was uploaded");
            return ResponseEntity.badRequest().body(new UploadStatus("No File was uploaded", false));
        }
        if(institution == null || institution.isEmpty())
        {
            return ResponseEntity.badRequest().body(new UploadStatus("No institution selected", false));
        }
        try
        {
            boolean hasUploaded = csvUploadRunner.parseCSV(file, institution, startDate, endDate, userId);
            if(hasUploaded)
            {
                return ResponseEntity.ok(new UploadStatus("CSV file has successfully uploaded", true));
            }
            return ResponseEntity.ok(new UploadStatus("CSV file has not been uploaded", false));
        }catch(CSVUploadException ex){
            return ResponseEntity.internalServerError().body(new UploadStatus(ex.getMessage(), false));
        }
    }
}
