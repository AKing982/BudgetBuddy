package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPBudgetCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPBudgetCategoryRepository extends JpaRepository<BPBudgetCategoryEntity, Long> {
}
