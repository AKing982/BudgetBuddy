package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.SystemCategoryRulesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemCategoryRulesRepository extends JpaRepository<SystemCategoryRulesEntity, Long>
{

}
