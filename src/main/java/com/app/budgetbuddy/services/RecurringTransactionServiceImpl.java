package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.RecurringTransactionType;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.repositories.RecurringTransactionsRepository;
import com.app.budgetbuddy.workbench.converter.RecurringTransactionConverter;
import com.app.budgetbuddy.workbench.converter.TransactionStreamToEntityConverter;
import com.plaid.client.model.TransactionStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class RecurringTransactionServiceImpl implements RecurringTransactionService
{
    private final RecurringTransactionsRepository recurringTransactionsRepository;
    private final RecurringTransactionConverter recurringTransactionConverter;
    private final TransactionStreamToEntityConverter transactionStreamToEntityConverter;

    @Autowired
    public RecurringTransactionServiceImpl(RecurringTransactionsRepository recurringTransactionsRepository,
                                           RecurringTransactionConverter recurringTransactionConverter,
                                           TransactionStreamToEntityConverter transactionStreamToEntityConverter){
        this.recurringTransactionsRepository = recurringTransactionsRepository;
        this.recurringTransactionConverter = recurringTransactionConverter;
        this.transactionStreamToEntityConverter = transactionStreamToEntityConverter;
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
    public List<RecurringTransaction> getRecurringTransactions(Long userId, LocalDate startDate, LocalDate endDate) {
        List<RecurringTransactionEntity> recurringTransactionEntities = recurringTransactionsRepository.findTransactionsInDateRangeForUser(userId, startDate, endDate);
        return convertRecurringTransactionEntities(recurringTransactionEntities);
    }

    private List<RecurringTransaction> convertRecurringTransactionEntities(List<RecurringTransactionEntity> recurringTransactionEntities){
        List<RecurringTransaction> recurringTransactions = new ArrayList<>();
        for (RecurringTransactionEntity recurringTransactionEntity : recurringTransactionEntities) {
            String categoryName = null;
            if (recurringTransactionEntity.getCategory() != null) {
                categoryName = recurringTransactionEntity.getCategory().getName() != null
                        ? recurringTransactionEntity.getCategory().getName()
                        : recurringTransactionEntity.getCategory().getDescription(); // Fallback to description
            }

            List<String> categories = (categoryName != null) ? List.of(categoryName) : new ArrayList<>();

            RecurringTransaction recurringTransaction = new RecurringTransaction(
                    recurringTransactionEntity.getAccount().getId().toString(),
                    recurringTransactionEntity.getAverageAmount(),
                    "USD", // Assuming currency is fixed as "USD". Replace with dynamic mapping if required.

                    categories,
                    recurringTransactionEntity.getCategory() != null ?
                            recurringTransactionEntity.getCategory().getId().toString() : null,
                    recurringTransactionEntity.getLastDate(), // Use `lastDate` as the transaction date
                    recurringTransactionEntity.getDescription(),
                    recurringTransactionEntity.getMerchantName(),
                    recurringTransactionEntity.getMerchantName(), // Assuming `name` is the same as `merchantName`
                    false, // Assuming `pending` is false for recurring transactions
                    recurringTransactionEntity.getStreamId(),
                    recurringTransactionEntity.getLastDate(), // Use `lastDate` as authorized date
                    null, // Assuming `logoUrl` is not available in the entity
                    recurringTransactionEntity.getLastDate(), // Use `lastDate` as posted date
                    recurringTransactionEntity.getStreamId(),
                    recurringTransactionEntity.getFirstDate(),
                    recurringTransactionEntity.getLastDate(),
                    recurringTransactionEntity.getFrequency(),
                    recurringTransactionEntity.getAverageAmount(),
                    recurringTransactionEntity.getLastAmount(),
                    recurringTransactionEntity.isActive(),
                    recurringTransactionEntity.getType()
            );
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
