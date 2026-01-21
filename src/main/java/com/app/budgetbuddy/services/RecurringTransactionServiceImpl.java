package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.RecurringTransactionType;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.repositories.AccountRepository;
import com.app.budgetbuddy.repositories.CategoryRepository;
import com.app.budgetbuddy.repositories.RecurringTransactionsRepository;
import com.app.budgetbuddy.workbench.converter.RecurringTransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionStreamToEntityConverter;
import com.plaid.client.model.TransactionStream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
public class RecurringTransactionServiceImpl implements RecurringTransactionService
{
    private final RecurringTransactionsRepository recurringTransactionsRepository;
    private final AccountRepository accountRepository;
    private final CategoryRepository categoryRepository;
    private final RecurringTransactionConverter recurringTransactionConverter;
    private final TransactionStreamToEntityConverter transactionStreamToEntityConverter;

    @Autowired
    public RecurringTransactionServiceImpl(RecurringTransactionsRepository recurringTransactionsRepository,
                                           AccountRepository accountRepository,
                                           CategoryRepository categoryRepository,
                                           RecurringTransactionConverter recurringTransactionConverter,
                                           TransactionStreamToEntityConverter transactionStreamToEntityConverter){
        this.recurringTransactionsRepository = recurringTransactionsRepository;
        this.accountRepository = accountRepository;
        this.categoryRepository = categoryRepository;
        this.recurringTransactionConverter = recurringTransactionConverter;
        this.transactionStreamToEntityConverter = transactionStreamToEntityConverter;
    }

    private AccountEntity getAccountEntityFromId(String id){
        if(id == null) return null;
        Optional<AccountEntity> accountEntityOptional = accountRepository.findByAccountId(id);
        return accountEntityOptional.orElse(null);
    }

    private CategoryEntity getCategoryEntityFromId(String id){
        return null;
    }

    public List<RecurringTransactionEntity> createAndSaveRecurringTransactions(List<RecurringTransaction> recurringTransactions){
        List<RecurringTransactionEntity> recurringTransactionEntities = new ArrayList<>();

        for (RecurringTransaction recurringTransaction : recurringTransactions) {
            RecurringTransactionEntity entity = new RecurringTransactionEntity();

            // Set basic fields
            entity.setStreamId(recurringTransaction.getStreamId());
            entity.setDescription(recurringTransaction.getDescription());
            entity.setMerchantName(recurringTransaction.getMerchantName());
            entity.setFirstDate(recurringTransaction.getFirstDate());
            entity.setLastDate(recurringTransaction.getLastDate());
            entity.setFrequency(recurringTransaction.getFrequency());
            entity.setAverageAmount(recurringTransaction.getAverageAmount());
            entity.setLastAmount(recurringTransaction.getLastAmount());
            entity.setActive(recurringTransaction.getActive());
            entity.setType(recurringTransaction.getType());

            // Set relationships
            if (recurringTransaction.getAccountId() != null) {
                AccountEntity account = getAccountEntityFromId(recurringTransaction.getAccountId());
                entity.setAccount(account);
            }

            if (recurringTransaction.getCategoryId() != null) {
                CategoryEntity category = getCategoryEntityFromId(recurringTransaction.getCategoryId());;
                entity.setCategory(category);
            }

            // Save the entity
            try {
                // Check if the recurring transaction exists in the database,
                // if it does, then skip saving the recurring transaction
                String streamId = entity.getStreamId();
                Long rId = entity.getId();
                RecurringTransactionEntity existingRecurringTransaction = recurringTransactionsRepository.findById(rId).orElse(null);
                if(!existingRecurringTransaction.getStreamId().equals(streamId))
                {
                    RecurringTransactionEntity savedEntity = recurringTransactionsRepository.save(entity);
                    recurringTransactionEntities.add(savedEntity);
                }
                else
                {
                    log.warn("Recurring Transaction with StreamId: {} already exists", streamId);
                }

            } catch (Exception e) {
                log.error("Error saving recurring transaction with streamId: {}",
                        recurringTransaction.getStreamId(), e);
            }
        }

        return recurringTransactionEntities;
    }

    public List<RecurringTransactionEntity> createRecurringTransactionEntitiesFromStream(List<TransactionStream> outflow, List<TransactionStream> inflow, Long userId){
        List<RecurringTransactionEntity> recurringTransactionEntities = transactionStreamToEntityConverter.convertTransactionStreamList(outflow, inflow, userId);
        recurringTransactionsRepository.saveAll(recurringTransactionEntities);
        return recurringTransactionEntities;
    }

    @Override
    public Collection<RecurringTransactionEntity> findAll() {
        return recurringTransactionsRepository.findAll();
    }

    @Override
    public void save(RecurringTransactionEntity recurringTransactionEntity) {
        recurringTransactionsRepository.save(recurringTransactionEntity);
    }

    @Override
    public void delete(RecurringTransactionEntity recurringTransactionEntity) {
        recurringTransactionsRepository.delete(recurringTransactionEntity);
    }

    @Override
    public Optional<RecurringTransactionEntity> findById(Long id) {
        return recurringTransactionsRepository.findById(id);
    }

    @Override
    public List<RecurringTransactionEntity> findAllByUserId(Long userId) {
        return recurringTransactionsRepository.findByUser(userId);
    }

    @Override
    public List<RecurringTransactionEntity> findAllByAccountId(String accountId) {
        return recurringTransactionsRepository.findByAccountId(accountId);
    }

    @Override
    public List<RecurringTransactionEntity> findByStreamId(String streamId) {
        return recurringTransactionsRepository.findByStreamId(streamId);
    }

    @Override
    public List<RecurringTransactionEntity> findAllActive() {
        return List.of();
    }

