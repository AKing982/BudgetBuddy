package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.BudgetRunnerResult;
import com.app.budgetbuddy.workbench.runner.BudgetRunner;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping(value="/api/budgetRunner")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class BudgetRunnerController
{
   private final BudgetRunner budgetRunner;

   @Autowired
   public BudgetRunnerController(BudgetRunner budgetRunner)
   {
       this.budgetRunner = budgetRunner;
   }

   @GetMapping("/period")
   public ResponseEntity<List<BudgetRunnerResult>> getBudgetsByDateRange(@RequestParam Long userId,
                                                                         @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                                         @RequestParam @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate endDate){
       try
       {
           List<BudgetRunnerResult> results = budgetRunner.runBudgetProcess(userId, startDate, endDate);
           return new ResponseEntity<>(results, HttpStatus.OK);

       }catch(Exception e){
           log.error("Error retrieving budget data for user {} between {} and {}", userId, startDate, endDate, e);
           return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
       }
   }

}
