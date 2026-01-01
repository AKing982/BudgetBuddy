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

    @Enumerated(EnumType.STRING)
    @Column(name="ruleType", nullable=false)
    private RuleType ruleType;

    @Enumerated(EnumType.STRING)
    @Column(name="csv_rule")
    private CSVRule csvRule;

    @Column(name="csv_value", length=500)
    private String csvValue;

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

    public boolean isCSVRule() {
        return ruleType == RuleType.CSV;
    }

    public boolean isPlaidRule() {
        return ruleType == RuleType.PLAID;
    }

}
