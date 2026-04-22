package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionCategoryStatus;
import com.app.budgetbuddy.entities.TransactionCategoryEntity;
import com.app.budgetbuddy.entities.TransactionsEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.TransactionsNotFoundException;
import com.app.budgetbuddy.repositories.TransactionCategoryRepository;
import com.app.budgetbuddy.repositories.TransactionRepository;
import com.app.budgetbuddy.workbench.converter.TransactionCategoryConverter;
import com.app.budgetbuddy.workbench.converter.TransactionCategoryToEntityConverter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@Slf4j
public class TransactionCategoryServiceImpl implements TransactionCategoryService
{
    private final TransactionCategoryRepository transactionCategoryRepository;
    private final TransactionRepository transactionRepository;
    private final TransactionCategoryToEntityConverter transactionCategoryToEntityConverter;
    private final TransactionCategoryConverter transactionCategoryConverter;

    @Autowired
    public TransactionCategoryServiceImpl(TransactionCategoryRepository transactionCategoryRepository,
                                          TransactionRepository transactionRepository,
                                          TransactionCategoryToEntityConverter transactionCategoryToEntityConverter,
                                          TransactionCategoryConverter transactionCategoryConverter)
    {
        this.transactionCategoryRepository = transactionCategoryRepository;
        this.transactionRepository = transactionRepository;
        this.transactionCategoryToEntityConverter = transactionCategoryToEntityConverter;
        this.transactionCategoryConverter = transactionCategoryConverter;
    }

