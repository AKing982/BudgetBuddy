package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Table(name= "transactionCategories")
@Getter
@Setter
@Entity
@Builder
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="csv_transaction_id")
    private CSVTransactionEntity csvTransaction;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="sub_budgetId")
    private SubBudgetEntity subBudget;

    @Column(name="matched_category")
    private String matchedCategory;

    @Column(name="categorized_by", nullable=false)
    private String categorizedBy;

    @Column(name="categorized_date", nullable=false)
    private LocalDate categorized_date;

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


