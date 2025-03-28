package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Table(name= "transactionCategories")
@Getter
@Setter
@Entity
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class TransactionCategoryEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="transaction_id")
    private TransactionsEntity transaction;

    @Column(name="matched_category", nullable=false)
    private String matchedCategory;

    @Column(name="plaid_category", nullable=false)
    private String plaidCategory;

    @Column(name="categorized_by", nullable=false)
    private String categorizedBy;

    @Column(name="rule_priority")
    private int rulePriority;

    @Column(name="isRecurring")
    private boolean isRecurring;

    @Column(name="created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (categorizedBy == null) {
            categorizedBy = "SYSTEM";
        }
    }
}


