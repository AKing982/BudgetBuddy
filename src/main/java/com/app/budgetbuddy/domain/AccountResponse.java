package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AccountResponse
{
    private String accountId;
    private String name;
    private BigDecimal balance;
    private String type;
    private String mask;
    private String officialName;
    private String subtype;

}
