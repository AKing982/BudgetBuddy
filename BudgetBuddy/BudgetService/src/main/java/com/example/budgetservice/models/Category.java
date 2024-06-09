package com.example.budgetservice.models;

import com.example.budgetservice.CategoryType;
import lombok.Data;

import java.util.Locale;

@Data
public class Category
{
    private int id;
    private String name;
    private CategoryType categoryType;

    public Category(int id, String name, CategoryType categoryType) {
        this.id = id;
        this.name = name;
        this.categoryType = categoryType;
    }
}
