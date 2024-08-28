package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

public record PlaidLinkRequest(@JsonProperty("accessToken") String accessToken,
                               @JsonProperty("itemID") String itemID,
                               @JsonProperty("userID") String userID) {
}
