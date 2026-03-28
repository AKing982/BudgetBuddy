package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="bp_budget_categories")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPBudgetCategoryEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="bp_template_detail_id")
    private BPTemplateDetailEntity bpTemplateDetail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="budget_category_id")
    private BudgetCategoryEntity budgetCategory;

    @Column(name="column_index")
    private int columnIndex;

    @Column(name="start_date")
    private LocalDate startDate;

    @Column(name="end_date")
    private LocalDate endDate;

    @Column(name="planned_amount", precision = 10)
    private BigDecimal plannedAmount;

    @Column(name="actual_amount", precision = 10)
    private BigDecimal actualAmount;

    @Column(name="budgeted_amount", precision = 10)
    private BigDecimal budgetedAmount;

    @Column(name="delta_percent", precision = 10)
    private BigDecimal deltaPercent;

    @Column(name="percentage", precision = 10)
    private double percentage;

    @Column(name="is_over_budget")
    private boolean isOverBudget;
}
