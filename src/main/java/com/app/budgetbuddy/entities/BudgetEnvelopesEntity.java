package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.EnvelopeType;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name="budgetEnvelopes")
@Getter
@Setter
public class BudgetEnvelopesEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name="subBudgetId")
    private SubBudgetEntity subBudget;

    @OneToOne
    @JoinColumn(name="goalId")
    private BudgetGoalsEntity goal;

    @Column(name="envelopeName")
    private String envelopeName;

    @Column(name="envelopeType")
    @Enumerated(EnumType.STRING)
    private EnvelopeType envelopeType;

    @Column(name="targetAmount")
    private BigDecimal targetAmount;

    @Column(name="allocatedAmount")
    private BigDecimal allocatedAmount;

    @Column(name="remainingAmount")
    private BigDecimal remainingAmount;

    @Column(name="createdAt")
    private LocalDateTime createdAt;

    @Column(name="updatedAt")
    private LocalDateTime updatedAt;

    @Column(name="status")
    private String status;

    @Column(name="priority")
    private int priority;

}
