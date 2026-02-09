package com.app.budgetbuddy.domain;

import lombok.*;
import lombok.experimental.SuperBuilder;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@ToString(callSuper = true)
@SuperBuilder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class RecurringTransaction extends Transaction
{
    private String streamId;
    private LocalDate firstDate;
    private LocalDate lastDate;
    private String frequency;
    private BigDecimal averageAmount;
    private BigDecimal lastAmount;
    private Boolean active;
    private String type;

    public RecurringTransaction(String accountId, BigDecimal amount, String isoCurrencyCode, String primaryCategory, String secondaryCategory, String categoryId, LocalDate date, String description, String merchantName, String name, Boolean pending, String transactionId, LocalDate authorizedDate, String logoUrl, LocalDate posted, boolean isSystemCategorized, String streamId, LocalDate firstDate, LocalDate lastDate, String frequency, BigDecimal averageAmount, BigDecimal lastAmount, Boolean active, String type) {
        super(accountId, amount, isoCurrencyCode, primaryCategory, secondaryCategory, categoryId, date, description, merchantName, name, pending, transactionId, authorizedDate, logoUrl, posted, isSystemCategorized);
        this.streamId = streamId;
        this.firstDate = firstDate;
        this.lastDate = lastDate;
        this.frequency = frequency;
        this.averageAmount = averageAmount;
        this.lastAmount = lastAmount;
        this.active = active;
        this.type = type;
    }
}
