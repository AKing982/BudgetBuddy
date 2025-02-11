package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.jetbrains.annotations.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Getter
@Setter
@Table(name="budgetScheduleRanges")
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@AllArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetScheduleRangeEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="scheduleId")
    private BudgetScheduleEntity budgetSchedule;

    @Column(name="rangeStart")
    @NotNull
    private LocalDate rangeStart;

    @Column(name="rangeEnd")
    @NotNull
    private LocalDate rangeEnd;

    @Column(name="totalDays")
    private int totalDays;

    @Column(name="budgetedAmount")
    @NotNull
    private BigDecimal budgetedAmount;

    @Column(name="spentOnRange")
    @NotNull
    private BigDecimal spentOnRange;

    @Column(name="rangeType")
    @NotNull
    private String rangeType;


}
