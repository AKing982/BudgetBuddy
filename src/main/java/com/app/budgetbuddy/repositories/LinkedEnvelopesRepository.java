package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.LinkedEnvelopesEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface LinkedEnvelopesRepository extends JpaRepository<LinkedEnvelopesEntity, Long>
{

}
