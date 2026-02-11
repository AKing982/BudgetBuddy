package com.app.budgetbuddy.services;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URL;

@Service
public class PlaidLogoService
{
    private static String PLAID_LOGO_URL = "https://plaid-merchant.logos.com";
    private final TransactionService transactionService;

    @Autowired
    public PlaidLogoService(TransactionService transactionService)
    {
        this.transactionService = transactionService;
    }

    public String getMerchantLogoUrl(String merchantName, String size){
        String formattedName = merchantName.toLowerCase()
                .replaceAll("[^a-zA-Z0-9]", "_")
                .replaceAll("_{2,}", "_")
                .replaceAll("^_|$", "");
        return String.format("%s/%s/%s.png", PLAID_LOGO_URL, size, formattedName);
    }

    public String getSquareMerchantLogo(String merchantName)
    {
        return getMerchantLogoUrl(merchantName, "square");
    }

    public boolean merchantLogoExists(String logoUrl)
    {
        try
        {
            HttpURLConnection connection = (HttpURLConnection) new URL(logoUrl).openConnection();
            connection.setRequestMethod("HEAD");
            connection.connect();
            int responseCode = connection.getResponseCode();
            return responseCode == HttpURLConnection.HTTP_OK;
        }catch(Exception e){
            return false;
        }
    }
}
