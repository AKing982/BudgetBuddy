package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PlaidLinkStatus;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.exceptions.UserNotFoundException;
import com.app.budgetbuddy.repositories.PlaidLinkRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import jakarta.persistence.Temporal;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
@Slf4j
public class PlaidLinkServiceImpl implements PlaidLinkService
{
    private final PlaidLinkRepository plaidLinkRepository;
    private final UserRepository userRepository;

    @Autowired
    public PlaidLinkServiceImpl(PlaidLinkRepository plaidLinkRepository,
                                UserRepository userRepository){
        this.plaidLinkRepository = plaidLinkRepository;
        this.userRepository = userRepository;
    }

    @Override
    public Collection<PlaidLinkEntity> findAll() {
        return plaidLinkRepository.findAll();
    }

    @Override
    public void save(PlaidLinkEntity plaidLinkEntity) {
        plaidLinkRepository.save(plaidLinkEntity);
    }

    @Override
    public void delete(PlaidLinkEntity plaidLinkEntity) {
        plaidLinkRepository.delete(plaidLinkEntity);
    }

    @Override
    public Optional<PlaidLinkEntity> findById(Long id) {
        return plaidLinkRepository.findById(id);
    }

    @Override
    public Optional<PlaidLinkEntity> createPlaidLink(String accessToken, String itemID, Long userID) {
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setAccessToken(accessToken);
        plaidLinkEntity.setUser(findUserByUserID(userID));
        plaidLinkEntity.setItemId(itemID);
        plaidLinkEntity.setCreatedAt(LocalDateTime.now());
        plaidLinkEntity.setUpdatedAt(LocalDateTime.now());
        return Optional.of(plaidLinkEntity);
    }

    @Override
    public Optional<PlaidLinkEntity> findPlaidLinkByUserID(Long userID) {
        return plaidLinkRepository.findPlaidLinkByUserId(userID);
    }

    @Override
    public Optional<PlaidLinkEntity> findPlaidLinkByUserIdAndAccessToken(Long userID, String accessToken) {
        return plaidLinkRepository.findPlaidLinkByUserIdAndAccessToken(userID, accessToken);
    }

    @Override
    public PlaidLinkStatus checkPlaidLinkStatus(Long userId)
    {
        Optional<PlaidLinkEntity> plaidLink = plaidLinkRepository.findPlaidLinkByUserId(userId);
        if (plaidLink.isEmpty()) {
            return new PlaidLinkStatus(false, false);
        }

        PlaidLinkEntity link = plaidLink.get();

        // Define a threshold for when an update is required (e.g., 30 days)
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        boolean needsUpdate = link.getUpdatedAt() == null || link.getUpdatedAt().isBefore(thirtyDaysAgo);

        return new PlaidLinkStatus(true, needsUpdate);
    }

    @Override
    public boolean checkIfPlaidRequiresUpdate(Long userId)
    {
        try
        {
            LocalDateTime minThreshold = LocalDateTime.now().minusDays(30); // 30 days ago
            LocalDateTime maxThreshold = LocalDateTime.now().minusDays(10); // 10 days ago
            return plaidLinkRepository.requiresUpdate(userId, minThreshold, maxThreshold);
        }catch(PlaidLinkException e)
        {
            log.error("There was an error validating the link token for updating: ", e);
            return false;
        }
    }

    @Override
    @Transactional
    public void markPlaidAsNeedingUpdate(Long userId)
    {
        try
        {
            plaidLinkRepository.updateRequiresUpdate(userId);
        }catch(PlaidLinkException e)
        {
            log.error("There was an error marking the plaid as needing update: ", e);
        }
    }

    @Override
    @Transactional
    public void markPlaidAsUpdated(Long userId, String accessToken, String oldAccessToken)
    {
        plaidLinkRepository.findPlaidLinkByUserId(userId).ifPresent(plaidLink -> {
            plaidLink.setUpdatedAt(LocalDateTime.now());
            plaidLinkRepository.updateAccessToken(accessToken, oldAccessToken, userId);
        });
    }

    private UserEntity findUserByUserID(Long userID)
    {
        Optional<UserEntity> user = userRepository.findById(userID);
        if(user.isEmpty()){
            throw new UserNotFoundException("User not found");
        }
        return user.get();
    }
}
