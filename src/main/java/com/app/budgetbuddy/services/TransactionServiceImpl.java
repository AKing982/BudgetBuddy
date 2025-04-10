package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.InvalidDataException;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.repositories.CategoryRepository;
import com.app.budgetbuddy.repositories.TransactionRepository;
import com.app.budgetbuddy.workbench.converter.TransactionEntityToModelConverter;
import com.app.budgetbuddy.workbench.converter.TransactionToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.xml.crypto.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionServiceImpl implements TransactionService
{
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final TransactionToEntityConverter transactionToEntityConverter;
    private final TransactionEntityToModelConverter transactionEntityToModelConverter;
    private final Logger LOGGER = LoggerFactory.getLogger(TransactionServiceImpl.class);

    @Autowired
    public TransactionServiceImpl(TransactionRepository transactionRepository,
                                  AccountRepository accountRepository,
                                  CategoryRepository categoryRepository,
                                  TransactionToEntityConverter transactionToEntityConverter,
                                  TransactionEntityToModelConverter transactionEntityToModelConverter){
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.transactionToEntityConverter = transactionToEntityConverter;
        this.transactionEntityToModelConverter = transactionEntityToModelConverter;
    }

    @Override
    public List<TransactionsEntity> findAll()
    {
        try
        {
            return transactionRepository.findAll();

        }catch(Exception e)
        {
            throw new RuntimeException(e);
        }
    }

    @Override
    public void save(TransactionsEntity transactionsEntity) {
        if(transactionsEntity == null){
            throw new NullPointerException("transactionsEntity is null");
        }
        transactionRepository.save(transactionsEntity);
    }


    @Override
    public void delete(TransactionsEntity transactionsEntity) {
        if(transactionsEntity == null){
            throw new NullPointerException("transactionsEntity is null");
        }
        transactionRepository.delete(transactionsEntity);
    }

    @Override
    public Optional<TransactionsEntity> findById(Long id) {
        return transactionRepository.findById(id);
    }


    @Override
    public List<TransactionsEntity> getTransactionsByAmountBetween(BigDecimal startAmount, BigDecimal endAmount) {
        if(startAmount == null || endAmount == null){
            throw new IllegalArgumentException("startAmount is null");
        }

        if(startAmount.compareTo(endAmount) == 0){
            throw new InvalidDataException("Date amounts are identical");
        }
        try
        {
            return transactionRepository.findByAmountBetween(startAmount, endAmount);

        }catch(Exception e) {
            LOGGER.error("There was an error fetching transactions from the database: {}", e.getMessage());
            throw new InvalidDataException("There was an error fetching transactions from the database");
        }
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAmount(BigDecimal amount)
    {
        validateTransactionAmount(amount);
        try
        {
            return transactionRepository.findByAmount(amount);
        }catch(Exception e) {
            LOGGER.error("There was an error fetching transactions from the database: {}", e.getMessage());
            throw new InvalidDataException("There was an error fetching transactions from the database");
        }
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAmountGreaterThan(BigDecimal amount) {
        validateTransactionAmount(amount);
        return transactionRepository.findByAmountGreaterThan(amount);
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAmountLessThan(BigDecimal amount) {
        validateTransactionAmount(amount);
        return transactionRepository.findByAmountLessThan(amount);
    }

    @Override
    public List<String> findTransactionIdsByIds(List<String> transactionIds) {
        return transactionRepository.findTransactionIdsByIds(transactionIds);
    }

    @Override
    public List<TransactionsEntity> convertPlaidTransactionsToEntities(List<PlaidTransaction> plaidTransactions) {
        List<TransactionsEntity> transactionsEntities = new ArrayList<>();
        for(PlaidTransaction transaction : plaidTransactions){
            TransactionsEntity transactionsEntity = convertPlaidTransactionToEntity(transaction);
            transactionsEntities.add(transactionsEntity);
        }
        return transactionsEntities;
    }

    @Override
    public List<TransactionsEntity> createAndSaveTransactions(List<Transaction> transactions) {
        List<TransactionsEntity> transactionsEntities = new ArrayList<>();
        for(Transaction transaction : transactions){
            TransactionsEntity transactionsEntity = transactionToEntityConverter.convert(transaction);
            save(transactionsEntity);
            transactionsEntities.add(transactionsEntity);
        }
        return transactionsEntities;
    }

    @Override
    public void saveAll(List<Transaction> transactions) {
        createAndSaveTransactions(transactions);
    }

    @Override
    public List<Transaction> convertPlaidTransactions(List<com.plaid.client.model.Transaction> plaidTransactions) {
        List<Transaction> transactions = new ArrayList<>();
        for(com.plaid.client.model.Transaction plaidTransaction : plaidTransactions){
            Transaction transaction1 = new Transaction(
                    plaidTransaction.getAccountId(),
                    BigDecimal.valueOf(plaidTransaction.getAmount()),
                    plaidTransaction.getIsoCurrencyCode(),
                    plaidTransaction.getCategory(),
                    plaidTransaction.getCategoryId(),
                    plaidTransaction.getDate(),
                    plaidTransaction.getOriginalDescription(),
                    plaidTransaction.getMerchantName(),
                    plaidTransaction.getName(),
                    plaidTransaction.getPending(),
                    plaidTransaction.getTransactionId(),
                    plaidTransaction.getAuthorizedDate(),
                    plaidTransaction.getLogoUrl(),
                    plaidTransaction.getDate()
            );
            transactions.add(transaction1);
        }
        return transactions;
    }

    @Override
    public List<Transaction> getTransactionsByCategory(String categoryId) {
        if(categoryId.isEmpty()){
            return List.of();
        }
        try
        {
            List<TransactionsEntity> transactionsEntities = transactionRepository.findByCategoryId(categoryId);
            return convertedTransactions(transactionsEntities);
        }catch(DataAccessException ex){
            LOGGER.error("There was an error fetching transactions for category: {}, {}", categoryId, ex.getMessage());
            return List.of();
        }
    }

    @Override
    public Optional<TransactionsEntity> getTransactionById(String id) {
        try
        {
            return transactionRepository.findTransactionByTransactionId(id);
        }catch(DataAccessException e){
            log.error("There was an error fetching transaction by id: {}", id);
            return Optional.empty();
        }
    }

    @Override
    public Optional<TransactionsEntity> getTransactionByIdAndCategoryId(String id, String categoryId) {
        return transactionRepository.findTransactionByIdAndCategoryId(id, categoryId);
    }

    @Override
    public List<String> getCategoriesForTransaction(Long id, String categoryId) {
        return List.of();
    }

    @Override
    public Collection<TransactionsEntity> loadTransactionsForUser(Long userId) {
        return transactionRepository.findTransactionsByUser(userId);
    }

    @Override
    public List<TransactionsEntity> getTransactionsByDateRange(LocalDate startDate, LocalDate endDate) {
        Collection<TransactionsEntity> transactionsEntities = transactionRepository.findTransactionsByDateRange(startDate, endDate);
        return transactionsEntities.stream().toList();
    }

    @Override
    public List<TransactionsEntity> getTransactionsForUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        if(startDate == null || endDate == null){
            throw new NullPointerException("StartDate is null");
        }
        LOGGER.info("UserId: {}", userId);
        return transactionRepository.findTransactionsByUserIdAndDateRange(userId, startDate, endDate);
    }

    @Override
    public List<TransactionsEntity> getTransactionsByPendingTrue() {
        return transactionRepository.findByPendingTrue();
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAuthorizedDate(LocalDate date) {
        if(date == null){
            throw new NullPointerException("date is null");
        }
        return transactionRepository.findByAuthorizedDate(date);
    }

    @Override
    public List<TransactionsEntity> getTransactionsByAccountId(String accountId) {
        if(accountId.isEmpty()){
            throw new IllegalArgumentException("accountId is empty");
        }
        return transactionRepository.findByAccountId(accountId);
    }

    @Override
    public List<TransactionsEntity> getTransactionsByDescription(String description) {
        if(description == null){
            throw new NullPointerException("description is null");
        }
        return transactionRepository.findTransactionByDescription(description);
    }

    @Override
    public Optional<TransactionsEntity> getTransactionByTransactionId(String transactionId) {
        if(transactionId == null){
            throw new NullPointerException("TransactionId is null");
        }
        return Optional.empty();
    }

    @Override
    public Map<String, Transaction> getTransactionsMap(List<String> transactionIds)
    {
        Map<String, Transaction> transactionMap = new HashMap<>();
        if(transactionIds.isEmpty())
        {
            return new HashMap<>();
        }
        for(String transactionId : transactionIds)
        {
            Optional<Transaction> transactionOptional = findTransactionById(transactionId);
            if(transactionOptional.isEmpty())
            {
                log.warn("Skipping TransactionId: {}", transactionId);
                continue;
            }
            transactionMap.put(transactionId, transactionOptional.get());
        }
        return transactionMap;
    }

    private TransactionsEntity convertPlaidTransactionToEntity(PlaidTransaction plaidTransaction){
        TransactionsEntity transactionsEntity = new TransactionsEntity();
        transactionsEntity.setId(plaidTransaction.getTransactionId());
        transactionsEntity.setAmount(plaidTransaction.getAmount());
        transactionsEntity.setPending(plaidTransaction.getPending());
        transactionsEntity.setAuthorizedDate(plaidTransaction.getAuthorizedDate());
        transactionsEntity.setDescription(plaidTransaction.getDescription());
        transactionsEntity.setAccount(fetchAccountById(plaidTransaction.getAccountId()));
        transactionsEntity.setPosted(plaidTransaction.getDate());
        transactionsEntity.setCategory(fetchCategoryById(plaidTransaction.getCategoryId()));
        transactionsEntity.setLogoUrl(plaidTransaction.getLogo());
        transactionsEntity.setIsoCurrencyCode(plaidTransaction.getIsoCurrencyCode());
        transactionsEntity.setMerchantName(plaidTransaction.getMerchantName());
        transactionsEntity.setId(plaidTransaction.getTransactionId());
        return transactionsEntity;
    }

    private CategoryEntity fetchCategoryById(String categoryId){
        if(categoryId.isEmpty()){
            throw new IllegalArgumentException("categoryId is empty");
        }
        Optional<CategoryEntity> categoryEntityOptional = categoryRepository.findByCategoryId(categoryId);
        return categoryEntityOptional.orElseThrow(() -> new IllegalArgumentException("Category not found"));
    }

    private AccountEntity fetchAccountById(String accountId){
        if(accountId.isEmpty()){
            throw new IllegalArgumentException("accountId is empty");
        }
        Optional<AccountEntity> accountEntityOptional = accountRepository.findByAccountId(accountId);
        return accountEntityOptional.orElseThrow(() -> new IllegalArgumentException("Account not found"));
    }

    @Override
    public Collection<TransactionsEntity> getTransactionsByMerchantName(String merchantName) {
        return List.of();
    }

    @Override
    @Transactional
    public void updateTransactionCategorizationFlag(String transactionId)
    {
        try
        {
            transactionRepository.updateIsSystemCategorized(transactionId);
        }catch(DataAccessException e){
            log.error("There was an error updating the isSystemCategorized flag for transactionId: {}", transactionId, e);
        }
    }

    @Override
    public Double getTransactionFrequency(String transactionId) {
        return 0.0;
    }

    @Override
    public List<Transaction> getTransactionsByAmountRange(BigDecimal startAmount, BigDecimal endAmount) {
        if(startAmount == null || endAmount == null){
            throw new IllegalArgumentException("StartAmount or endAmount is null");
        }
        try
        {
            List<TransactionsEntity> transactionsEntities = transactionRepository.findByAmountBetween(startAmount, endAmount);
            return convertedTransactions(transactionsEntities);

        }catch(DataAccessException ex){
            LOGGER.error("There was an error fetching transactions with startAmount: {} and endAmount: {}, {}", startAmount, endAmount, ex.getMessage());
            return List.of();
        }
    }

    @Override
    public List<Transaction> getPendingTransactionsForUser(Long userId) {
        if(userId <= 1L){
            return List.of();
        }
        try
        {
            List<TransactionsEntity> transactionsEntities = transactionRepository.findPendingTransactionsForUser(userId);
            return convertedTransactions(transactionsEntities);
        }catch(DataAccessException ex){
            LOGGER.error("There was an error fetching pending transacctions for user: {}, {}", userId, ex.getMessage());
            return List.of();
        }
    }

    @Override
    public List<Transaction> getRecentTransactionsForUser(Long userId, int limit) {
        Pageable pageLimit = PageRequest.of(0, limit);
        try
        {
            List<TransactionsEntity> transactionsEntities = transactionRepository.findRecentTransactionsByUserId(userId, pageLimit);
            return convertedTransactions(transactionsEntities);

        }catch(DataAccessException e)
        {
            LOGGER.error("Failed to retrieve recent transactions for user ID {}: {}", userId, e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<Transaction> getConvertedPlaidTransactions(Long userId, LocalDate startDate, LocalDate endDate) {
        try
        {
            List<TransactionsEntity> transactions = transactionRepository.findTransactionsByUserIdAndDateRange(userId, startDate, endDate);
            if(transactions.isEmpty()){
                LOGGER.warn("No Transactions found for userId: " + userId + " for startDate: " + startDate + " and endDate: " + endDate);
                return List.of();
            }
            return convertedTransactions(transactions);
        }catch(DataAccessException e){
            LOGGER.error("There was an error fetching transactions from the database: {}", e.getMessage());
            return List.of();
        }
    }

    @Override
    public List<Transaction> getTransactionsByDate(LocalDate date, Long userId)
    {
        try
        {
            List<TransactionsEntity> transactionsEntities = transactionRepository.findTransactionsByPostedDate(date, userId);
            return convertedTransactions(transactionsEntities);
        }catch(DataAccessException e){
            log.error("There was an error retrieving transactions from the database: {}", e.getMessage());
            return List.of();
        }
    }

    @Override
    public Optional<Transaction> findTransactionById(String transactionId)
    {
        try
        {
            log.info("Fetching TransactionID: {}", transactionId);
            Optional<TransactionsEntity> transactionsEntity = transactionRepository.findTransactionByTransactionId(transactionId);
            if(transactionsEntity.isEmpty())
            {
                return Optional.empty();
            }
            TransactionsEntity transactionsEntity1 = transactionsEntity.get();
            return Optional.of(transactionEntityToModelConverter.convert(transactionsEntity1));
        }catch(DataAccessException e){
            LOGGER.error("There was an error retrieving transaction from the database: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private List<Transaction> convertedTransactions(List<TransactionsEntity> transactions) {
        List<Transaction> convertedTransactions = new ArrayList<>();
        for(TransactionsEntity transaction : transactions){
            Transaction transaction1 = transactionEntityToModelConverter.convert(transaction);
            convertedTransactions.add(transaction1);
        }
        return convertedTransactions;
    }


    private void validateTransactionAmount(BigDecimal amount) {
        if(amount.compareTo(BigDecimal.ZERO) == 0){
            throw new NullPointerException("Null Amount found");
        }
    }
}
