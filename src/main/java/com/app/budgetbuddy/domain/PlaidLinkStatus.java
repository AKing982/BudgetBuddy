package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PlaidLinkStatus(@JsonProperty("isLinked") Boolean isLinked, @JsonProperty("requiresLinkUpdate") Boolean requiresLinkUpdate) {
}
