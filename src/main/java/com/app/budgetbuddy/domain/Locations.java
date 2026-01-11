package com.app.budgetbuddy.domain;

import lombok.Getter;

import java.util.HashMap;
import java.util.Map;

@Getter
public enum Locations
{
    OLIVE_GARDEN("Olive Garden"),
    THE_BREAK_SPORTS_GRILL("The Break Sports And Grill"),
    SP_STROM_HOLDINGS_LLC("SP Strom Holdings LLC"),
    RAISING_CANES("Raising Canes"),
    FLEXIBLE_FINANCE("Flexible Finance"),
    WENDYS("Wendys"),
    ROCKET_MONEY("Rocket Money"),
    HBOMAX("HBOMAX"),
    TACO_BELL("Taco Bell"),
    DUTCH_BROS("Dutch Bros"),
    DISCOUNT_TIRE("Discount-Tire"),
    STEAM_GAMES("SteamGames.com"),
    APPLE_COM("Apple.com"),
    NOODLES_AND_COMPANY("Noodles And Company"),
    PANDAS_EXPRESS("Panda Express"),
    SMITHS("Smiths"),
    L3_TECHNOLOGIES("L3 Technologies"),
    WINCO_FOODS("Winco Foods"),
    WALMART("Walmart"),
    AFTERPAY("AfterPay"),
    WALGREENS("Walgreens"),
    GREAT_CLIPS("Great Clips"),
    PAYPAL("PayPal"),
    AMAZON("Amazon"),
    AMAZON_COM("Amazon.com"),
    JETBRAINS("JetBrains"),
    WM_SUPERCENTER("WM Supercenter"),
    YOUTUBE("Youtube"),
    LAVAZZA("Lavazza"),
    INTERMOUNTAIN_MYCHART("Intermountain MyChart"),
    UDEMY("Udemy"),
    SPOTIFY("Spotify"),
    EBAY("Ebay"),
    PEARSON_PLUS("Pearsonplus.com"),
    UI_BEN_EFT("UI BEN EFT"),
    HARMONS("Harmons"),
    AFFIRM("Affirm"),
    ENBRIDGE_GAS("Enbridge Gas"),
    ROCKTYMTN("Rocky Mountain Pacific"),
    WAL_MART("Wal-Mart"),
    BEAR_VALLEY("Bear Valley"),
    THUNDER_WASH("Thunder Wash"),
    STATE_LIQUOR("State Liquor"),
    SEZZLE_INC("Sezzle Inc"),
    HEROKU("Heroku"),
    PIRATE_OS_GOURMET("Pirate OS Gourmet"),
    CONSERVICE("Conservice"),
    GUSTO("Gusto"),
    FLEX_FINANCE("Flex Finance"),
    MAVERIK("Maverik"),
    AMEX("AMEX"),
    STEAM("Steam"),
    CLAUDE_AI("Claude.ai"),
    MICROSOFT("Microsoft"),
    STATE_FARM("State Farm"),
    PLANET_FITNESS("Planet Fitness"),
    APPLE("Apple");

    private String value;

    Locations(String value) {
        this.value = value;
    }


    public static final Map<String, Locations> LOCATIONS_MAP = new HashMap<>();

    private static Map<String, Locations> createLocationMap() {
        Map<String, Locations> map = new HashMap<>();
        for (Locations location : values()) {
            map.put(location.toString(), location);
            // Also map with spaces instead of underscores for easy lookups
            map.put(location.toString().replace('_', ' '), location);
        }
        return map;
    }
}
