package com.app.budgetbuddy.controllers;


import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.domain.InvestmentTransaction;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.exceptions.DataException;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import com.app.budgetbuddy.services.*;
import com.app.budgetbuddy.workbench.converter.TransactionDTOConverter;
import com.app.budgetbuddy.workbench.converter.TransactionStreamConverter;
import com.app.budgetbuddy.workbench.converter.TransactionStreamToEntityConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidAccountManager;
import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.app.budgetbuddy.workbench.runner.PlaidInvestmentRunner;
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
    private PlaidInvestmentRunner plaidInvestmentRunner;
    private UserRepository userRepository;
    private AccountRepository accountRepository;

    @Autowired
    public PlaidController(PlaidLinkTokenProcessor plaidLinkTokenProcessor,
                           PlaidAccountManager plaidAccountManager,
                           PlaidLinkService plaidLinkService,
                           PlaidTransactionRunner plaidTransactionRunner,
                           PlaidCategoryManager plaidCategoryManager,
                           PlaidInvestmentRunner plaidInvestmentRunner,
                           UserRepository userRepository,
                           AccountRepository accountRepository) {
        this.plaidLinkTokenProcessor = plaidLinkTokenProcessor;
        this.plaidAccountManager = plaidAccountManager;
        this.plaidTransactionRunner = plaidTransactionRunner;
        this.plaidLinkService = plaidLinkService;
        this.plaidCategoryManager = plaidCategoryManager;
        this.plaidInvestmentRunner = plaidInvestmentRunner;
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
    }

    @GetMapping("/{userId}/plaid-links")
    public ResponseEntity<List<PlaidLinkEntity>> getUserPlaidLinks(@PathVariable Long userId)
    {
        try
        {
            return ResponseEntity.status(200).body(plaidLinkService.findPlaidLinkByUserID(userId));
        }catch(DataException ex){
            log.error("There was an error fetching the user plaid links: {}", ex.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/create_investment_link_token")
    public ResponseEntity<?> createInvestmentLinkToken(@RequestBody LinkTokenRequest request) throws IOException
    {
        Long userId = request.userId();
        if(userId == null)
        {
            return ResponseEntity.badRequest().body("Username cannot be empty");
        }
        String userIdAsString = String.valueOf(userId);
        LinkTokenCreateResponse linkTokenCreateResponse = plaidLinkTokenProcessor.createInvestmentLinkToken(userIdAsString).join();
        String linkToken = linkTokenCreateResponse.getLinkToken();
        log.info("Found Investment Link Token: {}", linkToken);
        return ResponseEntity.status(201).body(linkTokenCreateResponse);
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

    @GetMapping("/{userId}/investment-accounts")
    public ResponseEntity<List<AccountEntity>> getInvestmentAccountsByUserId(@PathVariable Long userId)
    {
        try
        {
            List<AccountEntity> investmentAccounts = accountRepository.findByUserId(userId)
                    .stream()
                    .filter(e -> e.getOfficialName().equalsIgnoreCase("Fidelity"))
                    .toList();
            return ResponseEntity.status(200).body(investmentAccounts);

        }catch(DataException ex){
            log.error("There was an error fetching the user investment accounts: {}", ex.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
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
            List<AccountsGetResponse> accountsResponse = plaidAccountManager.getAccountsForUser(userId);
            if(accountsResponse == null)
            {
                return ResponseEntity.status(500).body(new ArrayList<>());
            }
            List<AccountResponse> accountResponses = new ArrayList<>();
            for(AccountsGetResponse accountsGetResponse : accountsResponse)
            {
                Item item = accountsGetResponse.getItem();
                String itemId = item.getItemId();
                List<AccountBase> accountBaseList = accountsGetResponse.getAccounts();
                List<AccountResponse> accountResponseList = createAccountResponse(accountBaseList, itemId);
                accountResponses.addAll(accountResponseList);
            }
            return ResponseEntity.status(200).body(accountResponses);
        }catch(IOException e)
        {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    private List<AccountResponse> createAccountResponse(List<AccountBase> accountBaseList, String itemId)
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
                    return AccountResponse.builder()
                            .accountId(accountId)
                            .name(name)
                            .balance(balance)
                            .type(type)
                            .mask(mask)
                            .itemId(itemId)
                            .officialName(officialName)
                            .subtype(subtype)
                            .build();
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
        List<PlaidLinkEntity> plaidLink = plaidLinkService.findPlaidLinkByUserID(userID);
        Set<String> accessTokens = new HashSet<>();
        try
        {
            if(plaidLink.isEmpty())
            {
                return ResponseEntity.ok(null);
            }
            plaidLink.forEach(
                    plaidLinkEntity -> accessTokens.add(plaidLinkEntity.getAccessToken())
            );
            log.info("Access Token: {}", accessTokens);
            return ResponseEntity.ok(accessTokens);

        }catch(PlaidLinkException e)
        {
            log.error("There was an error fetching the plaid link access token: ", e);
            return ResponseEntity.internalServerError().build();
        }
    }

    @GetMapping("/{userId}/plaid-link")
    public ResponseEntity<List<PlaidLinkStatus>> checkPlaidLinkStatus(@PathVariable Long userId)
    {
        List<PlaidLinkEntity> plaidLinks = plaidLinkService.findPlaidLinkByUserID(userId);
        log.info("PlaidLink: " + plaidLinks);
        if(plaidLinks.isEmpty())
        {
            return ResponseEntity.ok(List.of());
        }
        try
        {
           List<PlaidLinkStatus> statuses = new ArrayList<>();
           for(PlaidLinkEntity plaidLink : plaidLinks)
           {
               Long plaidLinkId = plaidLink.getId();
               boolean requiresUpdate = plaidLink.isRequiresUpdate();
               if(requiresUpdate)
               {
                   log.info("Plaid Link Token requires update... marking plaid link token for update");
                   plaidLinkService.markPlaidAsNeedingUpdate(userId,plaidLinkId);
               }
               PlaidLinkStatus plaidLinkStatus = PlaidLinkStatus.builder()
                       .plaidLinkId(plaidLinkId)
                       .isLinked(true)
                       .requiresLinkUpdate(requiresUpdate)
                       .build();
               log.info("Plaid Link Status: {}", plaidLinkStatus);
               statuses.add(plaidLinkStatus);
           }
           return ResponseEntity.ok(statuses);
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

    @GetMapping("/{userId}/investment-transactions")
    public ResponseEntity<List<InvestmentTransactionEntity>> getUserInvestmentTransactions(@PathVariable Long userId,
                                                                                           @RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                                                           @RequestParam @NotNull @DateTimeFormat(iso= DateTimeFormat.ISO.DATE) LocalDate endDate)
    {
        try
        {
            List<InvestmentTransactionEntity> investmentTransactions = plaidInvestmentRunner.getUserInvestmentTransactions(userId, startDate, endDate);
            return ResponseEntity.status(200).body(investmentTransactions);
        }catch(DataException ex){
            log.error("There was an error fetching the user investment transactions: {}", ex.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @GetMapping("/{userId}/investment-holdings")
    public ResponseEntity<List<InvestmentHoldingsEntity>> getUserInvestmentHoldings(@PathVariable Long userId)
    {
        try
        {
            List<InvestmentHoldingsEntity> investmentHoldings = plaidInvestmentRunner.getUserInvestmentHoldings(userId);
            return ResponseEntity.status(200).body(investmentHoldings);
        }catch(DataException ex){
            log.error("There was an error fetching the user investment holdings: {}", ex.getMessage());
            return new ResponseEntity<>(HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    @PostMapping("/{userId}/import-investments-transactions")
    public ResponseEntity<PlaidImportResult> importPlaidInvestmentTransactions(@PathVariable Long userId,
                                                                               @RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate startDate,
                                                                               @RequestParam @NotNull @DateTimeFormat(iso=DateTimeFormat.ISO.DATE) LocalDate endDate)
    {
        log.info("Importing investment transactions for user {} between {} and {}", userId, startDate, endDate);
        try
        {
            List<InvestmentTransaction> importedInvestments = plaidInvestmentRunner.getInvestmentTransactionsResponse(userId, startDate, endDate);
            log.info("Successfully imported {} investment transactions for user {} between {} and {}", importedInvestments.size(), userId, startDate, endDate);
            List<InvestmentTransactionEntity> investmentTransactionEntities = plaidInvestmentRunner.saveInvestments(importedInvestments);
            return ResponseEntity.ok(new PlaidImportResult(userId, List.of(), List.of(), investmentTransactionEntities));
        }catch(DataException ex){
            log.error("There was an error importing investment transactions: ", ex);
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/{userId}/import-investment-holdings")
    public ResponseEntity<List<InvestmentHoldingsEntity>> importPlaidInvestmentHoldings(@PathVariable Long userId)
    {
        log.info("Importing investment holdings for user {} ", userId);
        try
        {
            List<InvestmentHoldings> importedHoldings = plaidInvestmentRunner.getInvestmentHoldingsResponse(userId);
            log.info("Successfully imported {} investment holdings for user {} ", importedHoldings.size(), userId);
            List<InvestmentHoldingsEntity> investmentHoldingsEntities = plaidInvestmentRunner.saveInvestmentHoldings(importedHoldings);
            return ResponseEntity.ok(investmentHoldingsEntities);
        }catch(DataException ex){
            log.error("There was an error importing investment holdings: ", ex);
            return ResponseEntity.internalServerError().build();
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
