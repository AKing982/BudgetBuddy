package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PlaidLinkRepository extends JpaRepository<PlaidLinkEntity, Long>
{
    @Query("SELECT pl.user FROM PlaidLinkEntity pl WHERE pl.user.id =:id")
    Optional<UserEntity> findUserByUserId(@Param("id") Long id);
}
