package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name="historicalBudgets")
@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class HistoricalBudgetsEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="id")
    private UserEntity user;

    @Column(name="budgetName")
    private String budgetName;

    @Column(name="budgetedAmount")
    private BigDecimal budgetedAmount;

    @Column(name="spentAmount")
    private BigDecimal spentAmount;

    @Column(name="budgetSavingsAmount")
    private BigDecimal budgetSavingsAmount;

    @Column(name="budgetTotalSavings")
    private BigDecimal budgetTotalSavings;

    @Column(name="startDate")
    private LocalDate startDate;

    @Column(name="endDate")
    private LocalDate endDate;

    @Column(name="year")
    private Integer year;




}
