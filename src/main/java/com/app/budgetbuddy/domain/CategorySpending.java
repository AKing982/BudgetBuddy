package com.app.budgetbuddy.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class CategorySpending
{
    private String category;
    private BigDecimal totalCategorySpending;
    private List<Transaction> transactions;
}
