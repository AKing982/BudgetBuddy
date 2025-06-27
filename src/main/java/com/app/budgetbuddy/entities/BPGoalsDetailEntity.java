package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name="bp_goals_detail")
@Getter
@Setter
@Builder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class BPGoalsDetailEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="bp_template_id")
    private BPTemplateEntity bpTemplate;

    @OneToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="goal_id")
    private SubBudgetGoalsEntity subBudgetGoalsEntity;

    @Column(name="goal_amount")
    private BigDecimal goalAmount;

    @Column(name="total_planned")
    private BigDecimal totalPlanned;

    @Column(name="total_spent")
    private BigDecimal totalSpent;

    @Column(name="savings_percent")
    private double savingsPercent;

    @Column(name="spent_over_budget_percent")
    private double spentOverBudgetPercent;
}
