package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.TransactionRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRuleRepository extends JpaRepository<TransactionRuleEntity, Long>
{
    @Query("SELECT c FROM TransactionRuleEntity c WHERE c.user.id =:id")
    List<TransactionRuleEntity> findAllByUser(@Param("id") Long userId);

}
