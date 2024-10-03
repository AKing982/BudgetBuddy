package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.datatype.jsr310.deser.LocalDateDeserializer;
import com.fasterxml.jackson.datatype.jsr310.ser.LocalDateSerializer;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public record Transaction(@JsonProperty("accountId") String accountId,
                          @JsonProperty("amount") BigDecimal amount,
                          @JsonProperty("isoCurrencyCode") String isoCurrencyCode,
                          @JsonProperty("categories") List<String> categories,
                          @JsonProperty("categoryId") String categoryId,
                          @JsonProperty("date") @JsonDeserialize(using= LocalDateDeserializer.class) LocalDate date,
                          @JsonProperty("description") String description,
                          @JsonProperty("merchantName") String merchantName,
                          @JsonProperty("name") String name,
                          @JsonProperty("pending") Boolean pending,
                          @JsonProperty("transactionId") String transactionId,
                          @JsonProperty("authorizedDate")@JsonDeserialize(using= LocalDateDeserializer.class) LocalDate authorizedDate,
                          @JsonProperty("logoURL") String logoUrl,
                          @JsonProperty("posted") @JsonDeserialize(using= LocalDateDeserializer.class) LocalDate posted) {
}
