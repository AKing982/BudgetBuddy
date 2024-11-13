package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
public class Transaction {
    private final String accountId;
    private final BigDecimal amount;
    private final String isoCurrencyCode;
    private final List<String> categories;
    private final String categoryId;

    @JsonDeserialize(using = LocalDateDeserializer.class)
    private final LocalDate date;

    private final String description;
    private final String merchantName;
    private final String name;
    private final Boolean pending;
    private final String transactionId;

    @JsonDeserialize(using = LocalDateDeserializer.class)
    private final LocalDate authorizedDate;

    private final String logoUrl;

    @JsonDeserialize(using = LocalDateDeserializer.class)
    private final LocalDate posted;

    public Transaction(
            @JsonProperty("accountId") String accountId,
            @JsonProperty("amount") BigDecimal amount,
            @JsonProperty("isoCurrencyCode") String isoCurrencyCode,
            @JsonProperty("categories") List<String> categories,
            @JsonProperty("categoryId") String categoryId,
            @JsonProperty("date") LocalDate date,
            @JsonProperty("description") String description,
            @JsonProperty("merchantName") String merchantName,
            @JsonProperty("name") String name,
            @JsonProperty("pending") Boolean pending,
            @JsonProperty("transactionId") String transactionId,
            @JsonProperty("authorizedDate") LocalDate authorizedDate,
            @JsonProperty("logoURL") String logoUrl,
            @JsonProperty("posted") LocalDate posted) {
        this.accountId = accountId;
        this.amount = amount;
        this.isoCurrencyCode = isoCurrencyCode;
        this.categories = categories;
        this.categoryId = categoryId;
        this.date = date;
        this.description = description;
        this.merchantName = merchantName;
        this.name = name;
        this.pending = pending;
        this.transactionId = transactionId;
        this.authorizedDate = authorizedDate;
        this.logoUrl = logoUrl;
        this.posted = posted;
    }
}