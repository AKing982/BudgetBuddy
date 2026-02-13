package com.app.budgetbuddy.controllers;


import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.repositories.UserRepository;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.converter.TransactionDTOConverter;
import com.app.budgetbuddy.workbench.converter.TransactionStreamConverter;
import com.app.budgetbuddy.workbench.converter.TransactionStreamToEntityConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidAccountManager;
import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.app.budgetbuddy.workbench.runner.PlaidTransactionRunner;
import com.plaid.client.model.*;
import com.plaid.client.model.Transaction;
import lombok.extern.slf4j.Slf4j;
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
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping(value="/api/plaid")
@CrossOrigin(origins="http://localhost:3000")
@Slf4j
public class PlaidController
{
    private PlaidLinkTokenProcessor plaidLinkTokenProcessor;
    private PlaidLinkService plaidLinkService;
    private PlaidAccountManager plaidAccountManager;
    private PlaidTransactionRunner plaidTransactionRunner;
    private PlaidCategoryManager plaidCategoryManager;
    private UserRepository userRepository;

    @Autowired
    public PlaidController(PlaidLinkTokenProcessor plaidLinkTokenProcessor,
                           PlaidAccountManager plaidAccountManager,
                           PlaidLinkService plaidLinkService,
                           PlaidTransactionRunner plaidTransactionRunner,
                           PlaidCategoryManager plaidCategoryManager,
                           UserRepository userRepository) {
        this.plaidLinkTokenProcessor = plaidLinkTokenProcessor;
        this.plaidAccountManager = plaidAccountManager;
        this.plaidTransactionRunner = plaidTransactionRunner;
        this.plaidLinkService = plaidLinkService;
        this.plaidCategoryManager = plaidCategoryManager;
        this.userRepository = userRepository;
    }

