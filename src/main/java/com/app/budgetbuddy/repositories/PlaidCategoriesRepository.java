package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.PlaidCategoriesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlaidCategoriesRepository extends JpaRepository<PlaidCategoriesEntity, Long>
{

}
