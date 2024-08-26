package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.ExchangePublicTokenDTO;
import com.app.budgetbuddy.services.PlaidService;
import com.plaid.client.model.LinkTokenCreateRequest;
import com.plaid.client.model.LinkTokenCreateResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping(value="/api/plaid")
@CrossOrigin(origins="http://localhost:3000")
public class PlaidController {

    private PlaidService plaidService;

    @Autowired
    public PlaidController(PlaidService plaidService) {
        this.plaidService = plaidService;
    }

    @PostMapping("/create_link_token")
    public ResponseEntity<?> createLinkToken(@RequestBody LinkTokenCreateRequest linkTokenCreateRequest){
        return null;
    }

    @GetMapping("/accounts")
    public ResponseEntity<?> getAllAccounts(@RequestParam Long userId){
        return null;
    }

    @PostMapping("/exchange_public_token")
    public ResponseEntity<?> exchangePublicToken(@RequestBody ExchangePublicTokenDTO exchangePublicTokenDTO){
        return null;
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@RequestParam Long userId,
                                             @RequestParam LocalDate startDate,
                                             @RequestParam LocalDate endDate){
        return null;
    }

    @GetMapping("/balances")
    public ResponseEntity<?> getBalances(@RequestParam Long userId){
        return null;
    }



}
