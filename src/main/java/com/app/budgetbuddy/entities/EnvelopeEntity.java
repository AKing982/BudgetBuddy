package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.EnvelopeType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
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
public class EnvelopeEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userId")
    private UserEntity user;

    @Column(name="envelope_name")
    private String name;

    @Column(name="goal")
    private String goal;

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
    private String frequencyAmount;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="subBudgetId")
    private SubBudgetEntity subBudget;

    @OneToMany(mappedBy="envelope", fetch=FetchType.LAZY, cascade=CascadeType.ALL)
    private List<EnvelopeContributionsEntity> contributions;

    @ManyToMany(mappedBy="linkedEnvelopeMembers", fetch=FetchType.LAZY)
    private Set<LinkedEnvelopesEntity> linkedEnvelopes = new HashSet<>();

    @OneToMany(fetch=FetchType.LAZY)
    @JoinColumn(name="envelope_notification_id")
    private Set<EnvelopeNotificationsEntity> envelopeNotifications;
}
