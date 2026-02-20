package com.app.budgetbuddy.domain;

import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor(access= AccessLevel.PUBLIC)
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@ToString
@Builder
public class TransactionCSV implements Comparable<TransactionCSV>
{
    private Long id;
    private String transactionId;
    private String account;
    private int suffix;
    private long sequenceNo;
    private LocalDate transactionDate;
    private BigDecimal transactionAmount;
    private String description;
    private String merchantName;
    private String extendedDescription;
    private LocalDate electronicTransactionDate;
    private LocalDate effectiveDate;
    private BigDecimal balance;
    private String institution_id;
    private String category;
    private String type;

    @Override
    public int compareTo(@NotNull TransactionCSV o) {
        return this.transactionDate.compareTo(o.transactionDate);
    }
}
