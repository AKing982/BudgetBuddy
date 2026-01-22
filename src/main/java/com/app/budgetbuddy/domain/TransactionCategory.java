package com.app.budgetbuddy.domain;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
@ToString
public class TransactionCategory
{
    private Long id;
    private String transactionId;
    private Long csvTransactionId;
    private String category;
    private String categorizedBy;
    private LocalDate categorizedDate;
    private boolean isCategorized;
    private LocalDateTime createdAt;

}
