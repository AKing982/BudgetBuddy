package com.app.budgetbuddy.repositories;


import com.app.budgetbuddy.entities.SubBudgetGoalsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubBudgetGoalsRepository extends JpaRepository<SubBudgetGoalsEntity, Long>
{

}
