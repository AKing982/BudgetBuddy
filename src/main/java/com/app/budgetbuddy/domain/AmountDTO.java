package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.fasterxml.jackson.databind.deser.std.NumberDeserializers;

import java.io.IOException;
import java.math.BigDecimal;

@JsonDeserialize(using = AmountDTO.AmountDTODeserializer.class)
@JsonIgnoreProperties(ignoreUnknown = true)
public record AmountDTO(
        @JsonProperty("amount") BigDecimal amount,
        @JsonProperty("isoCurrency") String isoCurrency,
        @JsonProperty("unofficialCurrency") String unofficialCurrency
) {
    public static class AmountDTODeserializer extends JsonDeserializer<AmountDTO> {
        @Override
        public AmountDTO deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
            JsonNode node = p.getCodec().readTree(p);

            BigDecimal amount;
            if (node.isNumber()) {
                amount = BigDecimal.valueOf(node.asDouble());
            } else if (node.isObject() && node.has("amount")) {
                amount = BigDecimal.valueOf(node.get("amount").asDouble());
            } else {
                throw new IOException("Unexpected JSON structure for AmountDTO");
            }

            String isoCurrency = node.isObject() && node.has("isoCurrency") ? node.get("isoCurrency").asText() : null;
            String unofficialCurrency = node.isObject() && node.has("unofficialCurrency") ? node.get("unofficialCurrency").asText() : null;

            return new AmountDTO(amount, isoCurrency, unofficialCurrency);
        }
    }
}