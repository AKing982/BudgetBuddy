package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;

import java.util.Optional;

public interface PlaidLinkService extends ServiceModel<PlaidLinkEntity>
{
    Optional<PlaidLinkEntity> createPlaidLink(String accessToken, String itemID, Long userID);

    Optional<PlaidLinkEntity> findPlaidLinkByUserID(Long userID);

    Optional<PlaidLinkEntity> findPlaidLinkByUserIdAndAccessToken(Long userID, String accessToken);
}
