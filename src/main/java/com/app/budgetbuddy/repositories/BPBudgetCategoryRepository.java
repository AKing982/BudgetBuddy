package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPBudgetCategoryRepository extends JpaRepository<BPCategoryEntity, Long> {
}
