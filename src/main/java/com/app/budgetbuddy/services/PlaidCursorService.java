package com.app.budgetbuddy.services;

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
     * Find all cursors for a specific user
     */
    List<PlaidCursorEntity> findByUser(UserEntity user);

    /**
     * Find all cursors for a user by user ID
     */
    List<PlaidCursorEntity> findByUserId(Long userId);

    /**
     * Find a specific cursor by both user ID and item ID
     */
    Optional<PlaidCursorEntity> findByUserIdAndItemId(Long userId, String itemId);

    /**
     * Update the sync status for a cursor
     */
    PlaidCursorEntity updateSyncStatus(
            Long cursorId,
            boolean successful,
            String status,
            String errorMessage);

    /**
     * Update the last sync timestamp
     */
    PlaidCursorEntity updateLastSyncTimestamp(Long cursorId, LocalDateTime timestamp);

    /**
     * Find cursors that need to be synced (failed or error status)
     */
    List<PlaidCursorEntity> findCursorsNeedingSync();

    /**
     * Delete cursor by item ID (for when accounts are unlinked)
     */
    void deleteCursorByItemId(String itemId);

}
