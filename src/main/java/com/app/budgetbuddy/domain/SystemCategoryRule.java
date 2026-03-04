package com.app.budgetbuddy.domain;

import lombok.*;

@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@Getter
@Setter
@Builder
public class SystemCategoryRule
{
    private Long id;
    private String plaid_category_id;
    private String merchant;
    private String category;
    private double amount;
    private String matched_category;
    private int priority;
    private String type;
}