    @GetMapping("/{id}/logo")
    public ResponseEntity<?> getTransactionLogo(@PathVariable String id,
                                                @RequestParam String logoUrl)
    {
        try
        {

        }catch(Exception ex){
            log.error("There was an error fetching the transaction logo: {}", ex.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
        return null;
    }

    @GetMapping("/categories")
    public ResponseEntity<List<PlaidCategory>> getCategories()
    {
        try
        {
            List<PlaidCategory> plaidCategories = plaidCategoryManager.getPlaidCategories();
            return new ResponseEntity<>(plaidCategories, HttpStatus.OK);
        }catch(Exception ex){
            log.error("There was an error fetching the plaid categories: {}", ex.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/create_link_token")
    public ResponseEntity<?> createLinkToken(@RequestBody LinkTokenRequest request) throws IOException
    {
        Long userId = request.userId();
        if(userId == null)
        {
            return ResponseEntity.badRequest().body("Username cannot be empty");
        }
        String userIdAsString = String.valueOf(userId);
        LinkTokenCreateResponse linkTokenCreateResponse = plaidLinkTokenProcessor.createLinkToken(userIdAsString).join();
        String linkToken = linkTokenCreateResponse.getLinkToken();
        log.info("Found Link Token: {}", linkToken);
        return ResponseEntity.status(201).body(linkTokenCreateResponse);
    }

    @GetMapping("/users/{userId}/accounts")
    public ResponseEntity<?> getUserAccounts(@PathVariable Long userId)
    {
        if(userId < 1)
        {
            return ResponseEntity.badRequest().body("UserId is invalid: " + userId);
        }
        Optional<UserEntity> userEntity = userRepository.findById(userId);
        if(userEntity.isEmpty())
        {
            return ResponseEntity.notFound().build();
        }
        try
        {
            AccountsGetResponse accountsResponse = plaidAccountManager.getAccountsForUser(userId);
            if(accountsResponse == null)
            {
                return ResponseEntity.status(500).body(new ArrayList<>());
            }
            List<AccountResponse> accountResponseList = createAccountResponse(accountsResponse.getAccounts());
            return ResponseEntity.status(200).body(accountResponseList);

        }catch(IOException e)
        {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    private List<AccountResponse> createAccountResponse(List<AccountBase> accountBaseList)
    {
        return accountBaseList.stream()
                .filter(Objects::nonNull)
                .map(accountBase -> {
                    String accountId = accountBase.getAccountId();
                    String name = accountBase.getName();
                    BigDecimal balance = BigDecimal.valueOf(accountBase.getBalances().getCurrent());
                    String type = String.valueOf(accountBase.getType());
                    String subtype = String.valueOf(accountBase.getSubtype());
                    String mask = accountBase.getMask();
                    String officialName = accountBase.getOfficialName();
                    return new AccountResponse(accountId, name, balance, type, mask, officialName, subtype);
                })
                .toList();
    }

    private List<AccountResponse> createAccountResponseFromAccounts(List<AccountEntity> accounts)
    {
        return accounts.stream()
                .filter(Objects::nonNull)
                .map(account -> {
                    String accountId = account.getId();
                    String name = account.getAccountName();
                    BigDecimal balance = account.getBalance();
                    String type = String.valueOf(account.getType());
                    String subtype = String.valueOf(account.getSubtype());
                    String mask = account.getMask();
                    String officialName = account.getOfficialName();
                    return new AccountResponse(accountId, name, balance, type, mask, officialName, subtype);
                })
                .toList();
    }

    @PostMapping("/exchange_public_token")
    public ResponseEntity<?> exchangePublicToken(@RequestBody PlaidExchangeRequest exchangeRequest) throws IOException, InterruptedException {

        Long userID = exchangeRequest.getUserId();
        String publicToken = exchangeRequest.getPublicToken();
        try
        {
            if(publicToken == null || publicToken.isEmpty())
            {
                return ResponseEntity.badRequest().body("Exchange Public Token Map is empty");
            }
            ItemPublicTokenExchangeResponse exchangePublicTokenResponse = plaidLinkTokenProcessor.exchangePublicToken(publicToken).join();
            String accessToken = exchangePublicTokenResponse.getAccessToken();
            String itemId = exchangePublicTokenResponse.getItemId();
            log.info("Access Token: {}", accessToken);
            log.info("Item ID: {}", itemId);
            if(accessToken == null || accessToken.isEmpty())
            {
                return ResponseEntity.notFound().build();
            }
            ExchangeResponse exchangeResponse = createExchangeResponse(accessToken, itemId, userID);
            return ResponseEntity.ok(exchangeResponse);
        }catch(PlaidApiException e)
        {
            log.error("There was an error exchanging the public token: ", e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @GetMapping("/users/{userId}/recurring-transactions")
    public ResponseEntity<?> getRecurringTransactions(@PathVariable Long userId)
    {
        if(userId < 1)
        {
            return ResponseEntity.badRequest().body("UserId is invalid: " + userId);
        }
        List<RecurringTransaction> transactionsRecurringGetResponse = plaidTransactionRunner.getRecurringTransactionsResponse(userId);
        return ResponseEntity.status(200).body(transactionsRecurringGetResponse);

    }

    @GetMapping("/{userID}/access-token")
    public ResponseEntity<?> getAccessToken(@PathVariable Long userID)
    {
        Optional<PlaidLinkEntity> plaidLink = plaidLinkService.findPlaidLinkByUserID(userID);
        try
        {
            if(plaidLink.isEmpty())
            {
                return ResponseEntity.ok(null);
            }
            PlaidLinkEntity plaidLinkEntity = plaidLink.get();
            String accessToken = plaidLinkEntity.getAccessToken();
            log.info("Access Token: {}", accessToken);
            return ResponseEntity.ok(accessToken);

        }catch(PlaidLinkException e)
        {
            log.error("There was an error fetching the plaid link access token: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/plaid-link")
    public ResponseEntity<PlaidLinkStatus> checkPlaidLinkStatus(@PathVariable Long userId)
    {
        Optional<PlaidLinkEntity> plaidLink = plaidLinkService.findPlaidLinkByUserID(userId);
        log.info("PlaidLink: " + plaidLink);
        try
        {
            boolean isLinked = plaidLink.isPresent();
            if(!isLinked)
            {
                PlaidLinkStatus unlinkedStatus = new PlaidLinkStatus(false, false);
                return ResponseEntity.ok(unlinkedStatus);
            }
            PlaidLinkEntity plaidLinkEntity = plaidLink.get();
            boolean requiresUpdate = plaidLinkEntity.isRequiresUpdate();
            if(requiresUpdate) {
                log.info("Plaid Link Token requires update... marking plaid link token for update");
                plaidLinkService.markPlaidAsNeedingUpdate(userId);
            }
            PlaidLinkStatus status = new PlaidLinkStatus(isLinked, requiresUpdate);
            log.info("Plaid Link Status: {}", status);
            return ResponseEntity.ok(status);
        }catch(PlaidLinkException e){
            log.error("There was an error fetching the Plaid Link Status: ", e);
            return ResponseEntity.internalServerError().build();
        }

    }

    @PostMapping("/link")
    public ResponseEntity<?> savePlaidLink(@RequestBody PlaidLinkRequest plaidLinkRequest) {

        if(plaidLinkRequest == null)
        {
            return ResponseEntity.badRequest().body("Plaid Link Request is null");
        }
        log.info("Access Token: {}", plaidLinkRequest.accessToken());
        log.info("ItemID: {}", plaidLinkRequest.itemID());
        log.info("UserID: {}", plaidLinkRequest.userID());

        String accessToken = plaidLinkRequest.accessToken();

        if(accessToken == null || accessToken.isEmpty())
        {
            return ResponseEntity.badRequest().body("Plaid Access Token is invalid");
        }

        try
        {
            String itemId = plaidLinkRequest.itemID();
            String userID = plaidLinkRequest.userID();
            String institution = plaidLinkTokenProcessor.getInstitutionName(accessToken).join();
            Long uID = Long.parseLong(userID);
            createAndSavePlaidLink(accessToken, institution, itemId, uID);
            return ResponseEntity.status(HttpStatus.CREATED).build();

        } catch(PlaidLinkException e)
        {
            return ResponseEntity.internalServerError().body(e.getMessage());
        } catch (IOException e) {
            throw new RuntimeException(e);
        }
    }

    @GetMapping("/transactions")
    public ResponseEntity<?> getTransactions(@RequestParam Long userId,
                                             @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
                                             @RequestParam @NotNull @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        if(userId < 1)
        {
            return ResponseEntity.badRequest().body("UserId is invalid: " + userId);
        }
        Optional<UserEntity> userEntityOptional = userRepository.findById(userId);
        if(userEntityOptional.isEmpty())
        {
            return ResponseEntity.notFound().build();
        }

        try
        {
            List<com.app.budgetbuddy.domain.Transaction> transactions = plaidTransactionRunner.getTransactionsResponse(userId, startDate, endDate);
            return ResponseEntity.status(200).body(transactions);

        } catch (IOException e)
        {
            log.error("There was an error getting the transactions", e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/update_link_token")
    public ResponseEntity<?> updatePlaidLinkToken(@RequestBody PlaidUpdateRequest plaidUpdateRequest)
    {
        Long userId = plaidUpdateRequest.userId();
        String accessToken = plaidUpdateRequest.accessToken();

        if(userId == null || userId < 1 || accessToken == null || accessToken.isEmpty())
        {
            return ResponseEntity.badRequest().body("Invalid request: User ID and Access Token are required.");
        }

        try
        {
            // Call service to get the update token
            LinkTokenCreateResponse linkTokenResponse = plaidLinkTokenProcessor.createUpdateLinkToken(userId, accessToken).join();
            if(linkTokenResponse == null || linkTokenResponse.getLinkToken() == null)
            {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Failed to create update link token.");
            }
            String newAccessToken = linkTokenResponse.getLinkToken();
            plaidLinkService.markPlaidAsUpdated(userId, accessToken, newAccessToken);
            log.info("Marked Plaid as updated");

            return ResponseEntity.ok(new PlaidLinkTokenResponse(linkTokenResponse.getLinkToken()));
        } catch (IOException e)
        {
            log.error("Error creating update link token for user {}: {}", userId, e.getMessage());
            return ResponseEntity.internalServerError().body("Plaid API error: " + e.getMessage());
        }
    }

    @PostMapping("/transactions/{userId}/sync")
    public ResponseEntity<?> syncTransactions(@PathVariable Long userId) throws IOException {
        if(userId < 1L)
        {
            return ResponseEntity.badRequest().build();
        }
        boolean userExists = userRepository.existsById(userId);
        if(!userExists)
        {
            return ResponseEntity.notFound().build();
        }
        try
        {
            List<com.app.budgetbuddy.domain.Transaction> syncResponse = plaidTransactionRunner.syncTransactions(userId);
            return ResponseEntity.ok(syncResponse);
        }catch(IOException e){
            log.error("There was an error syncing the transactions for user: {}", userId, e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/save-accounts")
    public ResponseEntity<?> saveAccounts(@RequestBody PlaidAccountRequest plaidAccountRequest)
    {
        Long userId = plaidAccountRequest.userId();
        List<PlaidAccount> accounts = plaidAccountRequest.accounts();
        if(userId < 1){
            return ResponseEntity.badRequest().body("UserId is invalid: " + userId);
        }
        if(accounts.isEmpty()){
            return ResponseEntity.notFound().build();
        }
        try
        {
            List<AccountEntity> accountEntities = plaidAccountManager.savePlaidAccountsToDatabase(accounts, userId);
            List<AccountResponse> accountResponses = createAccountResponseFromAccounts(accountEntities);
            return ResponseEntity.status(200).body(accountResponses);

        }catch(Exception e)
        {
            log.error("There was an error saving accounts: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    private ExchangeResponse createExchangeResponse(String accessToken, String itemID, Long userID){
        return new ExchangeResponse(accessToken, itemID, userID);
    }

    private void createAndSavePlaidLink(String accessToken, String institution, String itemID, Long userID){
        Optional<PlaidLinkEntity> plaidLink = plaidLinkService.createPlaidLink(accessToken, institution, itemID, userID);
        if(plaidLink.isEmpty())
        {
            throw new PlaidLinkException("Plaid Link Not Found");
        }

        PlaidLinkEntity plaidLinkEntity = plaidLink.get();
        plaidLinkService.save(plaidLinkEntity);
    }



}
