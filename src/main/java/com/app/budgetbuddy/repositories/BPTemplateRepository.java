package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPTemplateEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPTemplateRepository extends JpaRepository<BPTemplateEntity, Long>
{

}
