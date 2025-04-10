package com.app.budgetbuddy.repositories;


import com.app.budgetbuddy.entities.SubBudgetGoalsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SubBudgetGoalsRepository extends JpaRepository<SubBudgetGoalsEntity, Long>
{
    @Query("SELECT sbg FROM SubBudgetGoalsEntity sbg WHERE sbg.subBudgetEntity.id =:id")
    Optional<SubBudgetGoalsEntity> findSubBudgetGoalEntitiesBySubBudgetId(@Param("id") Long id);
}
