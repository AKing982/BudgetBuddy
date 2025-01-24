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

    @Column(name="budgetYear")
    private Integer budgetYear;

    @Column(name="budgetStartDate")
    @NotNull
    private LocalDate budgetStartDate;

    @Column(name="actualAllocationAmount")
    private BigDecimal actualAllocationAmount;

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
            name = "budget_schedule_mapping",
            joinColumns = @JoinColumn(name = "budgetId"),
            inverseJoinColumns = @JoinColumn(name = "scheduleId")
    )
    private Set<BudgetScheduleEntity> budgetSchedules = new HashSet<>();

    @OneToMany(fetch = FetchType.LAZY)
    @JoinColumn(name="budgets")
    private Set<TransactionsEntity> transactions = new HashSet<>();
}
