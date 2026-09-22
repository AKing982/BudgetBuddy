package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@Builder
@AllArgsConstructor
public class AccountResponse
{
    private String accountId;
    private Long userId;
    private String name;
    private BigDecimal balance;
    private String type;
    private String mask;
    private String officialName;
    private String subtype;
    private String itemId;

    public AccountResponse(String accountId, String name, BigDecimal balance, String type, String mask, String officialName, String subtype) {
        this.accountId = accountId;
        this.name = name;
        this.balance = balance;
        this.type = type;
        this.mask = mask;
        this.officialName = officialName;
        this.subtype = subtype;
    }
}
