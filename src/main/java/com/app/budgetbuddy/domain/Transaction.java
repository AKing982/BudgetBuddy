package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@ToString
@Setter
public class Transaction {
    private String accountId;
    private BigDecimal amount;
    private String isoCurrencyCode;
    private List<String> categories;
    private String categoryId;

    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate date;

    private String description;
    private String merchantName;
    private String name;
    private Boolean pending;
    private String transactionId;

    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate authorizedDate;

    private String logoUrl;

    @JsonDeserialize(using = LocalDateDeserializer.class)
    private LocalDate posted;

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

    public Transaction(){
    }
}