package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.Transaction;
import com.app.budgetbuddy.entities.TransactionsEntity;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class TransactionEntityToModelConverter implements Converter<TransactionsEntity, Transaction>
{
    @Override
    public Transaction convert(TransactionsEntity transactionsEntity)
    {
            return Transaction.builder()
                            .accountId(transactionsEntity.getAccount().getId())
                            .transactionId(transactionsEntity.getId())
                            .amount(transactionsEntity.getAmount())
                            .categoryId(transactionsEntity.getCategoryId())
                            .description(transactionsEntity.getDescription())
                            .merchantName(transactionsEntity.getMerchantName())
                            .authorizedDate(transactionsEntity.getAuthorizedDate())
                            .isoCurrencyCodes(transactionsEntity.getIsoCurrencyCode())
                            .date(transactionsEntity.getPosted())
                            .posted(transactionsEntity.getPosted())
                            .logoUrl(transactionsEntity.getLogoUrl())
                            .pending(transactionsEntity.isPending())
                            .primaryCategory(transactionsEntity.getPrimaryCategory())
                            .secondaryCategory(transactionsEntity.getSecondaryCategory())
                            .name(transactionsEntity.getMerchantName())
                            .isSystemCategorized(transactionsEntity.isIssystemCategorized())
                            .build();
    }
}
