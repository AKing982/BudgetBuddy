package com.app.budgetbuddy.workbench.converter;

import com.plaid.client.model.Transaction;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

//@Component
//@Slf4j
//@Deprecated
//public class TransactionBaseToModelConverter implements Converter<Transaction, com.app.budgetbuddy.domain.Transaction>
//{
//
//    @Override
//    public com.app.budgetbuddy.domain.Transaction convert(Transaction transaction)
//    {
//        com.app.budgetbuddy.domain.Transaction transactionModel = new com.app.budgetbuddy.domain.Transaction();
//        transactionModel.setTransactionId(transaction.getTransactionId());
//        transactionModel.setAmount(BigDecimal.valueOf(transaction.getAmount()));
//        transactionModel.setDescription(transaction.getOriginalDescription());
//        transactionModel.setPending(transaction.getPending());
//        transactionModel.setAuthorizedDate(transaction.getAuthorizedDate());
//        transactionModel.setAccountId(transaction.getAccountId());
//        transactionModel.setCategories(transaction.getCategory());
//        transactionModel.setCategoryId(transaction.getCategoryId());
//        transactionModel.setDate(transaction.getDate());
//        transactionModel.setIsoCurrencyCode(transaction.getIsoCurrencyCode());
//        transactionModel.setMerchantName(transaction.getMerchantName());
//        transactionModel.setPosted(transaction.getDate());
//        transactionModel.setName(transaction.getName());
//        return transactionModel;
//    }
//}
