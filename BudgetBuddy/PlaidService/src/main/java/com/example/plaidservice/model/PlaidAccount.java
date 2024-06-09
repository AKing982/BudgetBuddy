package com.example.plaidservice.model;

import lombok.Data;

@Data
public class PlaidAccount {
    private String accountId;
    private String name;
    private String officialName;
    private String type;
    private String subType;
    private Double balance;

    public PlaidAccount(String accountId, String name, String officialName, String type, String subType, Double balance) {
        this.accountId = accountId;
        this.name = name;
        this.officialName = officialName;
        this.type = type;
        this.subType = subType;
        this.balance = balance;
    }

    public PlaidAccount() {

    }
}