    @Override
    public List<RecurringTransactionEntity> findAllByType(RecurringTransactionType type) {
        return recurringTransactionsRepository.findTransactionsByType(type);
    }

    @Override
    public List<RecurringTransactionEntity> findByDateRange(LocalDate startDate, LocalDate endDate) {
        return recurringTransactionsRepository.findTransactionsInDateRange(startDate, endDate);
    }

    @Override
    public List<RecurringTransactionEntity> findByUserAndDateRange(Long userId, LocalDate startDate, LocalDate endDate) {
        return recurringTransactionsRepository.findTransactionsInDateRangeForUser(userId, startDate, endDate);
    }

    @Override
    public List<RecurringTransactionEntity> findByMerchantName(String merchantName) {
        return recurringTransactionsRepository.findByMerchantName(merchantName);
    }

    @Override
    public List<RecurringTransactionEntity> findByCategory(CategoryEntity category) {
        return recurringTransactionsRepository.findTransactionsByCategory(category);
    }

    @Override
    public List<String> findRecurringTransactionIds(final List<String> plaidRecurringTransactionIds) {
        if(plaidRecurringTransactionIds.isEmpty()){
            return Collections.emptyList();
        }
        try
        {
            return recurringTransactionsRepository.findRecurringTransactionIds(plaidRecurringTransactionIds);
        }catch(DataAccessException e){
            log.error("There was an error fetching existing recurring transaction ids from the database.", e);
            return List.of();
        }
    }


    @Override
    public BigDecimal getTotalRecurringExpensesForPeriod(Long userId, LocalDate startDate, LocalDate endDate) {
        return recurringTransactionsRepository.findTotalExpensesForDateRange(userId, startDate, endDate);
    }

    @Override
    public List<RecurringTransaction> findIncomeRecurringTransactionByCategoryAndUserId(String categoryName, String categoryId, Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionsRepository.findRecurringTransactionsWithIncome(categoryName, categoryName, userId);
            List<RecurringTransaction> recurringTransactions = convertRecurringTransactionEntities(recurringTransactionEntities);
            return recurringTransactions.stream()
                    .filter(transaction ->
                            !transaction.getLastDate().isBefore(startDate) &&
                                    !transaction.getFirstDate().isAfter(endDate))
                    .collect(Collectors.toList());

        }catch(DataAccessException e){
            log.error("There was an error accessing the recurring transactions: ",e);
            return List.of();
        }
    }

    @Override
    @Transactional
    public List<RecurringTransaction> getRecurringTransactionsForDate(Long userId, LocalDate date)
    {
        if(userId == null || date == null)
        {
            return Collections.emptyList();
        }
        try
        {
            List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionsRepository.findRecurringTransactionEntitiesByUserAndDate(userId, date);
            return convertRecurringTransactionEntities(recurringTransactionEntities);
        }catch(DataAccessException e){
            log.error("There was an error retrieving the recurring transactions from the database.", e);
            return Collections.emptyList();
        }
    }

    @Override
    public List<RecurringTransaction> getRecurringTransactions(Long userId, LocalDate startDate, LocalDate endDate) {
        List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionsRepository.findTransactionsInDateRangeForUser(userId, startDate, endDate);
        return convertRecurringTransactionEntities(recurringTransactionEntities);
    }

    public List<RecurringTransaction> convertRecurringTransactionEntities(List<RecurringTransactionEntity> recurringTransactionEntities){
        List<RecurringTransaction> recurringTransactions = new ArrayList<>();
        for (RecurringTransactionEntity recurringTransactionEntity : recurringTransactionEntities) {
            String categoryName = null;
            if (recurringTransactionEntity.getCategory() != null) {
                categoryName = recurringTransactionEntity.getCategory().getPlaidCategoryId() != null
                        ? recurringTransactionEntity.getCategory().getCategory()
                        : recurringTransactionEntity.getCategory().getDescription(); // Fallback to description
            }

            List<String> categories = (categoryName != null) ? List.of(categoryName) : new ArrayList<>();
            RecurringTransaction recurringTransaction = RecurringTransaction.builder()
                    .streamId(recurringTransactionEntity.getStreamId())
                    .firstDate(recurringTransactionEntity.getFirstDate())
                    .lastDate(recurringTransactionEntity.getLastDate())
                    .frequency(recurringTransactionEntity.getFrequency())
                    .averageAmount(recurringTransactionEntity.getAverageAmount())
                    .lastAmount(recurringTransactionEntity.getLastAmount())
                    .active(recurringTransactionEntity.isActive())
                    .type(recurringTransactionEntity.getType())
                    .build();

            recurringTransactions.add(recurringTransaction);
        }
        return recurringTransactions;
    }

    @Override
    public List<RecurringTransactionEntity> createRecurringTransactions(List<RecurringTransactionDTO> outflowing, List<RecurringTransactionDTO> inflowing) {
        List<RecurringTransactionEntity> recurringTransactionEntities = new ArrayList<>();
        // Convert the outflowing stream
        for(RecurringTransactionDTO recurringTransactionDTO : inflowing){
            RecurringTransactionEntity inflowingTransaction = recurringTransactionConverter.convert(recurringTransactionDTO);
            recurringTransactionEntities.add(inflowingTransaction);
        }
        for(RecurringTransactionDTO recurringTransactionDTO : outflowing){
            RecurringTransactionEntity outflowingTransaction = recurringTransactionConverter.convert(recurringTransactionDTO);
            recurringTransactionEntities.add(outflowingTransaction);
        }

        // Save the Recurring Transactions to the database
        recurringTransactionsRepository.saveAll(recurringTransactionEntities);

       return recurringTransactionEntities;
    }

    @Override
    public Optional<RecurringTransactionEntity> findByIdAndCategoryId(Long id, String categoryId) {
        return Optional.empty();
    }
}
