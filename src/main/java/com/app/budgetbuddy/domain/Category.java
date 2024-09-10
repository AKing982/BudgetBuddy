package com.app.budgetbuddy.domain;

import jakarta.persistence.Embeddable;
import lombok.AccessLevel;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Embeddable
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class Category
{
    private String categoryName;
    private String categoryDescription;

    public Category(String name, String description) {
        this.categoryName = name;
        this.categoryDescription = description;
    }
}
