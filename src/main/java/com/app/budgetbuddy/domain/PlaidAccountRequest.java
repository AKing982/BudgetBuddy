package com.app.budgetbuddy.domain;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

public record PlaidAccountRequest(@JsonProperty("userId") Long userId, @JsonProperty("accounts") List<PlaidAccount> accounts) {
}
