package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.HistoricalBudgetsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface HistoricalBudgetRepository extends JpaRepository<HistoricalBudgetsEntity, Long>
{

}
