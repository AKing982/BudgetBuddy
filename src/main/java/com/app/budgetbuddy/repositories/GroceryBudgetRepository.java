package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.GroceryBudgetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroceryBudgetRepository extends JpaRepository<GroceryBudgetEntity, Long>
{

}
