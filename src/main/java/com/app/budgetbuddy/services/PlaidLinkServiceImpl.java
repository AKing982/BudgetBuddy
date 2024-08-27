package com.app.budgetbuddy.services;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.UserNotFoundException;
import com.app.budgetbuddy.repositories.PlaidLinkRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Service
public class PlaidLinkServiceImpl implements PlaidLinkService
{
    private final PlaidLinkRepository plaidLinkRepository;

    @Autowired
    public PlaidLinkServiceImpl(PlaidLinkRepository plaidLinkRepository){
        this.plaidLinkRepository = plaidLinkRepository;
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

    private UserEntity findUserByUserID(Long userID)
    {
        Optional<UserEntity> user = plaidLinkRepository.findUserByUserId(userID);
        if(user.isEmpty()){
            throw new UserNotFoundException("User not found");
        }
        return user.get();
    }
}
