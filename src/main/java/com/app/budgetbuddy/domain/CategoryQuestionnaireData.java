package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Data
@AllArgsConstructor
@NoArgsConstructor
@ToString
public class CategoryQuestionnaireData
{
    private String categoryName;
    private Double currentSpending;
    private Double spendingLimit;
    private Integer priority;
}
