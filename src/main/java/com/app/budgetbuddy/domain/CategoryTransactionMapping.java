package com.app.budgetbuddy.domain;

import lombok.*;

@Data
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryTransactionMapping
{
    private String category;
    private String transactionId;
}
