package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PlaidLinkStatus;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;

import java.util.List;
import java.util.Optional;

public interface PlaidLinkService extends ServiceModel<PlaidLinkEntity>
{
    Optional<PlaidLinkEntity> createPlaidLink(String accessToken, String institution, String itemID, Long userID);

    List<PlaidLinkEntity> findPlaidLinkByUserID(Long userID);
    Optional<PlaidLinkEntity> findPlaidLinkByItemId(String itemId, Long userId);

    Optional<PlaidLinkEntity> findPlaidLinkByUserIdAndAccessToken(Long userID, String accessToken);

    List<PlaidLinkStatus> checkPlaidLinkStatus(Long userId);

    boolean checkIfPlaidRequiresUpdate(Long userId);

    void markPlaidAsNeedingUpdate(Long userId, Long plaidLinkId);
    void markPlaidAsUpdated(Long userId, String accessToken, String oldAccessToken);
}
