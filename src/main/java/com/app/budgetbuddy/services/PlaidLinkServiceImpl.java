package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PlaidLinkStatus;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.DataAccessException;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.exceptions.UserNotFoundException;
import com.app.budgetbuddy.repositories.PlaidLinkRepository;
import com.app.budgetbuddy.repositories.UserRepository;
import jakarta.persistence.Temporal;
import lombok.extern.slf4j.Slf4j;
import org.hibernate.Hibernate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

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
    public Optional<PlaidLinkEntity> createPlaidLink(String accessToken, String institution, String itemID, Long userID) {
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setAccessToken(accessToken);
        plaidLinkEntity.setUser(findUserByUserID(userID));
        plaidLinkEntity.setItemId(itemID);
        plaidLinkEntity.setInstitution(institution);
        plaidLinkEntity.setCreatedAt(LocalDateTime.now());
        plaidLinkEntity.setUpdatedAt(LocalDateTime.now());
        return Optional.of(plaidLinkEntity);
    }

    @Override
    @Transactional
    public List<PlaidLinkEntity> findPlaidLinkByUserID(Long userID)
    {
        try
        {
            List<PlaidLinkEntity> plaidLinks = plaidLinkRepository.findPlaidLinkByUserId(userID);
            plaidLinks.forEach(plaidLink -> {
                Hibernate.initialize(plaidLink.getAccounts());
            });
            return plaidLinks;
        }catch(DataAccessException ex){
            log.error("There was an error retrieving the plaid link by user id: ", ex);
            return Collections.emptyList();
        }
    }

    @Override
    @Transactional
    public Optional<PlaidLinkEntity> findPlaidLinkByItemId(String itemId, Long userId)
    {
        if(itemId == null || itemId.isEmpty())
        {
            return Optional.empty();
        }
        try
        {
            return plaidLinkRepository.findByItemIdAndUserId(itemId, userId);
        }catch(DataAccessException ex){
            log.error("There was an error retrieving the plaid link by item id: ", ex);
            return Optional.empty();
        }
    }

    @Override
    public Optional<PlaidLinkEntity> findPlaidLinkByUserIdAndAccessToken(Long userID, String accessToken) {
        return plaidLinkRepository.findPlaidLinkByUserIdAndAccessToken(userID, accessToken);
    }

    @Override
    @Transactional
    public List<PlaidLinkStatus> checkPlaidLinkStatus(Long userId)
    {
        List<PlaidLinkEntity> plaidLink = plaidLinkRepository.findPlaidLinkByUserId(userId);
        if(plaidLink.isEmpty())
        {
            return Collections.emptyList();
        }
        List<PlaidLinkStatus> statuses = new ArrayList<>();
        LocalDateTime thirtyDaysAgo = LocalDateTime.now().minusDays(30);
        for(PlaidLinkEntity link : plaidLink)
        {
            boolean needsUpdate = link.getUpdatedAt() == null || link.getUpdatedAt().isBefore(thirtyDaysAgo);
            if(needsUpdate)
            {
                log.info("Plaid link {} for user {} is stale (last updated {}), marking for update",
                        link.getId(), userId, link.getUpdatedAt());
            }
            PlaidLinkStatus status = new PlaidLinkStatus(
                link.getId(),
                true,
                needsUpdate);
            statuses.add(status);
        }
        return statuses;
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
    public void markPlaidAsNeedingUpdate(Long userId, Long plaidLinkId)
    {
        try
        {
            plaidLinkRepository.updateRequiresUpdate(userId, plaidLinkId);
        }catch(PlaidLinkException e)
        {
            log.error("There was an error marking the plaid as needing update: ", e);
        }
    }

    @Override
    @Transactional
    public void markPlaidAsUpdated(Long userId, String accessToken, String oldAccessToken)
    {
        if(accessToken == null || oldAccessToken == null)
        {
            return;
        }
        plaidLinkRepository.findPlaidLinkByUserId(userId)
                        .stream()
                        .filter(plaidLink -> plaidLink.getAccessToken().equals(oldAccessToken))
                .findFirst()
                .ifPresent(plaidLink -> {
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
