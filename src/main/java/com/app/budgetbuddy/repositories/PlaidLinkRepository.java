package com.app.budgetbuddy.repositories;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface PlaidLinkRepository extends JpaRepository<PlaidLinkEntity, Long>
{
    @Query("SELECT pl.user FROM PlaidLinkEntity pl WHERE pl.user.id =:id")
    Optional<UserEntity> findUserByUserId(@Param("id") Long id);

    @Query("UPDATE PlaidLinkEntity pl SET pl.accessToken =:accessToken, pl.requiresUpdate = false WHERE pl.accessToken =:oldToken AND pl.user.id =:uId")
    @Modifying
    void updateAccessToken(@Param("accessToken") String accessToken, @Param("oldToken") String oldToken, @Param("uId") Long userId);

    @Query("UPDATE PlaidLinkEntity pl SET pl.requiresUpdate = true WHERE pl.user.id =:uId")
    @Modifying
    void updateRequiresUpdate(@Param("uId") Long userId);

    @Query("SELECT pl FROM PlaidLinkEntity pl WHERE pl.user.id =:id")
    Optional<PlaidLinkEntity> findPlaidLinkByUserId(@Param("id") Long id);

    @Query("SELECT pl FROM PlaidLinkEntity pl WHERE pl.user.id =:id AND pl.accessToken =:token")
    Optional<PlaidLinkEntity> findPlaidLinkByUserIdAndAccessToken(@Param("id") Long id, @Param("token") String token);

    @Query("SELECT CASE WHEN COUNT(p) > 0 THEN true ELSE false END FROM PlaidLinkEntity p " +
            "WHERE p.user.id = :userId AND (p.updatedAt IS NULL OR p.updatedAt BETWEEN :minThreshold AND :maxThreshold)")
    boolean requiresUpdate(@Param("userId") Long userId,
                           @Param("minThreshold") LocalDateTime minThreshold,
                           @Param("maxThreshold") LocalDateTime maxThreshold);
}
