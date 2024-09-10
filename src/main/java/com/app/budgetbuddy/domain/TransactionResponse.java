package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TransactionResponse
{
    private String transactionId;
    private String accountId;
    private BigDecimal amount;
//    private List<String> categories;
    private String categoryId;
    private LocalDate date;
    private String name;
    private String merchantName;
    private boolean pending;
//    private String logoURL;
    private LocalDate authorizedDate;
//    private String transactionType;

}
