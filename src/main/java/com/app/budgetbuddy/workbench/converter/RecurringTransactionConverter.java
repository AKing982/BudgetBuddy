package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.RecurringTransactionType;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.CategoryEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.services.CategoryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.time.LocalDate;
import java.util.Optional;

@Component
public class RecurringTransactionConverter implements Converter<RecurringTransactionDTO, RecurringTransactionEntity>
{
    private final CategoryService categoryService;

    @Autowired
    public RecurringTransactionConverter(CategoryService categoryService){
        this.categoryService = categoryService;
    }

    @Override
    public RecurringTransactionEntity convert(RecurringTransactionDTO recurringTransactionDTO) {
        RecurringTransactionEntity recurringTransactionEntity = new RecurringTransactionEntity();
        recurringTransactionEntity.setFrequency(recurringTransactionDTO.frequency());
        recurringTransactionEntity.setDescription(recurringTransactionDTO.description());
        if(recurringTransactionDTO.firstDate() != null){
            recurringTransactionEntity.setFirstDate(LocalDate.parse(recurringTransactionDTO.firstDate()));
        }
        if(recurringTransactionDTO.lastDate() != null){
            recurringTransactionEntity.setLastDate(LocalDate.parse(recurringTransactionDTO.lastDate()));
        }
        recurringTransactionEntity.setLastAmount(recurringTransactionDTO.lastAmount().amount());
        if(recurringTransactionDTO.type() != null){
            recurringTransactionEntity.setType(recurringTransactionDTO.type());
        }
        recurringTransactionEntity.setStreamId(recurringTransactionDTO.streamId());
        recurringTransactionEntity.setAverageAmount(recurringTransactionDTO.averageAmount().amount());
        recurringTransactionEntity.setActive(recurringTransactionDTO.active());
        recurringTransactionEntity.setCategory(fetchCategoryById(recurringTransactionDTO.categoryId()));
        recurringTransactionEntity.setMerchantName(recurringTransactionDTO.merchantName());
        recurringTransactionEntity.setAccount(AccountEntity.builder().id(recurringTransactionDTO.accountId()).build());
        recurringTransactionEntity.setUser(UserEntity.builder().id(recurringTransactionDTO.userId()).build());
        return recurringTransactionEntity;
    }

    private CategoryEntity fetchCategoryById(String categoryId){
        Optional<CategoryEntity> categoryEntityOptional = categoryService.findCategoryById(categoryId);
        return categoryEntityOptional.orElse(null);
    }
}
