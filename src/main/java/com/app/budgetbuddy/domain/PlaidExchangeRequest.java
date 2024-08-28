package com.app.budgetbuddy.domain;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
public class PlaidExchangeRequest
{
    private Long userId;
    private String publicToken;

    public PlaidExchangeRequest(Long userId, String publicToken)
    {
        this.userId = userId;
        this.publicToken = publicToken;
    }
}
