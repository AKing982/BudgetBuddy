package com.app.budgetbuddy.entities;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.beans.factory.annotation.Autowired;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Table(name="plaidCursors")
@Entity
@AllArgsConstructor(access = AccessLevel.PUBLIC)
@NoArgsConstructor(access = AccessLevel.PUBLIC)
@Builder
public class PlaidCursorEntity
{

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name="userId", nullable = false)
    private UserEntity user;

    @Column(name="item_id")
    private String itemId;

    @Column(name="cursor")
    private String cursor;

    @Column(name="last_sync_timestamp", nullable=false)
    private LocalDateTime lastSyncTimestamp;

    @Column(name="cursor_sync_successful")
    private boolean cursorSyncSuccessful;
}
