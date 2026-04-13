package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BudgetEnvelopesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BudgetEnvelopesRepository extends JpaRepository<BudgetEnvelopesEntity, Long>
{

}
