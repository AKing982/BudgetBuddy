package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity(name="subBudgets")
@Data
@Builder
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class SubBudgetEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="budgetId")
    private BudgetEntity budget;

    @Column(name="allocatedAmount")
    @NotNull
    private BigDecimal allocatedAmount;

    @Column(name="spentOnBudget")
    @NotNull
    private BigDecimal spentOnBudget;

    @Column(name="subSavingsTarget")
    @NotNull
    private BigDecimal subSavingsTarget;

    @Column(name="subSavingsAmount")
    @NotNull
    private BigDecimal subSavingsAmount;

    @Column(name="isActive")
    private boolean isActive;

    @Column(name="createdDate")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdDate;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name="sub_budget_schedule_mapping",
            joinColumns=@JoinColumn(name="subBudgetId"),
            inverseJoinColumns = @JoinColumn(name="scheduleId")
    )
    private Set<BudgetScheduleEntity> budgetSchedules = new HashSet<>();

}
