package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetCategoriesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetCategoriesRepository extends JpaRepository<BudgetCategoriesEntity, Long>
{

}
