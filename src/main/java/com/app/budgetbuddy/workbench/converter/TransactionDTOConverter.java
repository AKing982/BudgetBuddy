package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.TransactionDTO;
import com.plaid.client.model.Transaction;

import java.time.LocalDate;
import java.time.OffsetDateTime;

public class TransactionDTOConverter implements Converter<TransactionDTO, Transaction> {

    @Override
    public Transaction convert(TransactionDTO transactionDTO) {
        Transaction transaction = new Transaction();
        transaction.setDate(OffsetDateTime.parse(transactionDTO.date()).toLocalDate());
        transaction.setMerchantName(transactionDTO.merchantName());
        transaction.setAmount(Double.valueOf(String.valueOf(transactionDTO.amount())));
        transaction.setTransactionId(transactionDTO.transactionReferenceNumber());
        transaction.setPending(transactionDTO.pending());
        transaction.setAuthorizedDate(OffsetDateTime.parse(transactionDTO.authorizedDate()).toLocalDate());
        transaction.setAccountId(transactionDTO.accountId());
        transaction.setName(transactionDTO.name());
        transaction.setCategoryId(transactionDTO.categoryId());
        return transaction;
    }
}
