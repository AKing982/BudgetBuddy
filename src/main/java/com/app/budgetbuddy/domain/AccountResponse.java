package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
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

    public AccountResponse(String accountId, String name, BigDecimal balance, String type, String mask, String officialName, String subtype) {
        this.accountId = accountId;
        this.name = name;
        this.balance = balance;
        this.type = type;
        this.mask = mask;
        this.officialName = officialName;
        this.subtype = subtype;
    }

    public AccountResponse(String accountId, Long userId, String accountName, BigDecimal balance, String type, String mask, String type1, String officialName, String subtype) {
        this.accountId = accountId;
        this.userId = userId;
        this.name = accountName;
        this.balance = balance;
        this.type = type;
        this.mask = mask;
        this.officialName = officialName;
        this.subtype = subtype;
    }
}
