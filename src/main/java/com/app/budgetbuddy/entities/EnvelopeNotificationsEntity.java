package com.app.budgetbuddy.entities;

import com.app.budgetbuddy.domain.EnvelopeStatus;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name="envelopeNotifications")
@Getter
@Setter
public class EnvelopeNotificationsEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="envelope_id")
    private EnvelopeEntity envelope;

    @Column(name="title")
    private String title;

    @Column(name="message")
    private String message;

    @Column(name="envelope_status")
    @Enumerated(EnumType.STRING)
    private EnvelopeStatus status;

    @Column(name="is_read")
    private boolean isRead;

    @Column(name="amount")
    private double amount;

    @Column(name="contribution_date")
    private LocalDate contributionDate;
}
