package com.example.userservice.workbench.repositories;

import com.example.userservice.entities.UserLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;


@Repository
public interface UserLogRepository extends JpaRepository<UserLogEntity, Long>
{

}
