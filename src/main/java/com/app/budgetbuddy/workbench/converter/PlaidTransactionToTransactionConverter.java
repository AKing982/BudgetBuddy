package com.app.budgetbuddy.workbench.converter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import com.app.budgetbuddy.domain.Transaction;

@Component
@Slf4j
public class PlaidTransactionToTransactionConverter implements Converter<com.plaid.client.model.Transaction, Transaction>
{

    @Override
    public Transaction convert(com.plaid.client.model.Transaction transaction) {
//        log.info("Converting Plaid Transaction: {}", transaction.toString());
        List<String> categories = transaction.getCategory();
        LocalDate authorizedDate = transaction.getAuthorizedDate() != null
                ? transaction.getAuthorizedDate()
                : transaction.getDate();

        // Fallback logic for merchantName
        String merchantName = transaction.getMerchantName() != null
                ? transaction.getMerchantName()
                : transaction.getOriginalDescription();

        if(categories != null && categories.size() == 2)
        {
            return Transaction.builder()
                    .accountId(transaction.getAccountId())
                    .amount(BigDecimal.valueOf(transaction.getAmount()))
                    .authorizedDate(authorizedDate)
                    .categoryId(transaction.getCategoryId())
                    .date(transaction.getDate())
                    .transactionId(transaction.getTransactionId())
                    .description(transaction.getOriginalDescription())
                    .posted(transaction.getDate())
                    .merchantName(merchantName)
                    .name(transaction.getName())
                    .pending(transaction.getPending())
                    .primaryCategory(categories.get(0))
                    .secondaryCategory(categories.get(1))
                    .transactionId(transaction.getTransactionId())
                    .isoCurrencyCodes(transaction.getIsoCurrencyCode())
                    .logoUrl(transaction.getLogoUrl())
                    .isSystemCategorized(false)
                    .build();
        }else if(categories != null && categories.size() == 1)
        {
            return Transaction.builder()
                    .accountId(transaction.getAccountId())
                    .amount(BigDecimal.valueOf(transaction.getAmount()))
                    .authorizedDate(authorizedDate)
                    .categoryId(transaction.getCategoryId())
                    .date(transaction.getDate())
                    .description(transaction.getOriginalDescription())
                    .posted(transaction.getDate())
                    .merchantName(merchantName)
                    .name(transaction.getName())
                    .pending(transaction.getPending())
                    .primaryCategory(categories.get(0))
                    .secondaryCategory("")
                    .transactionId(transaction.getTransactionId())
                    .isoCurrencyCodes(transaction.getIsoCurrencyCode())
                    .logoUrl(transaction.getLogoUrl())
                    .isSystemCategorized(false)
                    .build();
        }
        return null;
    }

}