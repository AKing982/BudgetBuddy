package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.CategoryRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CategoryRuleRepository extends JpaRepository<CategoryRuleEntity, Long>
{

}
