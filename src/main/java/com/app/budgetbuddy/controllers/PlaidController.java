package com.app.budgetbuddy.controllers;


import com.app.budgetbuddy.domain.*;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.PlaidService;
import com.app.budgetbuddy.services.RecurringTransactionService;
import com.app.budgetbuddy.workbench.converter.TransactionDTOConverter;
import com.app.budgetbuddy.workbench.converter.TransactionStreamConverter;
import com.app.budgetbuddy.workbench.converter.TransactionStreamToEntityConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidAccountManager;
import com.app.budgetbuddy.workbench.plaid.PlaidLinkTokenProcessor;
import com.app.budgetbuddy.workbench.plaid.PlaidTransactionManager;
import com.plaid.client.model.*;
import com.plaid.client.model.Transaction;
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
    private TransactionDTOConverter transactionDTOConverter;
    private RecurringTransactionService recurringTransactionService;
    private Logger LOGGER = LoggerFactory.getLogger(PlaidController.class);

    @Autowired
    public PlaidController(PlaidLinkTokenProcessor plaidLinkTokenProcessor,
                           PlaidAccountManager plaidAccountManager,
                           PlaidLinkService plaidLinkService,
                           PlaidTransactionManager plaidTransactionManager,
                           TransactionDTOConverter transactionDTOConverter,
                           RecurringTransactionService recurringTransactionService) {
        this.plaidLinkTokenProcessor = plaidLinkTokenProcessor;
        this.plaidAccountManager = plaidAccountManager;
        this.plaidLinkService = plaidLinkService;
        this.plaidTransactionManager = plaidTransactionManager;
        this.transactionDTOConverter = transactionDTOConverter;
        this.recurringTransactionService = recurringTransactionService;
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

    @GetMapping("/users/{userId}/accounts")
    public ResponseEntity<?> getUserAccounts(@PathVariable Long userId){
        if(userId < 1){
            return ResponseEntity.badRequest().body("UserId is invalid: " + userId);
        }
        try
        {
            AccountsGetResponse accountsResponse = plaidAccountManager.getAccountsForUser(userId);
            if(accountsResponse == null){
                return ResponseEntity.status(200).body(new ArrayList<>());
            }
            if(accountsResponse.getAccounts().isEmpty()){
                return ResponseEntity.badRequest().body("No accounts found for user: " + userId);
            }
            List<AccountResponse> accountResponseList = createAccountResponse(accountsResponse.getAccounts());
            return ResponseEntity.status(200).body(accountResponseList);

        }catch(IOException e)
        {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    private List<AccountResponse> createAccountResponse(List<AccountBase> accountBaseList){
        List<AccountResponse> accountResponseList = new ArrayList<>();
        for(AccountBase accountBase: accountBaseList){
            if(accountBase != null){
                String accountId = accountBase.getAccountId();
                String name = accountBase.getName();
                BigDecimal balance = BigDecimal.valueOf(accountBase.getBalances().getCurrent());
                String type = String.valueOf(accountBase.getType());
                String subtype = String.valueOf(accountBase.getSubtype());
                String mask = accountBase.getMask();
                String officialName = accountBase.getOfficialName();
                AccountResponse accountResponse = new AccountResponse(accountId, name, balance, type,mask, officialName, subtype);
                accountResponseList.add(accountResponse);
            }
        }
        return accountResponseList;
    }

    private List<AccountResponse> createAccountResponseFromAccounts(List<AccountEntity> accounts){
        List<AccountResponse> accountResponseList = new ArrayList<>();
        for(AccountEntity account: accounts){
            if(account != null){
                String accountId = account.getId();
                String name = account.getAccountName();
                BigDecimal balance = account.getBalance();
                String type = String.valueOf(account.getType());
                String subtype = String.valueOf(account.getSubtype());
                String mask = account.getMask();
                String officialName = account.getOfficialName();
                AccountResponse accountResponse = new AccountResponse(accountId, name, balance, type,mask, officialName, subtype);
                accountResponseList.add(accountResponse);
            }
        }
        return accountResponseList;
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

    @GetMapping("/users/{userId}/recurring-transactions")
    public ResponseEntity<?> getRecurringTransactions(@PathVariable Long userId){
        if(userId < 1){
            return ResponseEntity.badRequest().body("UserId is invalid: " + userId);
        }
        try
        {
            TransactionsRecurringGetResponse transactionsRecurringGetResponse = plaidTransactionManager.getRecurringTransactionsForUser(userId);
            if(transactionsRecurringGetResponse == null){
                return ResponseEntity.status(200).body(new ArrayList<>());
            }
            List<TransactionStream> outFlowingStream = transactionsRecurringGetResponse.getOutflowStreams();
            List<TransactionStream> inFlowingStream = transactionsRecurringGetResponse.getInflowStreams();
            if((outFlowingStream == null || outFlowingStream.isEmpty()) || (inFlowingStream == null || inFlowingStream.isEmpty())){
                return ResponseEntity.status(200).body(new ArrayList<>());
            }
            RecurringTransactionResponse recurringTransactionResponse = createRecurringTransactionResponse(inFlowingStream, outFlowingStream);
            return ResponseEntity.status(200).body(recurringTransactionResponse);

        }catch(IOException e)
        {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
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
        LOGGER.info("UserId: {}", userId);
        LOGGER.info("Retrieving transactions for startDate: {}", startDate);
        LOGGER.info("Retrieving transactions for endDate: {}", endDate);

        try
        {
            TransactionsGetResponse transactionsGetResponse = plaidTransactionManager.getTransactionsForUser(userId, startDate, endDate);
            List<Transaction> transactions = transactionsGetResponse.getTransactions();
            List<TransactionResponse> transactionResponses = createTransactionResponse(transactions);
            return ResponseEntity.status(200).body(transactionResponses);

        }catch(IOException e)
        {
            LOGGER.error("There was an error getting the transactions", e);
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    private RecurringTransactionResponse createRecurringTransactionResponse(List<TransactionStream> inflowingStream, List<TransactionStream> outflowingStream){
        RecurringTransactionResponse recurringTransactionResponse = new RecurringTransactionResponse();

        recurringTransactionResponse.setInflowStreams(TransactionStreamConverter.convertTransactionStreams(inflowingStream));
        recurringTransactionResponse.setOutflowStreams(TransactionStreamConverter.convertTransactionStreams(outflowingStream));

        recurringTransactionResponse.setUpdatedDatetime(OffsetDateTime.now());
        recurringTransactionResponse.setRequestId("1234");
        return recurringTransactionResponse;
    }

    private List<TransactionResponse> createTransactionResponse(List<Transaction> transactions){
        // Build the Transaction Response
        List<TransactionResponse> transactionResponses = new ArrayList<>();
        for(Transaction transaction : transactions){
            String transactionId = transaction.getTransactionId();
            String accountId = transaction.getAccountId();
            BigDecimal amount = BigDecimal.valueOf(transaction.getAmount());
            List<String> categories = transaction.getCategory();
            String categoryId = transaction.getCategoryId();
            LocalDate date = transaction.getDate();
            String name = transaction.getName();
            String merchantName = transaction.getMerchantName();
            boolean isPending = transaction.getPending();
            String logoUrl = transaction.getLogoUrl();
            LocalDate authorizedDate = transaction.getAuthorizedDate();
            LocalDate posted = transaction.getDate();
            String transactionType = transaction.getTransactionType().toString();
            TransactionResponse transactionResponse = new TransactionResponse(transactionId, accountId, amount, categories, categoryId, date, name, merchantName, isPending, logoUrl, authorizedDate, posted);
            transactionResponses.add(transactionResponse);
        }
        return transactionResponses;
    }

    private List<TransactionResponse> createTransactionResponseFromEntities(List<TransactionsEntity> transactionsEntities){
        List<TransactionResponse> transactionResponses = new ArrayList<>();
        for(TransactionsEntity transactionsEntity : transactionsEntities){
            if(transactionsEntity == null){
                String transactionId = transactionsEntity.getId();
                String accountRefNumber = transactionsEntity.getAccount().getId();
                BigDecimal amount = transactionsEntity.getAmount();
                String categoryId = transactionsEntity.getCategory().getId();
                LocalDate date = transactionsEntity.getPosted();
                String name = transactionsEntity.getDescription();
                String merchantName = transactionsEntity.getMerchantName();
                String logoUrl = transactionsEntity.getLogoUrl();
                boolean isPending = transactionsEntity.isPending();
                LocalDate authorizedDate = transactionsEntity.getAuthorizedDate();
                TransactionResponse transactionResponse = new TransactionResponse(transactionId, accountRefNumber, amount, categoryId, date, name, merchantName, isPending, logoUrl, authorizedDate);
                transactionResponses.add(transactionResponse);
            }
        }
        return transactionResponses;
    }


    @GetMapping("/transactions/filtered")
    public ResponseEntity<?> getFilteredTransactions(@RequestParam Long userId,
                                                                                @RequestParam LocalDate startDate,
                                                                                @RequestParam LocalDate endDate,
                                                                                @RequestParam int pageCount){
        return null;
    }

    @PostMapping("/fetch-save-recurring-transactions")
    public ResponseEntity<List<RecurringTransactionEntity>> fetchAndSaveRecurringTransactions(@RequestParam Long userId){
        if(userId < 1){
            return ResponseEntity.badRequest().body(null);
        }
        try
        {
            // Fetch the recurring transaction from plaid
            TransactionsRecurringGetResponse recurringGetResponse = plaidTransactionManager.getRecurringTransactionsForUser(userId);
            List<TransactionStream> outflowing = recurringGetResponse.getOutflowStreams();
            List<TransactionStream> inflowing = recurringGetResponse.getInflowStreams();

            // Convert the Transaction Streams to Transaction
            List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionService.createRecurringTransactionEntitiesFromStream(outflowing, inflowing, userId);
            return ResponseEntity.ok(recurringTransactionEntities);

        }catch(Exception e){
            LOGGER.error("There was an error fetching or saving the recurring transactions: ", e);
            return ResponseEntity.internalServerError().body(null);
        }
    }



    @PostMapping("/save-transactions")
    public ResponseEntity<?> saveTransactions(@RequestBody TransactionRequest transactionRequest) throws IOException {
        LOGGER.info("TransactionRequest: {}", transactionRequest);
        if(transactionRequest == null){
            return ResponseEntity.badRequest().body("Transaction Request is null");
        }
        List<TransactionDTO> transactions = transactionRequest.getTransactions();
        LOGGER.info("TransactionDTOs: {}", transactions);
        List<PlaidTransaction> transactionsList = transactions.stream()
                .map(transactionDTOConverter::convert)
                .toList();
        LOGGER.info("Converted Transactions: {}", transactionsList);
        try
        {
            List<TransactionsEntity> savedTransactions = plaidTransactionManager.saveTransactionsToDatabase(transactionsList);

            List<TransactionResponse> transactionResponses = createTransactionResponseFromEntities(savedTransactions);
            return ResponseEntity.status(200).body(transactionResponses);

        }catch(Exception e)
        {
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
    }

    @PostMapping("/save-accounts")
    public ResponseEntity<?> saveAccounts(@RequestBody PlaidAccountRequest plaidAccountRequest){
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
            LOGGER.error("There was an error saving accounts: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(e.getMessage());
        }
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
