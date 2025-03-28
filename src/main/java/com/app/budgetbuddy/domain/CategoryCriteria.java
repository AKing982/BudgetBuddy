package com.app.budgetbuddy.domain;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CategoryCriteria
{
    private String categoryName;
    private int priority;
    private CategoryType categoryType;

    public CategoryCriteria(String categoryName, int priority, CategoryType categoryType) {
        this.categoryName = categoryName;
        this.priority = priority;
        this.categoryType = categoryType;
    }
}
