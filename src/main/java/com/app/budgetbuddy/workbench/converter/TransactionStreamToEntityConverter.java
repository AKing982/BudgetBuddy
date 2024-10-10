package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.entities.*;
import com.app.budgetbuddy.services.CategoryService;
import com.plaid.client.model.TransactionStream;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
public class TransactionStreamToEntityConverter {

    private final CategoryService categoryService;

    @Autowired
    public TransactionStreamToEntityConverter(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    public List<RecurringTransactionEntity> convertTransactionStreamList(List<TransactionStream> outflowing, List<TransactionStream> inflowing, Long userId) {
        List<RecurringTransactionEntity> transactionEntities = new ArrayList<>();
        for (TransactionStream transactionStream : outflowing) {
            RecurringTransactionEntity recurringTransactionEntity = convert(transactionStream, userId);
            transactionEntities.add(recurringTransactionEntity);
        }

        for (TransactionStream transactionStream : inflowing) {
            RecurringTransactionEntity recurringTransactionEntity = convert(transactionStream, userId);
            transactionEntities.add(recurringTransactionEntity);
        }
        return transactionEntities;
    }

    public RecurringTransactionEntity convert(TransactionStream transactionStream, Long userId) {
        RecurringTransactionEntity recurringTransactionEntity = new RecurringTransactionEntity();
        recurringTransactionEntity.setDescription(transactionStream.getDescription());
        recurringTransactionEntity.setStreamId(transactionStream.getStreamId());
        recurringTransactionEntity.setMerchantName(transactionStream.getMerchantName());
        recurringTransactionEntity.setFirstDate(transactionStream.getFirstDate());
        recurringTransactionEntity.setLastDate(transactionStream.getLastDate());
        recurringTransactionEntity.setLastAmount(BigDecimal.valueOf(transactionStream.getLastAmount().getAmount()));
        recurringTransactionEntity.setAccount(AccountEntity.builder().id(transactionStream.getAccountId()).build());
        recurringTransactionEntity.setFrequency(transactionStream.getFrequency().toString());
        recurringTransactionEntity.setUser(UserEntity.builder().id(userId).build());
        recurringTransactionEntity.setAverageAmount(BigDecimal.valueOf(transactionStream.getAverageAmount().getAmount()));
        recurringTransactionEntity.setActive(transactionStream.getIsActive());
        recurringTransactionEntity.setCategory(fetchCategoryById(transactionStream.getCategoryId()));
        return recurringTransactionEntity;
    }

    private CategoryEntity fetchCategoryById(String categoryId) {
        if(categoryId == null){
            return null;
        }
        Optional<CategoryEntity> categoryEntityOptional = categoryService.findCategoryById(categoryId);
        if(categoryEntityOptional.isPresent()){
            return categoryEntityOptional.get();
        }
        return null;
    }

}
