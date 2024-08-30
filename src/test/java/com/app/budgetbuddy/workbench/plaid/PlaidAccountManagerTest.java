package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.entities.UserEntity;
import com.app.budgetbuddy.exceptions.InvalidAccessTokenException;
import com.app.budgetbuddy.exceptions.InvalidUserIDException;
import com.app.budgetbuddy.exceptions.PlaidApiException;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import okhttp3.MediaType;
import okhttp3.ResponseBody;
import org.assertj.core.util.Arrays;
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
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
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
   void testGetAccountsForUser_whenExceptionThrown_thenThrowException() throws IOException {
        Long userId = 1L;
        String accessToken = "access_token";
        when(plaidLinkService.findPlaidLinkByUserID(userId)).thenReturn(Optional.of(createPlaidLinkEntity()));

        AccountsGetRequest accountsGetRequest = new AccountsGetRequest().accessToken(accessToken);

        Call<AccountsGetResponse> callUnsuccessful = mock(Call.class);
        when(plaidApi.accountsGet(accountsGetRequest)).thenReturn(callUnsuccessful);
        when(callUnsuccessful.execute()).thenThrow(new IOException());
        assertThrows(IOException.class, () -> plaidAccountManager.getAccountsForUser(userId));
   }

   @Test
   void testGetAccountsForUserWithRetryResponse_whenAccountsGetRequestIsNull_thenThrowException() throws PlaidApiException {
        assertThrows(IllegalArgumentException.class, () -> plaidAccountManager.getAccountsForUser(null));
   }

   @Test
   void testGetAccountsForUserWithRetryResponse_whenResponseNotSuccessfulThenSuccessful_thenReturnResponse() throws IOException {
        AccountsGetRequest accountsGetRequest = new AccountsGetRequest().accessToken("access_token");
        Call<AccountsGetResponse> callUnsuccessful = mock(Call.class);
        when(callUnsuccessful.execute()).thenReturn(Response.error(400, ResponseBody.create(MediaType.parse("application/json"), "Error")));

        List<AccountBase> accountBaseList = new ArrayList<>();
        accountBaseList.add(testAccount());
        accountBaseList.add(testAccount());
        AccountsGetResponse expectedResponse = new AccountsGetResponse();
        expectedResponse.setAccounts(accountBaseList);

        Call<AccountsGetResponse> callSuccessful = mock(Call.class);
        when(callSuccessful.execute()).thenReturn(Response.success(expectedResponse));

        when(plaidApi.accountsGet(accountsGetRequest)).thenReturn(callUnsuccessful, callSuccessful);
        Response<AccountsGetResponse> actualResponse = plaidAccountManager.getAccountsForUserWithRetryResponse(accountsGetRequest);
        assertNotNull(actualResponse);
        assertEquals(expectedResponse.getAccounts(), actualResponse.body().getAccounts());
   }


   private AccountBase testAccount(){
        AccountBase accountBase = new AccountBase();
        accountBase.setName("Test Checking");
        accountBase.setBalances(createAccountBalance());
        accountBase.setAccountId("e23abs2");
        accountBase.setSubtype(AccountSubtype.CHECKING);
        accountBase.setType(AccountType.DEPOSITORY);
        return accountBase;
   }

   private AccountBalance createAccountBalance(){
        AccountBalance accountBalance = new AccountBalance();
        accountBalance.setCurrent(Double.valueOf(1200));
        accountBalance.setAvailable(Double.valueOf(1050));
        return accountBalance;
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