package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.PeriodType;
import com.app.budgetbuddy.domain.ScheduleStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name="budgetSchedules")
@Getter
@Setter
public class BudgetScheduleEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="periodId")
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="budgetId")
    private BudgetEntity budget;

    @Column(name="startDate")
    private LocalDate startDate;

    @Column(name="endDate")
    private LocalDate endDate;

    @Column(name="scheduleRange")
    private String scheduleRange;

    @Column(name="totalPeriodsInRange")
    private Integer totalPeriodsInRange;

    @Column(name="periodType")
    @Enumerated(EnumType.STRING)
    private PeriodType periodType;

    @Column(name="status")
    @Enumerated(EnumType.STRING)
    private ScheduleStatus status;
}
