package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.CSVRule;
import com.app.budgetbuddy.domain.RuleType;
import jakarta.persistence.*;
import lombok.*;

@Table(name="transactionRules")
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionRuleEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userid")
    private UserEntity user;

    @Column(name="category")
    private String category;

    @Column(name="merchantPattern")
    private String merchantPattern;

    @Column(name="descriptionPattern")
    private String descriptionPattern;

    @Column(name="priority")
    private int priority;

    @Column(name="transaction_type")
    private String transactionType;

    @Column(name="isRecurring")
    private boolean isRecurring;

    @Column(name="isSystemRule")
    private boolean isSystemRule;

    @Column(name="isActive")
    private boolean isActive;
}
