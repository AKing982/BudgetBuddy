package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Table(name="subBudgetGoals")
@Entity
@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class SubBudgetGoalsEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="sub_budgetid")
    private SubBudgetEntity subBudgetEntity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="budget_goalsid")
    private BudgetGoalsEntity budgetGoals;

    @Column(name="monthlySavingsTarget")
    private BigDecimal monthlySavingsTarget;

    @Column(name="monthlyContributed")
    private BigDecimal monthlyContributed;

    @Column(name="goalScore")
    private BigDecimal goalScore;

    @Column(name="remainingAmount")
    private BigDecimal remainingAmount;

    @Column(name="monthlyStatus")
    private String monthlyStatus;
}
