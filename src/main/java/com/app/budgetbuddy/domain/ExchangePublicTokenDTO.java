package com.app.budgetbuddy.domain;

import java.util.Map;

public record ExchangePublicTokenDTO(Map<Long, String> publicTokenMap) {
}
