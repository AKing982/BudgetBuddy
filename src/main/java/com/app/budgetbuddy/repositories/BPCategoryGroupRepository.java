package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPCategoryGroupEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPCategoryGroupRepository extends JpaRepository<BPCategoryGroupEntity, Long> {
}
