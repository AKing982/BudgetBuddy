package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class TransactionCategoryTest
{
    private Long transactionId;
    private String matchedCategory;
    private String merchantName;
    private String name;
    private BigDecimal amount;
    private LocalDate postedDate;
    private String categoryId;
    private String primaryCategory;
    private String secondaryCategory;
    private String description;
    private String categorizedBy;

}
