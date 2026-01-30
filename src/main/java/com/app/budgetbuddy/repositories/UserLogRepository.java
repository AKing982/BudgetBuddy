package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.UserLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserLogRepository extends JpaRepository<UserLogEntity, Long>
{
    @Query("SELECT e FROM UserLogEntity e WHERE e.user.id =:uId AND e.isActive=true")
    Optional<UserLogEntity> findActiveUserById(@Param("uId") Long userId);

    @Query("SELECT e FROM UserLogEntity e WHERE e.user.id =:uId AND e.id =:id")
    Optional<UserLogEntity> findByUserIdAndId(@Param("id") Long id, @Param("uId") Long userId);

    @Query("UPDATE UserLogEntity e SET e =:eNew WHERE e.user.id =:uId")
    @Modifying
    void updateUserLogEntity(@Param("eNew") UserLogEntity userLog, @Param("uId") Long userId);

    @Query("SELECT e.user.id FROM UserLogEntity e WHERE e.isActive = true")
    List<Long> findAllActiveUserIds();

}
