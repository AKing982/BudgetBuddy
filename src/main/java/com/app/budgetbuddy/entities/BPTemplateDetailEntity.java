package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name="bp_template_details")
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BPTemplateDetailEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="id")
    private BPTemplateEntity bpTemplate;

    @Column(name="bp_type_name")
    @NotNull
    private String bpTypeName;

    @Column(name="isSavingsFiftyThirtyTwentyApplied")
    private boolean isSavingsFiftyThirtyTwentyApplied;

    @OneToMany(mappedBy="template_detail", fetch = FetchType.LAZY, orphanRemoval = true)
    private Set<BPWeekDetailEntity> weekDetails = new HashSet<>();

    @Column(name="budget_goal_amount")
    private BigDecimal budgetGoalAmount;

    @Column(name="total_planned")
    private BigDecimal totalPlanned;

    @Column(name="total_spent")
    private BigDecimal totalSpent;

    @Column(name="percentage_saved")
    private double percentageSaved;

    @Column(name="spent_over_budget_percentage")
    private double spentOverBudgetPercentage;
}
