package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.Set;

@Entity
@Table(name="linkedEnvelopes")
@Getter
@Setter
@Builder
@NoArgsConstructor(access= AccessLevel.PUBLIC)
@AllArgsConstructor(access= AccessLevel.PUBLIC)
public class LinkedEnvelopesEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name="link_name")
    private String linkName;

    @Column(name="shared_budget")
    private BigDecimal sharedBudget;

    @Column(name="total_allocation")
    private BigDecimal totalAllocation;

    @Column(name="total_spent")
    private BigDecimal totalSpent;

    @Column(name="score")
    private double score;

    @ManyToMany
    @JoinTable(name="linkedEnvelopeMembers",
    joinColumns=@JoinColumn(name="linkedEnvelopeId"),
    inverseJoinColumns = @JoinColumn(name="envelopeId"))
    private Set<EnvelopeEntity> linkedEnvelopeMembers;

}
