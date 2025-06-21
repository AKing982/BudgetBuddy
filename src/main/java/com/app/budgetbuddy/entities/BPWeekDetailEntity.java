package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;

@Entity
@Table(name="bp_week_details")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPWeekDetailEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_template_detail_id")
    private BPTemplateDetailEntity bpTemplateDetail;

    @Column(name="weekPeriod")
    @NotNull
    private String weekPeriod;

    @Column(name="planned_amount")
    @NotNull
    private BigDecimal plannedAmount;

    @Column(name="actual_amount")
    @NotNull
    private BigDecimal actualAmount;

    @Column(name="predicted_amount")
    private BigDecimal predictedAmount;

    @Column(name="spending_percent", precision = 10, scale = 2)
    private BigDecimal spendingPercent;

    @Column(name="savings_percent", precision = 10, scale = 2)
    private BigDecimal savingsPercent;

    @Column(name="budgeted_percent", precision = 10, scale = 2)
    private BigDecimal budgetedPercent;

    @Column(name="account_balance")
    private BigDecimal accountBalance;

}
