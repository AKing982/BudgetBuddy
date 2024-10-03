package com.app.budgetbuddy.domain;

import com.app.budgetbuddy.workbench.LocalDateArrayDeserializer;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;

import java.math.BigDecimal;
import java.time.LocalDate;

public record RecurringTransactionDTO(@JsonProperty("userId") Long userId,
                                      @JsonProperty("accountId") String accountId,
                                      @JsonProperty("streamId") String streamId,
                                      @JsonProperty("categoryId") String categoryId,
                                      @JsonProperty("description") String description,
                                      @JsonProperty("merchantName") String merchantName,
//                                      @JsonDeserialize(using= LocalDateArrayDeserializer.class)
                                      @JsonProperty("firstDate") String firstDate,
//                                      @JsonDeserialize(using= LocalDateArrayDeserializer.class)
                                      @JsonProperty("lastDate") String lastDate,
                                      @JsonProperty("frequency") String frequency,
                                      @JsonProperty("averageAmount")AmountDTO averageAmount,
                                      @JsonProperty("lastAmount") AmountDTO lastAmount,
                                      @JsonProperty("active") Boolean active,
                                      @JsonProperty("type") String type) {
}
