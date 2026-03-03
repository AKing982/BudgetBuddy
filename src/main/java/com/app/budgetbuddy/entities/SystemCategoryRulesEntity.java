package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.springframework.stereotype.Service;

@Setter
@Getter
@Entity
@Table(name="systemCategoryRules")
public class SystemCategoryRulesEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="plaid_category_id")
    private PlaidCategoriesEntity plaidCategoryId;

    @Column(name="merchant")
    private String merchant;

    @Column(name="category")
    private String category;

    @Column(name="amount")
    private Double amount;

    @Column(name="matched_category")
    private String matchedCategory;

    @Column(name="priority")
    private int priority;

    @Column(name="type")
    private String type;

}
