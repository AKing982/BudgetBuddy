package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetPeriodEntity;
import com.app.budgetbuddy.exceptions.BudgetPeriodException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetPeriodRepository extends JpaRepository<BudgetPeriodEntity, Long>
{

}
