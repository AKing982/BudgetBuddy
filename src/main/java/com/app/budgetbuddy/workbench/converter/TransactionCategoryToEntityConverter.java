package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.TransactionCategory;
import com.app.budgetbuddy.domain.TransactionCategoryStatus;
import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.repositories.CSVTransactionRepository;
import com.app.budgetbuddy.repositories.SubBudgetRepository;
import com.app.budgetbuddy.repositories.TransactionRepository;
import com.app.budgetbuddy.repositories.UserCategoryRepository;
import com.app.budgetbuddy.services.CategoryService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Slf4j
public class TransactionCategoryToEntityConverter implements Converter<TransactionCategory, TransactionCategoryEntity>
{
    private final TransactionRepository transactionRepository;
    private final CSVTransactionRepository csvTransactionRepository;
    private final UserCategoryRepository userCategoryRepository;
    private final SubBudgetRepository subBudgetRepository;
    private final CategoryService categoryService;

    @Autowired
    public TransactionCategoryToEntityConverter(TransactionRepository transactionRepository,
                                                CSVTransactionRepository csvTransactionRepository,
                                                UserCategoryRepository userCategoryRepository,
                                                SubBudgetRepository subBudgetRepository,
                                                CategoryService categoryService)
    {
        this.transactionRepository = transactionRepository;
        this.csvTransactionRepository = csvTransactionRepository;
        this.userCategoryRepository = userCategoryRepository;
        this.subBudgetRepository = subBudgetRepository;
        this.categoryService = categoryService;
    }

    @Override
    public TransactionCategoryEntity convert(TransactionCategory transactionCategory)
    {
        log.info("Converting transaction category model to entity: {}", transactionCategory);
        TransactionCategoryEntity transactionCategoryEntity = new TransactionCategoryEntity();
        try
        {
            if(transactionCategory.getId() != null)
            {
                transactionCategoryEntity.setId(transactionCategory.getId());
            }
            transactionCategoryEntity.setCategorizedBy(transactionCategory.getCategorizedBy());
            transactionCategoryEntity.setMatchedCategory(transactionCategory.getCategory());
            transactionCategoryEntity.setCategorized_date(transactionCategory.getCategorizedDate());
            transactionCategoryEntity.setStatus(TransactionCategoryStatus.NEW);
            transactionCategoryEntity.setCategoryLevel(transactionCategory.getCategoryPriorityLevel());
            transactionCategoryEntity.setExpenseType(transactionCategory.getCategoryExpenseType());
            transactionCategoryEntity.setUpdated(transactionCategoryEntity.isUpdated());
            transactionCategoryEntity.setSubBudget(subBudgetRepository.findById(transactionCategory.getSubBudgetId()).orElse(null));
            if(transactionCategory.getCsvTransactionId() == null && transactionCategory.getTransactionId() != null)
            {
                Optional<TransactionsEntity> transactionEntity = getTransactionEntity(transactionCategory.getTransactionId());
                transactionEntity.ifPresent(transactionCategoryEntity::setTransaction);
            }
            else if(transactionCategory.getCsvTransactionId() != null && transactionCategory.getTransactionId() == null)
            {
                Optional<CSVTransactionEntity> csvTransactionEntity = getCSVTransactionEntity(transactionCategory.getCsvTransactionId());
                csvTransactionEntity.ifPresent(transactionCategoryEntity::setCsvTransaction);
            }
            return transactionCategoryEntity;
        }catch(Exception e){
            log.error("There was an error converting the transaction category model to entity: {}", e.getMessage());
            throw e;
        }
    }

    private Optional<CSVTransactionEntity> getCSVTransactionEntity(Long transactionId)
    {
        try
        {
            return csvTransactionRepository.findById(transactionId);
        }catch(Exception e){
            log.error("Error fetching csv transaction entity for transaction id: " + transactionId, e);
            return Optional.empty();
        }
    }

    private Optional<TransactionsEntity> getTransactionEntity(String transactionId)
    {
        try
        {
            return transactionRepository.findTransactionByTransactionId(transactionId);
        }catch(Exception e){
            log.error("Error fetching transaction entity for transaction id: " + transactionId, e);
            return Optional.empty();
        }
    }
}
