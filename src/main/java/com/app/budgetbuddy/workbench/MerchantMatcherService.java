package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.CategoryType;
import com.app.budgetbuddy.domain.Locations;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class MerchantMatcherService
{
    private Map<Locations, CategoryType> locationCategoryMap = new HashMap<>();
    private Map<CategoryMerchant, CategoryType> categoryIdMerchantMap = new HashMap<>();

    public MerchantMatcherService(){
        initializeLocationMaps();
    }

    private void initializeLocationMaps(){
        locationCategoryMap.put(Locations.WALMART, CategoryType.GROCERIES);
        locationCategoryMap.put(Locations.WM_SUPERCENTER, CategoryType.GROCERIES);
        locationCategoryMap.put(Locations.TACO_BELL, CategoryType.ORDER_OUT);
        locationCategoryMap.put(Locations.STEAM, CategoryType.OTHER);
        locationCategoryMap.put(Locations.STATE_FARM, CategoryType.INSURANCE);
        locationCategoryMap.put(Locations.L3_TECHNOLOGIES,CategoryType.INCOME);
        locationCategoryMap.put(Locations.AFFIRM, CategoryType.PAYMENT);
        locationCategoryMap.put(Locations.AFTERPAY, CategoryType.PAYMENT);
        locationCategoryMap.put(Locations.AMAZON, CategoryType.OTHER);
        locationCategoryMap.put(Locations.AMAZON_COM, CategoryType.OTHER);
        locationCategoryMap.put(Locations.AMEX, CategoryType.PAYMENT);
        locationCategoryMap.put(Locations.CLAUDE_AI, CategoryType.SUBSCRIPTION);
        locationCategoryMap.put(Locations.CONSERVICE, CategoryType.UTILITIES);
        locationCategoryMap.put(Locations.DISCOUNT_TIRE, CategoryType.PAYMENT);
        locationCategoryMap.put(Locations.ENBRIDGE_GAS, CategoryType.GAS_UTILITIES);
        locationCategoryMap.put(Locations.FLEX_FINANCE, CategoryType.RENT);
        locationCategoryMap.put(Locations.HARMONS, CategoryType.GROCERIES);
        locationCategoryMap.put(Locations.GREAT_CLIPS, CategoryType.HAIRCUT);
        locationCategoryMap.put(Locations.HBOMAX, CategoryType.SUBSCRIPTION);
        locationCategoryMap.put(Locations.HEROKU, CategoryType.SUBSCRIPTION);
        locationCategoryMap.put(Locations.JETBRAINS, CategoryType.SUBSCRIPTION);
        locationCategoryMap.put(Locations.LAVAZZA, CategoryType.SUBSCRIPTION);
        locationCategoryMap.put(Locations.MAVERIK, CategoryType.GAS);
        locationCategoryMap.put(Locations.MICROSOFT, CategoryType.SUBSCRIPTION);
        locationCategoryMap.put(Locations.NOODLES_AND_COMPANY, CategoryType.ORDER_OUT);
        locationCategoryMap.put(Locations.OLIVE_GARDEN, CategoryType.ORDER_OUT);
        locationCategoryMap.put(Locations.PANDAS_EXPRESS, CategoryType.ORDER_OUT);
        locationCategoryMap.put(Locations.PAYPAL, CategoryType.PAYMENT);
        locationCategoryMap.put(Locations.RAISING_CANES, CategoryType.ORDER_OUT);
        locationCategoryMap.put(Locations.ROCKET_MONEY, CategoryType.SUBSCRIPTION);
        locationCategoryMap.put(Locations.WINCO_FOODS, CategoryType.GROCERIES);
        locationCategoryMap.put(Locations.ROCKTYMTN, CategoryType.ELECTRIC);
        locationCategoryMap.put(Locations.SMITHS, CategoryType.GROCERIES);
        locationCategoryMap.put(Locations.SPOTIFY, CategoryType.SUBSCRIPTION);
        locationCategoryMap.put(Locations.THE_BREAK_SPORTS_GRILL, CategoryType.ORDER_OUT);
    }

    private static class CategoryMerchant {
        private String categoryId;
        private String merchant;

        public CategoryMerchant(String categoryId, String merchant)
        {
            this.categoryId = categoryId;
            this.merchant = merchant;
        }
    }

    public Optional<CategoryType> matchMerchant(String name)
    {
        if (name == null || name.isEmpty()) return Optional.empty();

        String normalized = name.toUpperCase();

        for (Locations loc : Locations.values()) {
            // Check if the enum value (WALMART) or its display value (Wal-Mart)
            // is contained within the transaction name
            if (normalized.contains(loc.name()) || normalized.contains(loc.getValue().toUpperCase())) {
                return Optional.ofNullable(locationCategoryMap.get(loc));
            }
        }
        return Optional.empty();
    }
}
