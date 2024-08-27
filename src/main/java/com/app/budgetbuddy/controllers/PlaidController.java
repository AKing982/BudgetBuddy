package com.app.budgetbuddy.controllers;

import com.app.budgetbuddy.domain.ExchangePublicTokenDTO;
import com.app.budgetbuddy.domain.ExchangeResponse;
import com.app.budgetbuddy.domain.PlaidLinkRequest;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.PlaidService;
import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import com.plaid.client.model.ItemPublicTokenExchangeResponse;
import com.plaid.client.model.LinkTokenCreateResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping(value="/api/plaid")
@CrossOrigin(origins="http://localhost:3000")
public class PlaidController {

    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;
    private PlaidLinkService plaidLinkService;
    private Logger LOGGER = LoggerFactory.getLogger(PlaidController.class);

    @Autowired
    public PlaidController(PlaidLinkTokenProcessor plaidLinkTokenProcessor,
                           PlaidLinkService plaidLinkService) {
        this.plaidLinkTokenProcessor = plaidLinkTokenProcessor;
        this.plaidLinkService = plaidLinkService;
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
        return null;
    }

    @PostMapping("/exchange_public_token")
    public ResponseEntity<?> exchangePublicToken(@RequestBody Map<Long, String> exchangePublicTokenMap) throws IOException, InterruptedException {
        LOGGER.info("Exchange Public Token Map: {}", exchangePublicTokenMap.values());
        if(exchangePublicTokenMap.isEmpty()){
            return ResponseEntity.badRequest().body("Exchange Public Token Map is empty");
        }

        Map.Entry<Long, String> entry = exchangePublicTokenMap.entrySet().iterator().next();
        String publicToken = entry.getValue();
        if(publicToken == null || publicToken.isEmpty()){
            return ResponseEntity.badRequest().body("Exchange Public Token Map is empty");
        }

        ItemPublicTokenExchangeResponse exchangePublicTokenResponse = plaidLinkTokenProcessor.exchangePublicToken(publicToken);
        String accessToken = exchangePublicTokenResponse.getAccessToken();
        String itemId = exchangePublicTokenResponse.getItemId();
        Long userID = entry.getKey();
        LOGGER.info("Access Token: {}", accessToken);
        LOGGER.info("Item ID: {}", itemId);
        if(accessToken == null || accessToken.isEmpty()){
            return ResponseEntity.notFound().build();
        }

        ExchangeResponse exchangeResponse = createExchangeResponse(accessToken, itemId, userID);
        return ResponseEntity.ok(exchangeResponse);
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
            Long userID = plaidLinkRequest.userID();
            createAndSavePlaidLink(accessToken, itemId, userID);
            return ResponseEntity.status(HttpStatus.CREATED).build();

        }catch(PlaidLinkException e)
        {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@RequestParam Long userId,
                                             @RequestParam LocalDate startDate,
                                             @RequestParam LocalDate endDate){
        return null;
    }

    @GetMapping("/transactions/filtered")
    public ResponseEntity<?> getFilteredTransactions(@RequestParam Long userId,
                                                                                @RequestParam LocalDate startDate,
                                                                                @RequestParam LocalDate endDate,
                                                                                @RequestParam int pageCount){
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
