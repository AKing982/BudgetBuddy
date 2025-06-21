package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPWeekDetailEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPWeekDetailsRepository extends JpaRepository<BPWeekDetailEntity, Long>
{

}
