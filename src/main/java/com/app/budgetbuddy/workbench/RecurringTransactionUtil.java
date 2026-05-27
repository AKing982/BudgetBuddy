package com.app.budgetbuddy.workbench;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import com.app.budgetbuddy.domain.RecurringTransaction;
import com.plaid.client.model.TransactionStream;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Component
@Slf4j
public class RecurringTransactionUtil
{
    public List<RecurringTransaction> convertTransactionStreams(List<TransactionStream> outflowing, List<TransactionStream> inflowing)
    {
        List<RecurringTransaction> master = new ArrayList<>();
        List<RecurringTransaction> outflowRecurring = createRecurringList(outflowing, "Outflow");
        log.info("Outflowing Transactions: {}", outflowRecurring);
        List<RecurringTransaction> inflowRecurring = createRecurringList(inflowing, "Inflow");
        log.info("Inflowing Transactions: {}", inflowRecurring);
        master.addAll(outflowRecurring);
        master.addAll(inflowRecurring);
        log.info("Total Transactions: {}", master.size());
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
                    String merchantName = transactionStream.getMerchantName();
                    LocalDate firstDate = transactionStream.getFirstDate();
                    LocalDate lastDate = transactionStream.getLastDate();
                    String frequency = transactionStream.getFrequency().getValue();
                    List<String> transactionIds = transactionStream.getTransactionIds();
                    Double averageAmount = transactionStream.getAverageAmount().getAmount();
                    double lastAmount = transactionStream.getLastAmount().getAmount();
                    boolean isActive = transactionStream.getIsActive();
                    List<String> categories = transactionStream.getCategory();
                    String primaryCategory = (categories != null && !categories.isEmpty())
                            ? categories.get(0) : null;
                    String secondaryCategory = (categories != null && categories.size() > 1)
                            ? categories.get(1) : null;
                    return RecurringTransaction.builder()
                            .accountId(acctId)
                            .active(isActive)
                            .merchantName(merchantName)
                            .description(description)
                            .firstDate(firstDate)
                            .lastAmount(BigDecimal.valueOf(lastAmount))
                            .lastDate(lastDate)
                            .primaryCategory(primaryCategory)
                            .secondaryCategory(secondaryCategory)
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