package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BudgetRepository extends JpaRepository<BudgetEntity, Long>
{
    @Query("SELECT b FROM BudgetEntity b WHERE b.budgetName =:name")
    List<BudgetEntity> findByBudgetName(@Param("name") String name);

    @Query("SELECT b FROM BudgetEntity b WHERE b.user.id =:id")
    List<BudgetEntity> findByUser(@Param("id") Long id);

}
