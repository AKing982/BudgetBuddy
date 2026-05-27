package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.EnvelopeEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EnvelopeRepository extends JpaRepository<EnvelopeEntity, Long>
{
    @Query("SELECT e FROM EnvelopeEntity e WHERE e.user.id =:userId")
    List<EnvelopeEntity> findAllByUserId(Long userId);


}
