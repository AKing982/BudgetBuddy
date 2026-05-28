package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name="envelopeContributions")
@Getter
@Setter
public class EnvelopeContributionsEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch=FetchType.LAZY)
    @JoinColumn(name="envelope_id")
    private EnvelopeEntity envelope;

    @Column(name="minimum_contribution_amount")
    private Double minimumContributionAmount;

    @Column(name="maximum_contribution_amount")
    private Double maximumContributionAmount;

    @Column(name="contribution_amount")
    private Double contributionAmount;

    @Column(name="contribution_date")
    private LocalDate contributionDate;

    @Column(name="scheduled_date")
    private LocalDate scheduledDate;

    @Column(name="frequency")
    private String frequency;

    @Column(name="status")
    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "linked_contribution_id")
    private LinkedEnvelopeContributionsEntity linkedContribution;

}
