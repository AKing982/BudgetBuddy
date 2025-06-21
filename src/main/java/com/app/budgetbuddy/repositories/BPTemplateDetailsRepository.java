package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPTemplateDetailEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPTemplateDetailsRepository extends JpaRepository<BPTemplateDetailEntity, Long>
{

}
