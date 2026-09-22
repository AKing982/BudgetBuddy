package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@Builder
public class InvestmentTransaction
{
    private Long id;
    private String investmentTransactionId;
    private String accountId;
    private Long holdings_id;
    private String securityId;
    private LocalDate date;
    private String name;
    private double amount;
    private double quantity;
    private double price;
    private double fees;
    private String type;
    private String subtype;
}
