package com.app.budgetbuddy.domain;

import java.util.HashMap;
import java.util.Map;

public enum Locations
{
    OLIVE_GARDEN("Olive Garden"),
    PANDAS_EXPRESS("Pandas Express"),
    SMITHS("Smiths"),
    WINCO_FOODS("Winco Foods"),
    WALMART("Walmart"),
    GREAT_CLIPS("Great Clips"),
    PAYPAL("PayPal"),
    AMAZON("Amazon"),
    JETBRAINS("JetBrains"),
    YOUTUBE("Youtube"),
    LAVAZZA("Lavazza"),
    UDEMY("Udemy"),
    SPOTIFY("Spotify"),
    EBAY("Ebay"),
    HARMONS("Harmons"),
    AFFIRM("Affirm"),
    ENBRIDGE_GAS("Enbridge Gas"),
    ROCKTYMTN("Rocky Mountain Power"),
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
    WALGREENS("Walgreens"),
    APPLE("Apple"),
    THE_BREAK_SPORTS_GRILL("The Break Sports Grill");

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
