package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.jetbrains.annotations.NotNull;

import java.time.LocalDateTime;

@Table(name="plaidLink")
@Entity
@Data
@NoArgsConstructor
@AllArgsConstructor(access= AccessLevel.PUBLIC)
public class PlaidLinkEntity
{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userid")
    private UserEntity user;

    @Column(name="access_token")
    @NotNull
    private String accessToken;

    @Column(name="item_id")
    @NotNull
    private String itemId;

    @Column(name="createdAt")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime createdAt;

    @Column(name="updatedAt")
    @Temporal(TemporalType.TIMESTAMP)
    private LocalDateTime updatedAt;

    @Column(name="requiresUpdate")
    private boolean requiresUpdate;

}
