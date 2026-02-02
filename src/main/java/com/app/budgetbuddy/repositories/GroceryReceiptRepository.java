package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.GroceryReceiptEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GroceryReceiptRepository extends JpaRepository<GroceryReceiptEntity, Long>
{

}
