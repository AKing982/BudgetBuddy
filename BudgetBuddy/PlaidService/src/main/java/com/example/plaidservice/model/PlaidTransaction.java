package com.example.plaidservice.model;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class PlaidTransaction
{
    private String transactionId;
    private String accountId;
    private LocalDate date;
    private String name;
    private BigDecimal amount;
    private String category;
    private String type;

    public PlaidTransaction(String transactionId, String accountId, LocalDate date, String name, BigDecimal amount, String category, String type) {
        this.transactionId = transactionId;
        this.accountId = accountId;
        this.date = date;
        this.name = name;
        this.amount = amount;
        this.category = category;
        this.type = type;
    }
}
