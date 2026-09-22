package com.app.budgetbuddy.workbench.runner;

import com.app.budgetbuddy.domain.InvestmentHoldings;
import com.app.budgetbuddy.domain.InvestmentTransactionToEntityConverter;
import com.app.budgetbuddy.domain.Investments;
import com.app.budgetbuddy.entities.InvestmentHoldingsEntity;
import com.app.budgetbuddy.entities.InvestmentTransactionEntity;
import com.app.budgetbuddy.entities.PlaidLinkEntity;
import com.app.budgetbuddy.exceptions.PlaidLinkException;
import com.app.budgetbuddy.services.InvestmentHoldingsService;
import com.app.budgetbuddy.services.InvestmentTransactionService;
import com.app.budgetbuddy.services.PlaidLinkService;
import com.app.budgetbuddy.workbench.converter.InvestmentHoldingsConverter;
import com.app.budgetbuddy.workbench.converter.InvestmentTransactionsConverter;
import com.app.budgetbuddy.workbench.plaid.PlaidInvestmentManager;
import com.plaid.client.model.Holding;
import com.plaid.client.model.InvestmentTransaction;
import com.plaid.client.model.InvestmentsHoldingsGetResponse;
import com.plaid.client.model.InvestmentsTransactionsGetResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.concurrent.CompletableFuture;

@Service
@Slf4j
public class PlaidInvestmentRunner
{
    private final PlaidInvestmentManager plaidInvestmentManager;
    private final PlaidLinkService plaidLinkService;
    private final InvestmentHoldingsService investmentHoldingsService;
    private final InvestmentTransactionService investmentTransactionService;
    private final InvestmentHoldingsConverter investmentHoldingsConverter;
    private final InvestmentTransactionsConverter investmentTransactionsConverter;

    @Autowired
    public PlaidInvestmentRunner(PlaidInvestmentManager plaidInvestmentManager,
                                 InvestmentHoldingsConverter plaidInvestmentConverter,
                                 InvestmentTransactionsConverter investmentTransactionsConverter,
                                 InvestmentHoldingsService investmentHoldingsService,
                                 InvestmentTransactionService investmentTransactionService,
                                 PlaidLinkService plaidLinkService)
    {
        this.plaidInvestmentManager = plaidInvestmentManager;
        this.investmentHoldingsConverter = plaidInvestmentConverter;
        this.investmentTransactionsConverter = investmentTransactionsConverter;
        this.investmentHoldingsService = investmentHoldingsService;
        this.investmentTransactionService = investmentTransactionService;
        this.plaidLinkService = plaidLinkService;
    }

    public List<InvestmentTransactionEntity> getUserInvestmentTransactions(Long userId, LocalDate startDate, LocalDate endDate)
    {
        return investmentTransactionService.findByUserId(userId, startDate, endDate);
    }

    public List<InvestmentHoldingsEntity> getUserInvestmentHoldings(Long userId)
    {
        return investmentHoldingsService.findByUserId(userId);
    }

    public List<InvestmentHoldings> getInvestmentHoldingsResponse(Long userId)
    {
        try
        {
            PlaidLinkEntity plaidLinkEntities = getUserPlaidLink(userId);
            String accessToken = plaidLinkEntities.getAccessToken();
            if(accessToken.isEmpty())
            {
                throw new PlaidLinkException("Invalid access token found for user id: " + userId);
            }
            CompletableFuture<InvestmentsHoldingsGetResponse> investmentHoldingsGetResponse = plaidInvestmentManager.getAsyncInvestmentHoldingsResponse(userId, accessToken);
            InvestmentsHoldingsGetResponse holdingsResponse = investmentHoldingsGetResponse.join();
            if(holdingsResponse == null)
            {
                throw new PlaidLinkException("There was an error fetching investment holdings");
            }
            List<Holding> holdings = holdingsResponse.getHoldings();
            if(holdings == null)
            {
                return Collections.emptyList();
            }
            log.info("RAW Holdings: {}", holdings.toString());
            log.info("RAW Holdings size: {}", holdings.size());
            log.info("Fetched {} holdings", holdings.size());
            return holdings.stream()
                    .map(investmentHoldingsConverter::convert)
                    .distinct()
                    .toList();

        }catch(Exception ex){
            log.error("There was an error fetching investment transactions: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public List<com.app.budgetbuddy.domain.InvestmentTransaction> getInvestmentTransactionsResponse(Long userId, LocalDate startDate, LocalDate endDate)
    {
        try
        {
            PlaidLinkEntity plaidLinkEntity = getUserPlaidLink(userId);
            String accessToken = plaidLinkEntity.getAccessToken();
            if(accessToken.isEmpty())
            {
                throw new PlaidLinkException("Invalid access token found for user id: " + userId);
            }
            CompletableFuture<InvestmentsTransactionsGetResponse> investmentsGetResponse = plaidInvestmentManager.getAsyncInvestmentTransactionsResponse(userId, accessToken, startDate, endDate);
            InvestmentsTransactionsGetResponse transactionsResponse = investmentsGetResponse.join();
            List<InvestmentTransaction> investmentTransactions = transactionsResponse.getInvestmentTransactions();
            return investmentTransactions.stream()
                    .map(investmentTransactionsConverter::convert)
                    .toList();

        }catch(Exception ex){
            log.error("There was an error fetching investment transactions: {}", ex.getMessage());
            return Collections.emptyList();
        }
    }

    public List<InvestmentTransactionEntity> saveInvestments(List<com.app.budgetbuddy.domain.InvestmentTransaction> investmentTransactions)
    {
        if(investmentTransactions.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            return investmentTransactionService.createAndSave(investmentTransactions);
        }catch(Exception e){
            log.error("There was an error saving investment transactions: ", e);
            return Collections.emptyList();
        }
    }

    public List<InvestmentHoldingsEntity> saveInvestmentHoldings(List<InvestmentHoldings> investmentHoldings)
    {
        if(investmentHoldings.isEmpty())
        {
            return Collections.emptyList();
        }
        try
        {
            return investmentHoldingsService.createAndSave(investmentHoldings);
        }catch(Exception e){
            log.error("There was an error saving investment holdings: ", e);
            return Collections.emptyList();
        }
    }

    private PlaidLinkEntity getUserPlaidLink(Long userId)
    {
        return plaidLinkService.findPlaidLinkByUserID(userId)
                .stream()
                .filter(e -> e.getInstitution().equalsIgnoreCase(Investments.FIDELITY.toString()))
                .findFirst()
                .orElseThrow(() -> new PlaidLinkException("No valid plaid link found for user id: " + userId));
    }
}
