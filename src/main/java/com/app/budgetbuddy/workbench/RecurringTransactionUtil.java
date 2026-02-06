package com.app.budgetbuddy.workbench;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.plaid.client.model.TransactionStream;
import org.springframework.stereotype.Component;

@Component
public class RecurringTransactionUtil
{
    public List<RecurringTransaction> convertTransactionStreams(List<TransactionStream> outflowing, List<TransactionStream> inflowing)
    {
        List<RecurringTransaction> master = new ArrayList<>();
        List<RecurringTransaction> outflowRecurring = createRecurringList(outflowing, "Outflow");
        List<RecurringTransaction> inflowRecurring = createRecurringList(inflowing, "Inflow");

        master.addAll(outflowRecurring);
        master.addAll(inflowRecurring);
        return master;
    }

    private List<RecurringTransaction> createRecurringList(List<TransactionStream> stream, String type)
    {
        if(stream == null || stream.isEmpty())
        {
            return Collections.emptyList();
        }
        return stream.stream()
                .<RecurringTransaction>map((TransactionStream transactionStream) -> {
                    String acctId = transactionStream.getAccountId();
                    String streamId = transactionStream.getStreamId();
                    String categoryId = transactionStream.getCategoryId();
                    String description = transactionStream.getDescription();
                    List<String> categories = transactionStream.getCategory();
                    String merchantName = transactionStream.getMerchantName();
                    LocalDate firstDate = transactionStream.getFirstDate();
                    LocalDate lastDate = transactionStream.getLastDate();
                    String frequency = transactionStream.getFrequency().getValue();
                    List<String> transactionIds = transactionStream.getTransactionIds();
                    Double averageAmount = transactionStream.getAverageAmount().getAmount();
                    double lastAmount = transactionStream.getLastAmount().getAmount();
                    boolean isActive = transactionStream.getIsActive();

                    return RecurringTransaction.builder()
                            .accountId(acctId)
                            .active(isActive)
                            .merchantName(merchantName)
                            .description(description)
                            .firstDate(firstDate)
                            .lastDate(lastDate)
                            .averageAmount(BigDecimal.valueOf(averageAmount))
                            .categoryId(categoryId)
                            .streamId(streamId)
                            .frequency(frequency)
                            .type(type)
                            .build();
                })
                .toList();

    }
}