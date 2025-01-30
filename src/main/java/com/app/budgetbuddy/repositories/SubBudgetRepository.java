package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.SubBudgetEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubBudgetRepository extends JpaRepository<SubBudgetEntity, Long>
{

}
