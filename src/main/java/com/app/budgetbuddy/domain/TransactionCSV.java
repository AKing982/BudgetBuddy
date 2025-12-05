package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
public class TransactionCSV
{
    private Long id;
    private String account;
    private int suffix;
    private long sequenceNo;
    private LocalDate transactionDate;
    private BigDecimal transactionAmount;
    private String description;
    private String extendedDescription;
    private LocalDate electronicTransactionDate;
    private BigDecimal balance;
}
