package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetCategoriesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetCategoriesRepository extends JpaRepository<BudgetCategoriesEntity, Long>
{
    @Query("SELECT bce FROM BudgetCategoriesEntity bce WHERE bce.budget.id =:id")
    List<BudgetCategoriesEntity> findAllByBudgetId(@Param("id") Long id);
}
