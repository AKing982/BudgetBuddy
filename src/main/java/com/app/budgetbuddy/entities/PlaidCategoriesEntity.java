package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import lombok.ToString;

@Entity
@Table(name="plaidCategories")
@Getter
@Setter
@ToString
public class PlaidCategoriesEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="category_Id")
    private String categoryId;

    @Column(name="primary_category")
    private String primaryCategory;

    @Column(name="secondary_category")
    private String secondaryCategory;

    @Column(name="matched_category")
    private String matchedCategory;

}
