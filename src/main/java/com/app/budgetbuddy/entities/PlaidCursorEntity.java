package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Table(name="plaidCursors")
@Entity
public class PlaidCursorEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.EAGER)
    @JoinColumn(name="userId")
    private UserEntity user;

    @Column(name="item_id")
    private String itemId;

    @Column(name="added_cursor")
    private String addedCursor;

    @Column(name="modified_cursor")
    private String modifiedCursor;

    @Column(name="removed_cursor", nullable=false)
    private String removedCursor;

    @Column(name="historical_cursor", nullable=false)
    private String historicalCursor;

    @Column(name="last_sync_timestamp", nullable=false)
    private LocalDateTime lastSyncTimestamp;

    @Column(name="last_sync_date")
    private LocalDate lastSyncDate;

    @Column(name="cursor_sync_successful")
    private boolean cursorSyncSuccessful;

    @Column(name="last_sync_status")
    private String lastSyncStatus;

    @Column(name="last_error_message")
    private String lastErrorMessage;
}
