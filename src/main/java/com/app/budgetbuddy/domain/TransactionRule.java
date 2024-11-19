package com.app.budgetbuddy.domain;

import lombok.*;

import java.util.List;

@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionRule
{
    private String transactionId;
    private String descriptionPattern;
    private String merchantPattern;
    private int priority;
    private List<String> categories;
    private String matchedCategory;

}
