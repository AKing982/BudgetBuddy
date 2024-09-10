package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.plaid.client.model.TransactionCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record TransactionDTO(@JsonProperty("accountId") String accountId, @JsonProperty("amount") BigDecimal amount, @JsonProperty("isoCurrencyCode") String isoCurrencyCode, @JsonProperty("categoryId") String categoryId, @JsonProperty("date") String date,
                             @JsonProperty("merchantName") String merchantName, @JsonProperty("name") String name, @JsonProperty("pending") Boolean pending, @JsonProperty("transactionId") String transactionId,
                             @JsonProperty("authorizedDate") String authorizedDate) {
}
