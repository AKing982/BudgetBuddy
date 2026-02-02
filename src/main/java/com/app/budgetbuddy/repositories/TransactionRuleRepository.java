package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.TransactionRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRuleRepository extends JpaRepository<TransactionRuleEntity, Long>
{
    @Query("SELECT c FROM TransactionRuleEntity c WHERE c.user.id =:id")
    List<TransactionRuleEntity> findAllByUser(@Param("id") Long userId);

    @Modifying
    @Query("UPDATE TransactionRuleEntity tre SET tre.matchCount =:count WHERE tre.id =:id AND tre.isActive = TRUE")
    void updateMatchCount(@Param("id") Long id, @Param("count") int count);

    @Modifying
    @Query("UPDATE TransactionRuleEntity tre SET tre.isActive =:active WHERE tre.id =:id AND tre.user.id =:userId")
    void updateActive(@Param("id") Long id, @Param("active") boolean active, @Param("userId") Long userId);

    @Modifying
    @Query("UPDATE TransactionRuleEntity t SET t =:tre WHERE t.user.id =:userId AND t.id =:id")
    void updateTransactionRule(@Param("tre") TransactionRuleEntity tre, @Param("id") Long id);

}
