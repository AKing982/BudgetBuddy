package com.app.budgetbuddy.domain;

import java.util.HashMap;
import java.util.Map;

public enum Locations
{
    OLIVE_GARDEN,
    PANDAS_EXPRESS,
    SMITHS,
    WINCO_FOODS,
    WALMART,
    GREAT_CLIPS,
    PAYPAL,
    AMAZON,
    JETBRAINS,
    YOUTUBE,
    LAVAZZA,
    UDEMY,
    SPOTIFY,
    EBAY,
    HARMONS,
    AFFIRM,
    ENBRIDGE_GAS,
    ROCKTYMTN,
    CONSERVICE,
    GUSTO,
    FLEX_FINANCE,
    MAVERICK,
    AMEX,
    STEAM,
    CLAUDE_AI,
    MICROSOFT,
    STATE_FARM,
    PLANET_FITNESS,
    WALGREENS,
    THE_BREAK_SPORTS_GRILL;

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
