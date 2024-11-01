package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

@Table(name="categoryRules")
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class CategoryRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userid")
    private UserEntity user;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="categoryId")
    private CategoryEntity category;

    @Column(name="merchantPattern")
    private String merchantPattern;

    @Column(name="descriptionPattern")
    private String descriptionPattern;

    @Column(name="priority")
    private int priority;

    @Column(name="frequency")
    private String frequency;

    @Column(name="transaction_type")
    private String transactionType;

    @Column(name="isRecurring")
    private boolean isRecurring;

    @Column(name="isActive")
    private boolean isActive;


}
