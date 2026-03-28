package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.BPColumnEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BPColumnRepository extends JpaRepository<BPColumnEntity, Long>
{

}
