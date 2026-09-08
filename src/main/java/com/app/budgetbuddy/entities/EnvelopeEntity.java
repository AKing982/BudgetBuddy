package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.EnvelopeType;
import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name="envelopes")
@Getter
@Setter
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
@ToString
public class EnvelopeEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JsonIgnore
    @ToString.Exclude
    @JoinColumn(name="userId")
    private UserEntity user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="account_id")
    private AccountEntity account;

    @Column(name="envelope_name")
    private String name;

    @Column(name="envelope_type")
    @Enumerated(EnumType.STRING)
    private EnvelopeType type;

    @Column(name="duration")
    private int duration;

    @Column(name="target_date")
    private LocalDate targetDate;

    @Column(name="start_date")
    private LocalDate startDate;

    @Column(name="budgeted")
    private double budgeted;

    @Column(name="frequency")
    private String frequency;

    @Column(name="currently_contributed")
    private double currentlySaved;

    @Column(name="target_amount")
    private double targetAmount;

    @Column(name="contribution_mode")
    private String contributionMode;

    @Column(name="is_active")
    private boolean isActive;

    @Column(name="status")
    private String status;

    @Column(name="priority")
    private int priority;

    @Column(name="is_linked")
    private boolean isLinked;

    @Column(name="requires_account_id")
    private boolean requiresAccountId;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name="envelope_subbudget",
    joinColumns=@JoinColumn(name="envelopeId"),
    inverseJoinColumns=@JoinColumn(name="subBudgetId"))
    @ToString.Exclude
    private Set<SubBudgetEntity> subBudgets = new HashSet<>();

    @OneToMany(mappedBy="envelope", fetch=FetchType.LAZY, cascade=CascadeType.ALL)
    @ToString.Exclude
    private List<EnvelopeContributionsEntity> contributions;

    @ManyToMany(mappedBy="linkedEnvelopeMembers", fetch=FetchType.LAZY)
    @ToString.Exclude
    private Set<LinkedEnvelopesEntity> linkedEnvelopes = new HashSet<>();

    @OneToMany(mappedBy = "envelope",  // ← must match the field name in EnvelopeNotificationsEntity
            cascade = CascadeType.ALL,
            orphanRemoval = true,
            fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<EnvelopeNotificationsEntity> notifications = new ArrayList<>();
}
