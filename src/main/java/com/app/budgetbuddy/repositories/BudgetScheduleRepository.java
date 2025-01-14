package com.app.budgetbuddy.repositories;


import com.app.budgetbuddy.entities.BudgetScheduleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetScheduleRepository extends JpaRepository<BudgetScheduleEntity, Long>
{

}
