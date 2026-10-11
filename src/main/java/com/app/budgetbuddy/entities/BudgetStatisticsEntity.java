package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;

@Table(name="budgetStatistics")
@Entity
@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetStatisticsEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="subbudgetId")
    private SubBudgetEntity subBudget;

    @Column(name="totalBudget")
    @NotNull
    private BigDecimal totalBudget;

    @Column(name="totalSpent")
    @NotNull
    private BigDecimal totalSpent;

    @Column(name="total_bills")
    private BigDecimal totalBills;

    @Column(name="total_recurring")
    private BigDecimal totalRecurring;

    @Column(name="bucket_plans")
    private BigDecimal bucketPlans;

    @Column(name="income_days_left")
    private Integer incomeDaysLeft;

    @Column(name="averageSpendingPerDay")
    @NotNull
    private BigDecimal averageSpendingPerDay;

    @Column(name="healthScore")
    private BigDecimal healthScore;




}
