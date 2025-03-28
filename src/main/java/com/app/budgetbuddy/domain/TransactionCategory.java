package com.app.budgetbuddy.domain;

import lombok.*;

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
    private String matchedCategory;
    private String plaidCategory;
    private String categorizedBy;
    private int priority;
    private boolean isRecurring;
    private LocalDateTime createdAt;
}
