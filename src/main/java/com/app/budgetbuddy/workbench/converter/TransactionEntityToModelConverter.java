package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.TransactionsEntity;
import org.springframework.stereotype.Component;

import java.util.List;

@Component
public class TransactionEntityToModelConverter implements Converter<TransactionsEntity, Transaction>
{
    @Override
    public Transaction convert(TransactionsEntity transactionsEntity) {
        return new Transaction(
                transactionsEntity.getAccount().getId(),
                transactionsEntity.getAmount(),
                transactionsEntity.getIsoCurrencyCode(),
                List.of(transactionsEntity.getCategory().getName()),
                transactionsEntity.getCategory().getId(),
                transactionsEntity.getCreateDate(),
                transactionsEntity.getDescription(),
                transactionsEntity.getMerchantName(),
                transactionsEntity.getMerchantName(),
                transactionsEntity.isPending(),
                transactionsEntity.getId(),
                transactionsEntity.getAuthorizedDate(),
                transactionsEntity.getLogoUrl(),
                transactionsEntity.getPosted()
        );
    }
}
