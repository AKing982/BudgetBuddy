package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.PreCalculationCategoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PreCalculationCategoryRepository extends JpaRepository<PreCalculationCategoryEntity, Long>
{

}
