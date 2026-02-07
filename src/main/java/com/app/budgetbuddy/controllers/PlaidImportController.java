package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.workbench.TransactionImportService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping(value="/api/plaid-import")
@CrossOrigin(value="http://localhost:3000")
@Slf4j
public class PlaidImportController
{
    private final TransactionImportService plaidTransactionImportService;

    @Autowired
    public PlaidImportController(TransactionImportService plaidTransactionImportService)
    {
        this.plaidTransactionImportService = plaidTransactionImportService;
    }

//    @PostMapping("/{userId}/import")
//    public ResponseEntity<List<BudgetCategory>> importPlaidTransactions(@PathVariable Long userId,
//                                                                        @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
//                                                                        @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate){
//        try
//        {
//            List<BudgetCategory> result = plaidTransactionImportService.runTransactionImportForPeriod(userId, startDate, endDate);
//            if(result.isEmpty())
//            {
//                log.debug("No Budget Categories were created for startdate {} and enddate {}", startDate, endDate);
//                return ResponseEntity.ok(result);
//            }
//            return ResponseEntity.ok(result);
//
//        }catch(PlaidImportException | IOException e)
//        {
//            log.error("There was an error importing the plaid transactions: ", e);
//            return ResponseEntity.internalServerError().build();
//        }
//
//    }

}
