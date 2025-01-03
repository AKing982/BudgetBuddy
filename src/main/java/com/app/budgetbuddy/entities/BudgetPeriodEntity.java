package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="budgetPeriod")
@Getter
@Setter
public class BudgetPeriodEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name="periodId")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="budgetId")
    private BudgetEntity budget;

    @Column(name="allocatedAmount")
    private BigDecimal allocatedAmount;

    @Column(name="totalSpentAmount")
    private BigDecimal totalSpentAmount;

    @Column(name="startDate")
    private LocalDate startDate;

    @Column(name="endDate")
    private LocalDate endDate;

    @Column(name="status")
    private String status;
}
