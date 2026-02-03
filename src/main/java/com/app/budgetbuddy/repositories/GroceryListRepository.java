package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.GroceryListEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroceryListRepository extends JpaRepository<GroceryListEntity, Long>
{

}
