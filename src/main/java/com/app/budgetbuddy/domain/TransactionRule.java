package com.app.budgetbuddy.domain;

import lombok.*;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.util.List;

@Getter
@Setter
@Builder
@ToString
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionRule
{
    private Long id;
    private Long userId;
    private String categoryName;
    private String descriptionRule;
    private String merchantRule;
    private String extendedDescriptionRule;
    private BigDecimal amountMin;
    private BigDecimal amountMax;
    private int priority;
    private String transactionType;
    private boolean isActive;
    private Timestamp dateCreated;
    private Timestamp dateModified;


}
