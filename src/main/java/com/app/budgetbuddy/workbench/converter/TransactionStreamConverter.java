package com.app.budgetbuddy.workbench.converter;

import com.app.budgetbuddy.domain.RecurringTransactionResponse;
import com.plaid.client.model.TransactionStream;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

public class TransactionStreamConverter
{
    public static List<RecurringTransactionResponse.TransactionStream> convertTransactionStreams(List<TransactionStream> plaidStreams){
        if(plaidStreams == null){
            return new ArrayList<>();
        }
        List<RecurringTransactionResponse.TransactionStream> convertedStreams = new ArrayList<>();
        for(TransactionStream transactionStream : plaidStreams){
            convertedStreams.add(convertTransactionStream(transactionStream));
        }
        return convertedStreams;
    }

    private static RecurringTransactionResponse.TransactionStream convertTransactionStream(TransactionStream plaidStream) {
        RecurringTransactionResponse.TransactionStream convertedStream = new RecurringTransactionResponse.TransactionStream();

        convertedStream.setAccountId(plaidStream.getAccountId());
        convertedStream.setStreamId(plaidStream.getStreamId());
        convertedStream.setCategory(plaidStream.getCategory());
        convertedStream.setCategoryId(plaidStream.getCategoryId());
        convertedStream.setDescription(plaidStream.getDescription());
        convertedStream.setMerchantName(plaidStream.getMerchantName());
        convertedStream.setFirstDate(plaidStream.getFirstDate());
        convertedStream.setLastDate(plaidStream.getLastDate());
        convertedStream.setFrequency(plaidStream.getFrequency().toString());
        convertedStream.setTransactionIds(plaidStream.getTransactionIds());
        convertedStream.setAverageAmount(convertAmount(plaidStream.getAverageAmount()));
        convertedStream.setLastAmount(convertAmount(plaidStream.getLastAmount()));
        convertedStream.setActive(plaidStream.getIsActive());
        convertedStream.setStatus(plaidStream.getStatus().toString());
        convertedStream.setPersonalFinanceCategory(convertPersonalFinanceCategory(plaidStream.getPersonalFinanceCategory()));
        convertedStream.setUserModified(plaidStream.getIsUserModified());
        convertedStream.setLastUserModifiedDatetime(plaidStream.getLastUserModifiedDatetime());

        return convertedStream;
    }

    private static RecurringTransactionResponse.Amount convertAmount(com.plaid.client.model.TransactionStreamAmount plaidAmount) {
        if (plaidAmount == null) {
            return null;
        }
        RecurringTransactionResponse.Amount convertedAmount = new RecurringTransactionResponse.Amount();
        convertedAmount.setAmount(BigDecimal.valueOf(plaidAmount.getAmount()));
        convertedAmount.setIsoCurrency(plaidAmount.getIsoCurrencyCode());
        convertedAmount.setUnofficialCurrency(plaidAmount.getUnofficialCurrencyCode());
        return convertedAmount;
    }

    private static RecurringTransactionResponse.PersonalFinanceCategory convertPersonalFinanceCategory(
            com.plaid.client.model.PersonalFinanceCategory plaidCategory) {
        if (plaidCategory == null) {
            return null;
        }
        RecurringTransactionResponse.PersonalFinanceCategory convertedCategory = new RecurringTransactionResponse.PersonalFinanceCategory();
        convertedCategory.setPrimary(plaidCategory.getPrimary());
        convertedCategory.setDetailed(plaidCategory.getDetailed());
        convertedCategory.setConfidenceLevel(plaidCategory.getConfidenceLevel().toString());
        return convertedCategory;
    }
}
