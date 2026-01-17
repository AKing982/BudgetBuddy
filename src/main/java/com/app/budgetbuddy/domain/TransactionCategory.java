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
    private Long csv_transaction_id;
    private Long category_id;
    private String category;
    private String categorizedBy;
    private LocalDate categorized_date;
    private boolean isCategorized;
    private LocalDateTime createdAt;

}
