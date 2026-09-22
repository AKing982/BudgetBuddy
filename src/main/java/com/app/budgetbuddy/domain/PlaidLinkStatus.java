package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;

@Builder
public record PlaidLinkStatus(@JsonProperty("plaidLinkId") Long plaidLinkId, @JsonProperty("isLinked") Boolean isLinked, @JsonProperty("requiresLinkUpdate") Boolean requiresLinkUpdate) {
}
