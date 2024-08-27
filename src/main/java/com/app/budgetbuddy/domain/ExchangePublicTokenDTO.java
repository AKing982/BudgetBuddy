package com.app.budgetbuddy.domain;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@NoArgsConstructor
public class ExchangePublicTokenDTO
{
    private Map<Long, String> exchangePublicTokenMap;

    public ExchangePublicTokenDTO(Map<Long, String> exchangePublicTokenMap)
    {
        this.exchangePublicTokenMap = exchangePublicTokenMap;
    }
}
