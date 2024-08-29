package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.InvalidAccessTokenException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.AccountsGetRequest;
import com.plaid.client.model.AccountsGetResponse;
import com.plaid.client.request.PlaidApi;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.mock;
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
        Long userId = 1L;
        assertThrows(PlaidApiException.class, () -> plaidAccountManager.createAccountRequest(accessToken));
    }


   @Test
   void testGetAccountsForUser_whenUserIsNull_thenThrowException() throws PlaidApiException {
        Long userId = null;
        assertThrows(InvalidUserIDException.class, () -> plaidAccountManager.getAccountsForUser(userId));
   }

   @Test
   void testGetAccountsForUser_whenUserIdIsValid_thenReturnResponse() throws IOException {
        Long userId = 1L;
        String accessToken = "access_token";

        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(createPlaidLinkEntity()));
        AccountsGetRequest accountsGetRequest = new AccountsGetRequest().accessToken(accessToken);
        AccountsGetResponse expectedResponse = new AccountsGetResponse();

        Call<AccountsGetResponse> callSuccessful = mock(Call.class);
        when(plaidApi.accountsGet(accountsGetRequest)).thenReturn(callSuccessful);
        when(callSuccessful.execute()).thenReturn(Response.success(expectedResponse));

        AccountsGetResponse actual = plaidAccountManager.getAccountsForUser(userId);
        assertNotNull(actual);
   }

   @Test
   void testGetAccountsForUser_whenExceptionThrown_thenThrowException() throws PlaidApiException {
        Long userId = 1L;
        String accessToken = "access_token";
        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.empty());
   }



    private PlaidLinkEntity createPlaidLinkEntity(){
        PlaidLinkEntity plaidLinkEntity = new PlaidLinkEntity();
        plaidLinkEntity.setId(1L);
        plaidLinkEntity.setAccessToken("access_token");
        plaidLinkEntity.setUser(createUserEntity());
        return plaidLinkEntity;
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