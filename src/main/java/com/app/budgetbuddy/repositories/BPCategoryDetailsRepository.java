package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPCategoryDetailsEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPCategoryDetailsRepository extends JpaRepository<BPCategoryDetailsEntity, Long>
{

}
