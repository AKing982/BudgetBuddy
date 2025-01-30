package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetScheduleRangeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetScheduleRangeRepository extends JpaRepository<BudgetScheduleRangeEntity, Long>
{

}
