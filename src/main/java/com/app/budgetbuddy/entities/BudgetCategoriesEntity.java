package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="budgetCategories")
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetCategoriesEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @Column(name="budgetId")
    private BudgetEntity budget;

    @Column(name="categoryName")
    private String categoryName;

    @Column(name="allocatedAmount")
    private Double allocatedAmount;

    @Column(name="totalSpent")
    private Double totalSpent;

    @Column(name="isFixedExpense")
    private Boolean isFixedExpense;

    @Column(name="isActive")
    private Boolean isActive;

    @Column(name="createdAt")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;

    @Column(name="updatedAt")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime updatedAt;


}
