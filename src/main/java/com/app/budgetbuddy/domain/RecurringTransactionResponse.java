package com.app.budgetbuddy.domain;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;

@Data
public class RecurringTransactionResponse
{
    private List<TransactionStream> inflowStreams;
    private List<TransactionStream> outflowStreams;
    private OffsetDateTime updatedDatetime;
    private String requestId;

    @Data
    public static class TransactionStream {
        private String accountId;
        private String streamId;
        private List<String> category;
        private String categoryId;
        private String description;
        private String merchantName;
        private LocalDate firstDate;
        private LocalDate lastDate;
        private String frequency;
        private List<String> transactionIds;
        private Amount averageAmount;
        private Amount lastAmount;
        private boolean isActive;
        private String status;
        private PersonalFinanceCategory personalFinanceCategory;
        private boolean isUserModified;
        private OffsetDateTime lastUserModifiedDatetime;

    }

    @Data
    public static class Amount {
        private BigDecimal amount;
        private String isoCurrency;
        private String unofficialCurrency;
    }

    @Data
    public static class PersonalFinanceCategory {
        private String primary;
        private String detailed;
        private String confidenceLevel;
    }
}
