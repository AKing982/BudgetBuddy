package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="budgetGoals")
@Data
@Builder
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
public class BudgetGoalsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="budgetid")
    private BudgetEntity budget;

    @Column(name="goalName")
    private String goalName;

    @Column(name="goalDescription")
    private String goalDescription;

    @Column(name="goalType")
    private String goalType;

    @Column(name="targetAmount")
    private double targetAmount;

    @Column(name="monthlyAllocation")
    private double monthlyAllocation;

    @Column(name="currentSavings")
    private double currentSavings;

    @Column(name="savingsFrequency")
    private String savingsFrequency;

    @Column(name="createdAt")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;

    @Column(name="updatedAt")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime updatedAt;

    @Column(name="status")
    private String status;


}