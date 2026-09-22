package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.exceptions.InvalidAccessTokenException;
import com.app.budgetbuddy.services.InvestmentHoldingsService;
import com.app.budgetbuddy.services.InvestmentTransactionService;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.services.UserService;
import com.plaid.client.model.*;
import com.plaid.client.request.PlaidApi;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import retrofit2.Call;
import retrofit2.Response;

import java.io.IOException;
import java.time.LocalDate;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class PlaidInvestmentManager extends AbstractPlaidManager
{
    private final InvestmentHoldingsService holdingsService;
    private final InvestmentTransactionService investmentTransactionService;

    @Value("${plaid.secret}")
    private String secret;

    public PlaidInvestmentManager(PlaidLinkService plaidLinkService, UserService userService, PlaidApi plaidApi,
                                  InvestmentHoldingsService holdingsService,
                                  InvestmentTransactionService investmentTransactionService)
    {
        super(plaidLinkService, userService, plaidApi);
        this.holdingsService = holdingsService;
        this.investmentTransactionService = investmentTransactionService;
    }

    private InvestmentsHoldingsGetRequest createInvestmentHoldingsRequest(String accessToken)
    {
        return new InvestmentsHoldingsGetRequest()
                .accessToken(accessToken)
                .secret(secret);
    }

    private InvestmentsTransactionsGetRequest createInvestmentTransactionsRequest(String accessToken, LocalDate startDate, LocalDate endDate)
    {
        return new InvestmentsTransactionsGetRequest()
                .accessToken(accessToken)
                .secret(secret)
                .startDate(startDate)
                .endDate(endDate);
    }

    @Async("taskExecutor")
    public CompletableFuture<InvestmentsHoldingsGetResponse> getAsyncInvestmentHoldingsResponse(Long userId, String accessToken) throws IOException
    {
        if(accessToken.isEmpty())
        {
            throw new InvalidAccessTokenException("Invalid access token was found.");
        }
        InvestmentsHoldingsGetRequest investmentsHoldingsGetRequest = createInvestmentHoldingsRequest(accessToken);
        Call<InvestmentsHoldingsGetResponse> investmentHoldingsGetResponseCall = plaidApi.investmentsHoldingsGet(investmentsHoldingsGetRequest);
        Response<InvestmentsHoldingsGetResponse> investmentHoldingsResponse = investmentHoldingsGetResponseCall.execute();
        if(investmentHoldingsResponse.isSuccessful())
        {
            return CompletableFuture.completedFuture(investmentHoldingsResponse.body());
        }
        else
        {
            int attempts = 0;
            while(attempts < MAX_ATTEMPTS)
            {
                try
                {
                    Response<InvestmentsHoldingsGetResponse> investmentHoldingsResponse2 = plaidApi.investmentsHoldingsGet(investmentsHoldingsGetRequest).execute();
                    if(investmentHoldingsResponse2.isSuccessful())
                    {
                        return CompletableFuture.completedFuture(investmentHoldingsResponse2.body());
                    }
                    else
                    {
                        attempts++;
                        if(attempts == MAX_ATTEMPTS)
                        {
                            log.error("There was an error fetching investment holdings: {}", investmentHoldingsResponse2.errorBody().string());
                        }
                    }
                }catch(IOException e){
                    log.error("There was an error fetching investment holdings: ", e);
                    return CompletableFuture.failedFuture(e);
                }
            }
        }
        return CompletableFuture.failedFuture(new RuntimeException("There was an error getting the investment holdings response"));
    }

    @Async("taskExecutor")
    public CompletableFuture<InvestmentsTransactionsGetResponse> getAsyncInvestmentTransactionsResponse(Long userId, String accessToken, LocalDate startDate, LocalDate endDate) throws IOException
    {
        InvestmentsTransactionsGetRequest investmentsTransactionsGetRequest = createInvestmentTransactionsRequest(accessToken, startDate, endDate);
        Call<InvestmentsTransactionsGetResponse> investmentTransactionsGetResponseCall = plaidApi.investmentsTransactionsGet(investmentsTransactionsGetRequest);
        Response<InvestmentsTransactionsGetResponse> investmentsTransactionsResponse = investmentTransactionsGetResponseCall.execute();
        if(investmentsTransactionsResponse.isSuccessful())
        {
            return CompletableFuture.completedFuture(investmentsTransactionsResponse.body());
        }
        else
        {
            int attempts = 0;
            while(attempts < MAX_ATTEMPTS)
            {
                try
                {
                    Response<InvestmentsTransactionsGetResponse> investmentTransactionsResponse2 = plaidApi.investmentsTransactionsGet(investmentsTransactionsGetRequest).execute();
                    if(investmentTransactionsResponse2.isSuccessful())
                    {
                        return CompletableFuture.completedFuture(investmentTransactionsResponse2.body());
                    }
                    else
                    {
                        attempts++;
                        if(attempts == MAX_ATTEMPTS)
                        {
                            log.error("There was an error fetching investment transactions: {}", investmentTransactionsResponse2.errorBody().string());
                        }
                    }
                }catch(IOException ex){
                    log.error("There was an error fetching investment transactions: ", ex);
                    return CompletableFuture.failedFuture(ex);
                }
            }
        }
        return CompletableFuture.failedFuture(new RuntimeException("There was an error getting the investment transactions response"));
    }
}
