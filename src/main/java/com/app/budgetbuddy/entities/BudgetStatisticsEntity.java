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
    @JoinColumn(name="sub_budgetId")
    private SubBudgetEntity subBudget;

    @Column(name="totalBudget")
    @NotNull
    private BigDecimal totalBudget;

    @Column(name="totalSpent")
    @NotNull
    private BigDecimal totalSpent;

    @Column(name="averageSpendingPerDay")
    @NotNull
    private BigDecimal averageSpendingPerDay;

    @Column(name="healthScore")
    private BigDecimal healthScore;




}
