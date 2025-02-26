package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.BudgetMode;
import com.app.budgetbuddy.domain.BudgetPeriod;
import com.app.budgetbuddy.domain.Period;
import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Date;
import java.util.HashSet;
import java.util.Set;

@Table(name="budgets")
@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="budgetId")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userid")
    private UserEntity user;

    @NotNull
    @Column(name="budgetName")
    private String budgetName;

    @NotNull
    @Column(name="budgetDescription")
    private String budgetDescription;

    @NotNull
    @Column(name="totalBudgetAmount")
    private BigDecimal budgetAmount;

    @Column(name="budgetActualAmount")
    private BigDecimal budgetActualAmount;

    @Column(name="budgetMode")
    @Enumerated(EnumType.STRING)
    private BudgetMode budgetMode;

    @Column(name="budgetPeriod")
    @Enumerated(EnumType.STRING)
    private Period budgetPeriod;

    @Column(name="monthlyIncome")
    private BigDecimal monthlyIncome;

    @Column(name="startDate")
    @NotNull
    private LocalDate budgetStartDate;

    @Column(name="endDate")
    @NotNull
    private LocalDate budgetEndDate;

    @Column(name="year")
    private int year;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="budget_goals_id")
    private BudgetGoalsEntity budgetGoals;

    @Column(name="actualSavingsAllocation")
    private BigDecimal actualSavingsAllocation;

    @Column(name="savingsProgress")
    private BigDecimal savingsProgress;

    @Column(name="totalMonthsToSave")
    private Integer totalMonthsToSave;

    @Temporal(TemporalType.TIMESTAMP)
    @Column(name="createdDate")
    private LocalDateTime createdDate;

    @Column(name="lastUpdatedDate")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime lastUpdatedDate;

    @ManyToMany
    @JoinTable(
            name = "sub_Budget_mapping",
            joinColumns = @JoinColumn(name = "budgetId"),
            inverseJoinColumns = @JoinColumn(name = "subbudgetid")
    )
    private Set<SubBudgetEntity> subBudgetEntities = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name="budgets")
    private Set<TransactionsEntity> transactions = new HashSet<>();
}
