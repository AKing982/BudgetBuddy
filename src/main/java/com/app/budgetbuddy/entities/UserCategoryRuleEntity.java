package com.app.budgetbuddy.entities;

import jakarta.persistence.*;

@Entity
@Table(name="user_category_rules")
public class UserCategoryRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="id")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="categoryid")
    private CategoryEntity category;

    @Column(name="merchantPattern")
    private String merchantPattern;

    @Column(name="descriptionPattern")
    private String descriptionPattern;




}
