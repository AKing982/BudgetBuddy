package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.TransactionCategory;
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
        TransactionCategoryEntity transactionCategoryEntity = new TransactionCategoryEntity();
        transactionCategoryEntity.setId(transactionCategory.getId());
        transactionCategoryEntity.setCategorizedBy(transactionCategory.getCategorizedBy());
        transactionCategoryEntity.setMatchedCategory(transactionCategory.getCategory());
        transactionCategoryEntity.setCategorized_date(transactionCategory.getCategorizedDate());
        transactionCategoryEntity.setSubBudget(subBudgetRepository.findById(transactionCategory.getSubBudgetId()).orElse(null));
        Optional<TransactionsEntity> transactionEntity = getTransactionEntity(transactionCategory.getTransactionId());
        Optional<CSVTransactionEntity> csvTransactionEntity = getCSVTransactionEntity(transactionCategory.getCsvTransactionId());
        if(transactionEntity.isEmpty() && csvTransactionEntity.isPresent())
        {
            transactionCategoryEntity.setCsvTransaction(csvTransactionEntity.get());
        }
        else if(csvTransactionEntity.isEmpty() && transactionEntity.isPresent())
        {
            transactionCategoryEntity.setTransaction(transactionEntity.get());
        }
        return transactionCategoryEntity;
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
