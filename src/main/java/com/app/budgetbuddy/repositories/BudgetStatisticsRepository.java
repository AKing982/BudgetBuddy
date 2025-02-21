package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetStatisticsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetStatisticsRepository extends JpaRepository<BudgetStatisticsEntity, Long>
{

}
