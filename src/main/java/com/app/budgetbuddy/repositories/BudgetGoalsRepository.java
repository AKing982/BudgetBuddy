package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface BudgetGoalsRepository extends JpaRepository<BudgetGoalsEntity, Long>
{
    @Query("SELECT b FROM BudgetGoalsEntity b WHERE b.budget.id =:id")
    Optional<BudgetGoalsEntity> findByBudgetId(@Param("id") Long id);
}
