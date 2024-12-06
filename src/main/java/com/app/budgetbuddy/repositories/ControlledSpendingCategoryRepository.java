package com.app.budgetbuddy.repositories;


import com.app.budgetbuddy.entities.ControlledSpendingCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ControlledSpendingCategoryRepository extends JpaRepository<ControlledSpendingCategoryEntity, Long>
{
    @Query("SELECT bce FROM ControlledSpendingCategoryEntity bce WHERE bce.budget.id =:id")
    List<ControlledSpendingCategoryEntity> findAllByBudgetId(@Param("id") Long id);
}
