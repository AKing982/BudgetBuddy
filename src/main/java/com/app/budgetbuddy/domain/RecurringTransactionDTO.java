package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.math.BigDecimal;

public record RecurringTransactionDTO(@JsonProperty("userId") Long userId,
                                      @JsonProperty("accountId") String accountId,
                                      @JsonProperty("streamId") String streamId,
                                      @JsonProperty("categoryId") String categoryId,
                                      @JsonProperty("description") String description,
                                      @JsonProperty("merchantName") String merchantName,
                                      @JsonProperty("firstDate") String firstDate,
                                      @JsonProperty("lastDate") String lastDate,
                                      @JsonProperty("frequency") String frequency,
                                      @JsonProperty("averageAmount")BigDecimal averageAmount,
                                      @JsonProperty("lastAmount") BigDecimal lastAmount,
                                      @JsonProperty("active") Boolean active,
                                      @JsonProperty("type") String type) {
}
