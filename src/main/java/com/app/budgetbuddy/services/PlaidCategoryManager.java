package com.app.budgetbuddy.services;

import com.app.budgetbuddy.domain.PlaidCategory;
import com.plaid.client.model.CategoriesGetResponse;
import com.plaid.client.model.Category;
import com.plaid.client.request.PlaidApi;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import retrofit2.Response;

import java.io.IOException;
import java.util.Collections;
import java.util.List;

@Service
public class PlaidCategoryManager
{
    private final PlaidApi plaidApi;
    private final CategoryService categoryService;

    @Autowired
    public PlaidCategoryManager(PlaidApi plaidApi,
                                CategoryService categoryService)
    {
        this.plaidApi = plaidApi;
        this.categoryService = categoryService;
    }

    public void createAndSaveCategories(List<PlaidCategory> plaidCategories)
    {

    }

    public List<PlaidCategory> getPlaidCategories() throws IOException
    {
        try
        {
            Response<CategoriesGetResponse> response = plaidApi
                    .categoriesGet(new Object())
                    .execute();

            if(response.isSuccessful() && response.body() != null)
            {
                List<Category> categoryList = response.body().getCategories();
                return categoryList.stream()
                        .map(category -> {
                            PlaidCategory plaidCategory = new PlaidCategory();
                            plaidCategory.setCategoryId(category.getCategoryId());
                            List<String> hierarchy = category.getHierarchy();
                            if(hierarchy.size() == 2)
                            {
                                plaidCategory.setPrimaryCategory(hierarchy.get(0));
                                plaidCategory.setSecondaryCategory(hierarchy.get(1));
                            }
                            else if(hierarchy.size() == 1)
                            {
                                plaidCategory.setPrimaryCategory(hierarchy.get(0));
                            }
                            return plaidCategory;
                        })
                        .toList();
            }
            return Collections.emptyList();
        } catch (IOException e) {
            throw new IOException("Error calling Plaid API: " + e.getMessage(), e);
        }
    }
}
