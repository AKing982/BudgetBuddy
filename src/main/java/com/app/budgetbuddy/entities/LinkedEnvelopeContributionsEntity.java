package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name="linkedEnvelopeContributions")
@Getter
@Setter
public class LinkedEnvelopeContributionsEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="linked_envelopes_id")
    private LinkedEnvelopesEntity linkedEnvelopes;

    @OneToMany(mappedBy = "linkedContribution", cascade={CascadeType.PERSIST, CascadeType.MERGE}, fetch = FetchType.LAZY)
    private List<EnvelopeContributionsEntity> memberContributions = new ArrayList<>();

    @Column(name="total_contribution_amount")
    private Double totalContributionAmount;

    @Column(name="contribution_type")
    private String contributionType;

    @Column(name="status")
    private String status;

}
