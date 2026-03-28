package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPRowEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPRowRepository extends JpaRepository<BPRowEntity, Long>
{

}
