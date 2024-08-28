package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.request.PlaidApi;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlaidAccountManagerTest {

    @Mock
    private PlaidLinkService plaidLinkService;

    @Mock
    private PlaidApi plaidApi;

    @InjectMocks
    private PlaidAccountManager plaidAccountManager;

    @BeforeEach
    void setUp() {
    }

    @Test
    void testCreateAccountRequest_whenAccessTokenIsEmpty_thenThrowException(){
        String accessToken = "";
        assertThrows(PlaidApiException.class, () -> plaidAccountManagel.createAccountRequest(accessToken));
    }

    @Test
    void testCreateAccountRequest_whenAccessTokenIsDoesNotMatchAccessTokenInDatabase_thenThrowException(){
        String accessToken = "bad_access_token";
        Long userId = 1L;

        when(plaidLinkService.findPlaidLinkByUserIdAndAccessToken(userId, accessToken)).thenReturn(Optional.of(createPlaidLinkWithBadAccessToken()));

    }

    private PlaidLinkEntity createPlaidLinkWithBadAccessToken(){
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setAccessToken("bad_access_token");
        plaidLinkEntity.setItemId("23232323");
        plaidLinkEntity.setUser(createUserEntity());
        return plaidLinkEntity;
    }

    private UserEntity createUserEntity(){
        UserEntity userEntity = new UserEntity();
        userEntity.setEmail("email@email.com");
        userEntity.setPassword("password");
        userEntity.setFirstName("firstName");
        userEntity.setLastName("lastName");
        return userEntity;
    }

    @AfterEach
    void tearDown() {
    }
}