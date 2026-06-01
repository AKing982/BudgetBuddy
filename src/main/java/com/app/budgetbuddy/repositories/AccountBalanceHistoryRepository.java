package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.AccountBalanceHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

@Repository
public interface AccountBalanceHistoryRepository extends JpaRepository<AccountBalanceHistoryEntity, Long>
{
    @Query("SELECT a FROM AccountBalanceHistoryEntity a WHERE a.account.id =:id AND a.date BETWEEN :start AND :end")
    Optional<AccountBalanceHistoryEntity> findByAccountIdAndDateBetween(@Param("id") String id, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT a FROM AccountBalanceHistoryEntity a WHERE a.account.id =:id ORDER BY a.balance DESC")
    Optional<AccountBalanceHistoryEntity> findAvailableBalanceByAccountId(@Param("id") String id);
}
