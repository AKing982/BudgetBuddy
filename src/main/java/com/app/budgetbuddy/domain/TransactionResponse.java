package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@NoArgsConstructor
public class TransactionResponse
{
    private String transactionId;
    private String accountId;
    private BigDecimal amount;
    private List<String> categories;
    private String categoryId;
    private LocalDate date;
    private String name;
    private String merchantName;
    private boolean pending;
    private String logoURL;
    private LocalDate authorizedDate;
    private LocalDate posted;
//    private String transactionType;


    public TransactionResponse(String transactionId, String accountId, BigDecimal amount, String categoryId, LocalDate date, String name, String merchantName, boolean pending, String logoURL, LocalDate authorizedDate) {
        this.transactionId = transactionId;
        this.accountId = accountId;
        this.amount = amount;
        this.categoryId = categoryId;
        this.date = date;
        this.name = name;
        this.merchantName = merchantName;
        this.pending = pending;
        this.logoURL = logoURL;
        this.authorizedDate = authorizedDate;
    }

    public TransactionResponse(String transactionId, String accountId, BigDecimal amount, List<String> categories, String categoryId, LocalDate date, String name, String merchantName, boolean pending, String logoURL, LocalDate authorizedDate, LocalDate posted) {
        this.transactionId = transactionId;
        this.accountId = accountId;
        this.amount = amount;
        this.categories = categories;
        this.categoryId = categoryId;
        this.date = date;
        this.name = name;
        this.merchantName = merchantName;
        this.pending = pending;
        this.logoURL = logoURL;
        this.authorizedDate = authorizedDate;
        this.posted = posted;
    }
}
