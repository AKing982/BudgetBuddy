package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.UserLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserLogRepository extends JpaRepository<UserLogEntity, Long>
{
    @Query("SELECT e FROM UserLogEntity e WHERE e.user.id =:uId AND e.isActive=true")
    Optional<UserLogEntity> findActiveUserById(@Param("uId") Long userId);
}
