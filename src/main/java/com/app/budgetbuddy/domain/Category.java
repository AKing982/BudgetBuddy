package com.app.budgetbuddy.domain;

import lombok.Data;

@Data
public class Category
{
    private Long id;
    private String name;
    private String description;

    public Category(Long id, String name, String description) {
        this.id = id;
        this.name = name;
        this.description = description;
    }
}
