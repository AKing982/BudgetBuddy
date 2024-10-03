package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.RecurringTransactionDTO;
import com.app.budgetbuddy.domain.RecurringTransactionType;
import com.app.budgetbuddy.entities.AccountEntity;
import com.app.budgetbuddy.entities.RecurringTransactionEntity;
import com.app.budgetbuddy.entities.UserEntity;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
public class RecurringTransactionConverter implements Converter<RecurringTransactionDTO, RecurringTransactionEntity>
{

    @Override
    public RecurringTransactionEntity convert(RecurringTransactionDTO recurringTransactionDTO) {
        RecurringTransactionEntity recurringTransactionEntity = new RecurringTransactionEntity();
        recurringTransactionEntity.setFrequency(recurringTransactionDTO.frequency());
        recurringTransactionEntity.setDescription(recurringTransactionDTO.description());
        recurringTransactionEntity.setFirstDate(LocalDate.parse(recurringTransactionDTO.firstDate()));
        recurringTransactionEntity.setLastDate(LocalDate.parse(recurringTransactionDTO.lastDate()));
        recurringTransactionEntity.setLastAmount(recurringTransactionDTO.lastAmount().amount());
        recurringTransactionEntity.setType(RecurringTransactionType.valueOf(recurringTransactionDTO.type()));
        recurringTransactionEntity.setStreamId(recurringTransactionDTO.streamId());
        recurringTransactionEntity.setAverageAmount(recurringTransactionDTO.averageAmount().amount());
        recurringTransactionEntity.setActive(recurringTransactionDTO.active());
        recurringTransactionEntity.setMerchantName(recurringTransactionDTO.merchantName());
        recurringTransactionEntity.setAccount(AccountEntity.builder().id(recurringTransactionDTO.accountId()).build());
        recurringTransactionEntity.setUser(UserEntity.builder().id(recurringTransactionDTO.userId()).build());
        return recurringTransactionEntity;
    }
}
