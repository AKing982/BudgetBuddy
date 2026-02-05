package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PlaidCursor;
import com.app.budgetbuddy.entities.PlaidCursorEntity;
import com.app.budgetbuddy.entities.UserEntity;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface PlaidCursorService extends ServiceModel<PlaidCursorEntity>
{
    /**
     * Find a cursor by its item ID
     */
    Optional<PlaidCursorEntity> findByItemId(String itemId);

    /**
     * Update the sync status for a cursor
     */
    PlaidCursorEntity updateSyncStatus(
            Long cursorId,
            boolean successful,
            String status,
            String errorMessage);

    PlaidCursorEntity findByUserAndItemId(Long userId, String itemId);

    /**
     * Update the last sync timestamp
     */
    PlaidCursorEntity updateLastSyncTimestamp(Long cursorId, LocalDateTime timestamp);

    /**
     * Find cursors that need to be synced (failed or error status)
     */
    List<PlaidCursorEntity> findCursorsNeedingSync();

    void updateNextPlaidCursor(String cursor, Long userId, String itemId);

    void savePlaidCursor(PlaidCursor plaidCursor);

}
