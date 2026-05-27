package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name="envelopeContributionHistories")
@Getter
@Setter
public class EnvelopeContributionHistoryEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="envelopeId")
    private EnvelopeEntity envelope;

    @Column(name="date")
    private LocalDate date;

    @Column(name="scheduled_date")
    private LocalDate scheduledDate;

    @Column(name="amount")
    private double amount;

    @Column(name="status")
    private String status;

    @Column(name="frequency")
    private String frequency;
}
