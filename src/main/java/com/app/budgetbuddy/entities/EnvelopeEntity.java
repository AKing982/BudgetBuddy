package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.EnvelopeType;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

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

    @Column(name="frequency_amount")
    private double frequencyAmount;

    @Column(name="currently_saved")
    private double currentlySaved;

    @Column(name="target_amount")
    private double targetAmount;

    @Column(name="is_active")
    private boolean isActive;

    @Column(name="status")
    private String status;
}
