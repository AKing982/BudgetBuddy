package com.app.budgetbuddy.domain;

import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class PlaidAccount
{
    private String accountId;
    private String name;
    private String officialName;
    private BigDecimal balance;
    private String type;
    private String subtype;
    private String mask;

}
