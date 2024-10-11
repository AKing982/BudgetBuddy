package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetGoalsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetGoalsRepository extends JpaRepository<BudgetGoalsEntity, Long>
{

}
