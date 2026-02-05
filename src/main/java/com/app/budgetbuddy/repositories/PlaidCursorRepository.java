package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.PlaidCursorEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PlaidCursorRepository extends JpaRepository<PlaidCursorEntity, Long>
{

    /**
     * Find a cursor by the associated item ID
     */
    @Query("SELECT pc FROM PlaidCursorEntity pc WHERE pc.itemId =:itemId")
    Optional<PlaidCursorEntity> findByItemId(@Param("itemId") String itemId);

    /**
     * Find cursor by user ID using join
     */
    @Query("SELECT pc FROM PlaidCursorEntity pc WHERE pc.user.id = :userId")
    Optional<PlaidCursorEntity> findByUserId(@Param("userId") Long userId);


    @Modifying
    @Query("UPDATE PlaidCursorEntity pc SET pc.cursor =:cursor WHERE pc.user.id =:userId AND pc.itemId =:itemId")
    void updatePlaidCursor(@Param("cursor") String cursor, @Param("userId") Long userId, @Param("itemId") String itemId);

    /**
     * Find cursor by both user ID and item ID
     */
    @Query("SELECT pc FROM PlaidCursorEntity pc WHERE pc.user.id = :userId AND pc.itemId = :itemId")
    Optional<PlaidCursorEntity> findByUserIdAndItemId(
            @Param("userId") Long userId,
            @Param("itemId") String itemId);

}
