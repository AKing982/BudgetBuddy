package com.app.budgetbuddy.controllers;


import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.PlaidService;
import com.app.budgetbuddy.workbench.plaid.PlaidAccountManager;
import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.*;
import org.jetbrains.annotations.NotNull;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import retrofit2.Response;

import java.io.IOException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping(value="/api/plaid")
@CrossOrigin(origins="http://localhost:3000")
public class PlaidController {

    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;
    private PlaidLinkService plaidLinkService;
    private PlaidAccountManager plaidAccountManager;
    private PlaidTransactionManager plaidTransactionManager;
    private Logger LOGGER = LoggerFactory.getLogger(PlaidController.class);

    @Autowired
    public PlaidController(PlaidLinkTokenProcessor plaidLinkTokenProcessor,
                           PlaidAccountManager plaidAccountManager,
                           PlaidLinkService plaidLinkService,
                           PlaidTransactionManager plaidTransactionManager) {
        this.plaidLinkTokenProcessor = plaidLinkTokenProcessor;
        this.plaidAccountManager = plaidAccountManager;
        this.plaidLinkService = plaidLinkService;
        this.plaidTransactionManager = plaidTransactionManager;
    }

    @PostMapping("/create_link_token")
    public ResponseEntity<?> createLinkToken(@RequestBody String userId) throws IOException {
        if(userId.isEmpty()){
            return ResponseEntity.badRequest().body("Username cannot be empty");
        }

        LinkTokenCreateResponse linkTokenCreateResponse = plaidLinkTokenProcessor.createLinkToken(userId);
        String linkToken = linkTokenCreateResponse.getLinkToken();
        LOGGER.info("Found Link Token: {}", linkToken);
        return ResponseEntity.status(201).body(linkTokenCreateResponse);
    }

    @GetMapping("/accounts")
    public ResponseEntity<?> getAllAccounts(@RequestParam Long userId){
        if(userId < 1){
            return ResponseEntity.badRequest().body("UserId is invalid: " + userId);
        }
        try
        {
            AccountsGetResponse accountsResponse = plaidAccountManager.getAccountsForUser(userId);
            return ResponseEntity.status(200).body(accountsResponse);

        }catch(IOException e)
        {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/exchange_public_token")
    public ResponseEntity<?> exchangePublicToken(@RequestBody PlaidExchangeRequest exchangeRequest) throws IOException, InterruptedException {

        Long userID = exchangeRequest.getUserId();
        String publicToken = exchangeRequest.getPublicToken();

        if(publicToken == null || publicToken.isEmpty()){
            return ResponseEntity.badRequest().body("Exchange Public Token Map is empty");
        }

        ItemPublicTokenExchangeResponse exchangePublicTokenResponse = plaidLinkTokenProcessor.exchangePublicToken(publicToken);
        String accessToken = exchangePublicTokenResponse.getAccessToken();
        String itemId = exchangePublicTokenResponse.getItemId();
        LOGGER.info("Access Token: {}", accessToken);
        LOGGER.info("Item ID: {}", itemId);
        if(accessToken == null || accessToken.isEmpty()){
            return ResponseEntity.notFound().build();
        }

        ExchangeResponse exchangeResponse = createExchangeResponse(accessToken, itemId, userID);
        return ResponseEntity.ok(exchangeResponse);
    }

    @GetMapping("/{userId}/plaid-link")
    public ResponseEntity<PlaidLinkStatus> checkPlaidLinkStatus(@PathVariable Long userId){
        Optional<PlaidLinkEntity> plaidLink = plaidLinkService.findPlaidLinkByUserID(userId);
        LOGGER.info("PlaidLink: " + plaidLink);
        if(plaidLink.isPresent()){
            PlaidLinkStatus plaidLinkStatus = new PlaidLinkStatus(true);
            return ResponseEntity.ok(plaidLinkStatus);
        }
        return ResponseEntity.ok(new PlaidLinkStatus(false));
    }

    @PostMapping("/link")
    public ResponseEntity<?> savePlaidLink(@RequestBody PlaidLinkRequest plaidLinkRequest){

        if(plaidLinkRequest == null){
            return ResponseEntity.badRequest().body("Plaid Link Request is null");
        }

        LOGGER.info("Access Token: {}", plaidLinkRequest.accessToken());
        LOGGER.info("ItemID: {}", plaidLinkRequest.itemID());
        LOGGER.info("UserID: {}", plaidLinkRequest.userID());

        String accessToken = plaidLinkRequest.accessToken();
        if(accessToken == null || accessToken.isEmpty()){
            return ResponseEntity.badRequest().body("Plaid Access Token is invalid");
        }

        try
        {
            String itemId = plaidLinkRequest.itemID();
            String userID = plaidLinkRequest.userID();
            Long uID = Long.parseLong(userID);
            createAndSavePlaidLink(accessToken, itemId, uID);
            return ResponseEntity.status(HttpStatus.CREATED).build();

        }catch(PlaidLinkException e)
        {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@RequestParam Long userId,
                                             @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                             @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate){
        if(userId < 1){
            return ResponseEntity.badRequest().body("UserId is invalid: " + userId);
        }
        try
        {
            TransactionsGetResponse transactionsGetResponse = plaidTransactionManager.getTransactionsForUser(userId, startDate, endDate);
            return ResponseEntity.status(200).body(transactionsGetResponse);

        }catch(IOException e)
        {
            LOGGER.error("There was an error getting the transactions", e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/transactions/filtered")
    public ResponseEntity<?> getFilteredTransactions(@RequestParam Long userId,
                                                                                @RequestParam LocalDate startDate,
                                                                                @RequestParam LocalDate endDate,
                                                                                @RequestParam int pageCount){
        return null;
    }

    @PostMapping("/save-transactions")
    public ResponseEntity<?> saveTransactions(@RequestBody TransactionRequest transactionRequest) throws IOException {
        LOGGER.info("TransactionRequest: {}", transactionRequest);
        if(transactionRequest == null){
            return ResponseEntity.badRequest().body("Transaction Request is null");
        }
        List<Transaction> transactions = transactionRequest.getTransactions();
        List<TransactionsEntity> savedTransactions = plaidTransactionManager.saveTransactionsToDatabase(transactions);
        return ResponseEntity.status(200).body(savedTransactions);
    }

    @PostMapping("/save-accounts")
    public ResponseEntity<?> saveAccounts(@RequestParam Long userId){
        return null;
    }

    @GetMapping("/balances")
    public ResponseEntity<?> getBalances(@RequestParam Long userId){
        return null;
    }

    private ExchangeResponse createExchangeResponse(String accessToken, String itemID, Long userID){
        return new ExchangeResponse(accessToken, itemID, userID);
    }

    private void createAndSavePlaidLink(String accessToken, String itemID, Long userID){
        Optional<PlaidLinkEntity> plaidLink = plaidLinkService.createPlaidLink(accessToken, itemID, userID);
        if(plaidLink.isEmpty())
        {
            throw new PlaidLinkException("Plaid Link Not Found");
        }

        PlaidLinkEntity plaidLinkEntity = plaidLink.get();
        plaidLinkService.save(plaidLinkEntity);
    }



}
