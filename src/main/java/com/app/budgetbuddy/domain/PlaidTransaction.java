package com.app.budgetbuddy.domain;

import com.plaid.client.model.TransactionCode;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class PlaidTransaction
{
    private String transactionId;
    private String accountId;
    private BigDecimal amount;
    private String isoCurrencyCode;
    private List<String> categories;
    private String categoryId;
    private LocalDate date;
    private String merchantName;
    private String description;
    private String name;
    private Boolean pending;
    private LocalDate authorizedDate;
    private TransactionCode transactionCode;
}
