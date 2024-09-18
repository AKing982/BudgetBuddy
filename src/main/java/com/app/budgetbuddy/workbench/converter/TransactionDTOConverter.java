package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.PlaidTransaction;
import com.app.budgetbuddy.domain.TransactionDTO;
import com.plaid.client.model.Transaction;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

public class TransactionDTOConverter implements Converter<TransactionDTO, PlaidTransaction> {

    private Logger LOGGER = LoggerFactory.getLogger(TransactionDTOConverter.class);

    @Override
    public PlaidTransaction convert(TransactionDTO transactionDTO) {
        PlaidTransaction transaction = new PlaidTransaction();
        transaction.setDate(OffsetDateTime.parse(transactionDTO.date()).toLocalDate());
        transaction.setMerchantName(transactionDTO.merchantName());
        transaction.setAmount(transactionDTO.amount());
        transaction.setTransactionId(transactionDTO.transactionId());
        transaction.setPending(transactionDTO.pending());
        transaction.setAuthorizedDate(OffsetDateTime.parse(transactionDTO.authorizedDate()).toLocalDate());
        transaction.setAccountId(transactionDTO.accountId());
        transaction.setName(transactionDTO.name());
        transaction.setLogo(transactionDTO.logoUrl());
        transaction.setCategoryId(transactionDTO.categoryId());
        transaction.setCategories(transactionDTO.categories());
        transaction.setIsoCurrencyCode(transactionDTO.isoCurrencyCode());
        transaction.setDescription(transactionDTO.name());
        LOGGER.info("Converted: {}", transaction);
        return transaction;
    }
}
