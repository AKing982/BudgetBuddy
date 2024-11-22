package com.app.budgetbuddy.workbench.plaid;

import com.app.budgetbuddy.services.PlaidLinkService;
import com.plaid.client.model.CategoriesGetResponse;
import com.plaid.client.model.Category;
import com.plaid.client.request.PlaidApi;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.util.Collection;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

//@Service
//public class PlaidCategoryManager extends AbstractPlaidManager
//{
//    private Map<String, String> categoryMap = new ConcurrentHashMap<>();
//
//
//    public PlaidCategoryManager(PlaidLinkService plaidLinkService, PlaidApi plaidApi) {
//        super(plaidLinkService, plaidApi);
//    }
//
//    public Category getCategoryProperties(String categoryId) throws IOException
//    {
//        return null;
//    }
//
//    public Collection<Category> getCategories()
//    {
//        return null;
//    }
//}
