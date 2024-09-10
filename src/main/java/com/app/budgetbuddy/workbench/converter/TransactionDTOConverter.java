package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.TransactionDTO;
import com.plaid.client.model.Transaction;

import java.time.LocalDate;

public class TransactionDTOConverter implements Converter<TransactionDTO, Transaction> {

    @Override
    public Transaction convert(TransactionDTO transactionDTO) {
        Transaction transaction = new Transaction();
        transaction.setDate(LocalDate.parse(transactionDTO.date()));
        transaction.setMerchantName(transactionDTO.merchantName());
        transaction.setAmount(Double.valueOf(String.valueOf(transactionDTO.amount())));
        transaction.setTransactionId(transactionDTO.transactionId());
        transaction.setPending(transactionDTO.pending());
        transaction.setAuthorizedDate(LocalDate.parse(transactionDTO.authorizedDate()));
        transaction.setAccountId(transactionDTO.accountId());
        transaction.setName(transactionDTO.name());
        transaction.setCategoryId(transactionDTO.categoryId());
        return transaction;
    }
}
