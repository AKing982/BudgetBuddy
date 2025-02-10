package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.Period;
import com.app.budgetbuddy.domain.PeriodType;
import com.app.budgetbuddy.domain.ScheduleStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.jetbrains.annotations.NotNull;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name="budgetSchedules")
@Getter
@Setter
public class BudgetScheduleEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="sub_budgetid")
    @NotNull
    private SubBudgetEntity subBudget;

    @Column(name="startDate")
    @NotNull
    private LocalDate startDate;

    @Column(name="endDate")
    @NotNull
    private LocalDate endDate;

    @Column(name="scheduleRange")
    @NotNull
    private String scheduleRange;

    @Column(name="totalperiods")
    @NotNull
    private Integer totalPeriodsInRange;

    @Column(name="periodType")
    @Enumerated(EnumType.STRING)
    private Period periodType;

    @Column(name="status")
    @Enumerated(EnumType.STRING)
    private ScheduleStatus status;

    // ---- NEW: One-to-Many to BudgetScheduleRangeEntity
    @OneToMany(mappedBy = "budgetSchedule", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<BudgetScheduleRangeEntity> dateRanges = new HashSet<>();

}
