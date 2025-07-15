package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;

@Entity
@Table(name="bp_category_details")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPCategoryDetailsEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_week_detail_id")
    private BPWeekDetailEntity weekDetail;

    @Column(name="category_name")
    private String categoryName;

    @Column(name="budgeted_amount")
    private BigDecimal budgetedAmount;

    @Column(name="planned_amount")
    private BigDecimal plannedAmount;

    @Column(name="predicted_amount")
    private BigDecimal predictedAmount;

    @Column(name="actual_amount")
    private BigDecimal actualAmount;

    @Column(name="goal_amount")
    private BigDecimal goalAmount;

    @Column(name="goal_met_amount")
    private BigDecimal goalMetAmount;

    @Column(name="goal_remaining_amount")
    private BigDecimal goalRemainingAmount;

    @Column(name="goal_amount_percentage")
    private double goalAmountPercentage;

    @Column(name="goal_met_amount_percentage")
    private double goalMetAmountPercentage;

    @Column(name="goal_remaining_amount_percentage")
    private double goalRemainingAmountPercentage;

    @Column(name="remaining_amount", precision = 10, scale = 2)
    private BigDecimal remainingAmount;

    @Column(name="spending_percent")
    private BigDecimal spendingPercent;

    @Column(name="savings_percent")
    private BigDecimal savingsPercent;

    @Column(name="budgeted_percent")
    private BigDecimal budgetedPercent;

}
