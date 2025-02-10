package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name="subBudgets")
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
    @NotNull
    private BudgetEntity budget;

    @Column(name="subBudgetName")
    @NotNull
    private String subBudgetName;

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

    @Column(name="startDate")
    @NotNull
    private LocalDate startDate;

    @Column(name="endDate")
    @NotNull
    private LocalDate endDate;

    @Column(name="isActive")
    private boolean isActive;

//    @Column(name="createdDate")
//    @Temporal(TemporalType.TIMESTAMP)
//    private LocalDateTime createdDate;

    // One-to-Many Relationship: SubBudget → BudgetSchedules
    @OneToMany(mappedBy = "subBudget", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BudgetScheduleEntity> budgetSchedules = new HashSet<>();

}