    @Override
    public Collection<TransactionCategoryEntity> findAll()
    {
        try
        {
            return transactionCategoryRepository.findAll();
        }catch(DataAccessException e){
            log.error("There was an error while trying to find all transaction categories", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public void save(TransactionCategoryEntity transactionCategorizationEntity)
    {
        try
        {
            // CSV transaction dedup
            if (transactionCategorizationEntity.getCsvTransaction() != null) {
                Long csvTransactionId = transactionCategorizationEntity.getCsvTransaction().getId();
                if (csvTransactionId != null && transactionCategoryRepository
                        .existsByCsvTransactionId(csvTransactionId)) {
                    log.debug("Skipping duplicate transaction category for csv_transaction_id: {}", csvTransactionId);
                    return;
                }
            } else if (transactionCategorizationEntity.getTransaction() != null) {
                String transactionId = transactionCategorizationEntity.getTransaction().getId();
                if (transactionId != null && transactionCategoryRepository.existsByTransactionId(transactionId)) {
                    log.debug("Skipping duplicate transaction category for transaction_id: {}", transactionId);
                    return;
                }
            }
            transactionCategoryRepository.save(transactionCategorizationEntity);
        } catch (DataAccessException e) {
            log.error("There was an error while saving the TransactionCategory entity", e);
        }
    }

    @Override
    @Transactional
    public void delete(TransactionCategoryEntity transactionCategorizationEntity)
    {
        try
        {
            transactionCategoryRepository.delete(transactionCategorizationEntity);
        }catch(DataAccessException e){
            log.error("There was an error while deleting the TransactionCategory entity", e);
        }
    }

    @Override
    public Optional<TransactionCategoryEntity> findById(Long id) {
        return Optional.empty();
    }

    @Override
    @Transactional
    public void saveAll(List<TransactionCategory> transactionCategoryList)
    {
        log.info("Saving {} transaction categories", transactionCategoryList.size());
        transactionCategoryList.stream()
                .map(this::convertToEntity)
                .forEach(this::save);
    }

    @Override
    public TransactionCategoryEntity convertToEntity(TransactionCategory transactionCategory)
    {
        return transactionCategoryToEntityConverter.convert(transactionCategory);
    }

    @Override
    public TransactionCategory convertFromEntity(TransactionCategoryEntity transactionCategoryEntity)
    {
        return transactionCategoryConverter.convert(transactionCategoryEntity);
    }

    @Override
    @Transactional
    public List<LocalDate> getIncomePostedDatesByDateShift(Long userId, Long subBudgetId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            return transactionCategoryRepository.findIncomePostedDateByDateShift(userId, subBudgetId, startDate, endDate);
        }catch(DataAccessException e){
            log.error("There was an error while getting the income posted dates", e);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public List<LocalDate> getIncomePostedDates(Long userId, Long subBudgetId)
    {
        try
        {
            return transactionCategoryRepository.findIncomePostedDate(userId, subBudgetId);
        }catch(DataAccessException e){
            log.error("There was an error while getting the income posted dates", e);
            return Collections.emptyList();
        }
    }

    @Override
    public Optional<TransactionCategory> getTransactionCategoryByCsvIdAndCatName(String category, Long csvId)
    {
        try
        {
            Optional<TransactionCategoryEntity> transactionCategoryEntityOptional = transactionCategoryRepository.findTransactionCategoryByCategoryAndId(category, csvId);
            if(transactionCategoryEntityOptional.isEmpty())
            {
                log.info("No Transaction Category found for given category and csv Id");
                return Optional.empty();
            }
            TransactionCategoryEntity transactionCategoryEntity = transactionCategoryEntityOptional.get();
            TransactionCategory transactionCategory = transactionCategoryConverter.convert(transactionCategoryEntity);
            return Optional.of(transactionCategory);
        }catch(DataAccessException e){
            log.error("There was an error while getting the TransactionCategory entity", e);
            return Optional.empty();
        }
    }

    @Override
    @Transactional
    public void updateTransactionCategoriesByCsvIdAndCategory(String category, Long id)
    {
        try
        {
            transactionCategoryRepository.updateTransactionCategoryByCsvIdAndCategory(id, category);
        }catch(DataAccessException e){
            log.error("There was an error while updating the TransactionCategory entity", e);
            return;
        }
    }

    @Override
    @Transactional
    public void updateTransactionCategoriesByIdAndCategory(String category, String id)
    {
        try
        {
            transactionCategoryRepository.updateTransactionCategoryByTransactionIdAndCategory(id, category);
        }catch(DataAccessException e){
            log.error("There was an error while updating the TransactionCategory entity", e);
            return;
        }
    }

    @Override
    @Transactional
    public void updateAll(List<TransactionCategory> transactionCategoryList)
    {
        try
        {
            for(TransactionCategory transactionCategory : transactionCategoryList)
            {
                transactionCategoryRepository.findById(transactionCategory.getId())
                        .ifPresent(entity -> {
                            entity.setMatchedCategory(transactionCategory.getCategory());
                            entity.setCategorizedBy(transactionCategory.getCategorizedBy());
                            entity.setCategorized_date(transactionCategory.getCategorizedDate());
                            entity.setUpdated(transactionCategory.isUpdated());
                            entity.setStatus(transactionCategory.getTransactionCategoryStatus());
                            entity.setCategoryLevel(transactionCategory.getCategoryPriorityLevel());
                            entity.setExpenseType(transactionCategory.getCategoryExpenseType());
                            transactionCategoryRepository.save(entity);
                        });
            }
        }catch(DataAccessException e){
            log.error("There was an error while updating the TransactionCategory entity", e);
        }
    }

    @Override
    @Transactional
    public void updateCSVTransactionCategoryStatus(TransactionCategoryStatus transactionCategoryStatus, Long csvId)
    {
        if(transactionCategoryStatus == null || csvId < 1L)
        {
            return;
        }
        try
        {
            transactionCategoryRepository.updateCSVTransactionCategoryStatus(csvId, transactionCategoryStatus);
            log.info("Successfully updated the TransactionCategory status to {} for the csv Id: {} ", transactionCategoryStatus, csvId);
        }catch(DataAccessException e){
            log.error("There was an error while updating the TransactionCategory entity", e);
        }
    }

    @Override
    @Transactional
    public void updateTransactionCategoryStatus(String id, TransactionCategoryStatus transactionCategoryStatus)
    {
        if(transactionCategoryStatus == null || id.isEmpty())
        {
            return;
        }
        try
        {
            transactionCategoryRepository.updateTransactionCategoryStatus(id, transactionCategoryStatus);
            log.info("Successfully updated the TransactionCategory status to {} for the id: {} ", transactionCategoryStatus, id);
        }catch(DataAccessException e){
            log.error("There was an error while updating the TransactionCategory entity", e);
            return;
        }
    }

    @Override
    @Transactional
    public List<TransactionCategory> getUncategorizedTransactionsByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return transactionCategoryRepository
                .findUncategorizedTransactionsByUserIdAndDateRange(userId, startDate, endDate)
                .stream()
                .map(this::convertFromEntity)
                .collect(Collectors.toList());
    }

    @Override
    public List<TransactionCategory> getUncategorizedCsvTransactionsByUserIdAndDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return transactionCategoryRepository
                .findUncategorizedCsvByUserIdAndDateRange(userId, startDate, endDate)
                .stream()
                .map(this::convertFromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public boolean checkNewCSVTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            int checkCountNew = transactionCategoryRepository.findNewCSVTransactionCategories(startDate, endDate, userId);
            return checkCountNew > 0;
        }catch(DataAccessException e){
            log.error("There was an error fetching new transaction categories by date range", e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean checkNewTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
       try
       {
           int checkCountNew = transactionCategoryRepository.findNewTransactionCategories(startDate, endDate, userId);
           return checkCountNew > 0;
       }catch(DataAccessException e){
           log.error("There was an error fetching new transaction categories by date range", e);
           return false;
       }
    }

    @Override
    @Transactional
    public boolean checkUpdatedCSVTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            log.info("Checking if there are any updated transaction categories between {} and {}", startDate, endDate);
            int checkUpdated = transactionCategoryRepository.findUpdatedCSVTransactionCategories(startDate, endDate, userId);
            log.info("Found {} updated transaction categories between {} and {}", checkUpdated, startDate, endDate);
            return checkUpdated > 0;
        }catch(DataAccessException e){
            log.error("There was an error fetching the updated transaction categories by date range", e);
            return false;
        }
    }

    @Override
    @Transactional
    public boolean checkUpdatedTransactionCategoriesByDateRange(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            int checkUpdated = transactionCategoryRepository.findUpdatedTransactionCategories(startDate, endDate, userId);
            return checkUpdated > 0;
        }catch(DataAccessException e){
            log.error("There was an error fetching the updated transaction categories by date range", e);
            return false;
        }
    }

    @Override
    @Transactional
    public void updateCSVTransactionCategoryIsUpdated(Long csvId, boolean isUpdated)
    {
        if(csvId < 1L)
        {
            return;
        }
        try
        {
            transactionCategoryRepository.updateCSVTransactionCategoryIsUpdated(csvId, isUpdated);
            log.info("Successfully updated transaction category isUpdated field to {} for the csv Id: {} ", isUpdated, csvId);
        }catch(DataAccessException e){
            log.error("There was an error while updating the is updated field for transaction category with csvId {}: {}", csvId, e.getMessage());
            return;
        }
    }

    @Override
    @Transactional
    public void updateTransactionCategoryIsUpdated(String id, boolean isUpdated)
    {
        if(id == null)
        {
            return;
        }
        try
        {
            transactionCategoryRepository.updateTransactionCategoryUpdated(id, isUpdated);
        }catch(DataAccessException e){
            log.error("There was an error while updating the is updated field for transaction category with id {}: {}", id, e.getMessage());
            return;
        }
    }

    @Override
    public List<TransactionCategory> getTransactionCategoryListByTransactionIds(List<String> transactionIds)
    {
        if(transactionIds.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            List<TransactionCategoryEntity> transactionCategoryEntities = transactionCategoryRepository.findTransactionCategoryByTransactionIds(transactionIds);
            return transactionCategoryEntities.stream()
                    .map(this::convertFromEntity)
                    .distinct()
                    .toList();
        }catch(DataAccessException e){
            log.error("There was an error fetching the transaction categories: ", e);
            return Collections.emptyList();
        }
    }

    @Override
    public List<TransactionCategory> getTransactionCategoriesBetweenStartAndEndDates(final LocalDate startDate, final LocalDate endDate, final Long userId)
    {
        try
        {
            List<TransactionCategoryEntity> transactionCategoryEntities = transactionCategoryRepository.findTransactionCategoriesBetweenStartAndEndDates(startDate, endDate, userId);
            if(transactionCategoryEntities.isEmpty())
            {
                return Collections.emptyList();
            }
            return transactionCategoryEntities.stream()
                    .map(this::convertFromEntity)
                    .distinct()
                    .toList();

        }catch(DataAccessException e)
        {
            log.error("There was an error while getting the TransactionCategory entity", e);
            return Collections.emptyList();
        }
    }

    private Optional<TransactionsEntity> findTransactionEntityById(String id)
    {
        try
        {
            return transactionRepository.findTransactionByTransactionId(id);
        }catch(DataAccessException e){
            log.error("There was an error while getting the TransactionCategory entity", e);
            return Optional.empty();
        }
    }
}
