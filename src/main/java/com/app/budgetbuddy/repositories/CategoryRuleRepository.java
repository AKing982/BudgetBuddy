package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.CategoryRuleEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CategoryRuleRepository extends JpaRepository<CategoryRuleEntity, Long>
{
    @Query("SELECT c FROM CategoryRuleEntity c WHERE c.user.id =:id")
    List<CategoryRuleEntity> findAllByUser(@Param("id") Long userId);

    @Query("SELECT c FROM CategoryRuleEntity c WHERE c.user.id IS NULL")
    List<CategoryRuleEntity> findAllByUserIsNull();
}
