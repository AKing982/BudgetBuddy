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
    private String matchedCategory;
    private String plaidCategory;
    private String categorizedBy;
    private LocalDate categorized_date;
    private int priority;
    private boolean isRecurring;
    private LocalDateTime createdAt;

    public static TransactionCategory build(final String transactionId, final String matchedCategory, final String plaidCategory, final String categorizedBy, final int priority, final boolean isRecurring)
    {
        return TransactionCategory.builder()
                .transactionId(transactionId)
                .matchedCategory(matchedCategory)
                .plaidCategory(plaidCategory)
                .categorizedBy(categorizedBy)
                .categorized_date(LocalDate.now())
                .priority(priority)
                .isRecurring(isRecurring)
                .build();
    }
}
