package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Locations;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;

@Service
public class MerchantNameBuilder {

    private final List<MerchantNameExtractor> extractors;

    @Autowired
    public MerchantNameBuilder(List<MerchantNameExtractor> extractors) {
        this.extractors = extractors;
    }

    public String build(String institution, String description, String extendedDescription) {
        return extractors.stream()
                .filter(e -> e.supports(institution))
                .findFirst()
                .map(e -> e.extract(description, extendedDescription))
                .orElse(description); // Fallback to raw description
    }
}

//
//@Service
//@Slf4j
//public class MerchantNameBuilder
//{
//    private static final List<String> DESCRIPTION_PREFIXES = List.of(
//            "Withdrawal Debit ",
//            "Withdrawal Ach S Type: Payments CO: ",
//            "Withdrawal # ",
//            "Withdrawal Ach ",
//            "Withdrawal ",
//            "Salary/Regular Income from ",
//            "Purchase ",
//            "Pin Purchase "
//    );
//
//    private static final Map<String, String> MERCHANT_ALIASES = Map.of(
//            "Tst*", "The Break Sports Grill",
//            "Sp+Aff *", "Affirm",
//            "Affirm *", "Affirm"
//    );
//
//    public String build(String institution, String description, String extendedDescription)
//    {
//        String merchantName = "";
//        if(institution.equalsIgnoreCase("Granite Credit Union"))
//        {
//            merchantName = getMerchantNameByExtendedDescription(extendedDescription, description);
//        }
//        else if(institution.equalsIgnoreCase("Mountain America Credit Union"))
//        {
//            merchantName = getMountainAmericaMerchantName(description, extendedDescription);
//        }
//        return merchantName;
//    }
//
//    public String getMountainAmericaMerchantName(String description, String extendedDescription)
//    {
//        if (description == null || description.trim().isEmpty()) {
//            return extendedDescription != null ? extendedDescription.trim() : " ";
//        }
//
//        String trimmed = description.trim();
//
//        // If description looks clean (no known prefixes), return it directly
//        boolean descriptionIsPolluted = DESCRIPTION_PREFIXES.stream()
//                .anyMatch(prefix -> trimmed.toLowerCase().startsWith(prefix.toLowerCase()));
//
//        if (!descriptionIsPolluted) {
//            // Check aliases on the clean description too
//            for (Map.Entry<String, String> alias : MERCHANT_ALIASES.entrySet()) {
//                if (trimmed.contains(alias.getKey())) {
//                    return alias.getValue();
//                }
//            }
//            return trimmed;
//        }
//
//        // Description is polluted — resolve from it using the same logic as extended description
//        return resolveMerchantName(trimmed);
//    }
//
//    private String resolveMerchantName(String raw)
//    {
//        if(raw == null || raw.trim().isEmpty())
//        {
//            return " ";
//        }
//        try
//        {
//            String trimmed = raw.trim();
//
//            // Step 1: Check aliases
//            for (Map.Entry<String, String> alias : MERCHANT_ALIASES.entrySet()) {
//                if (trimmed.toLowerCase().contains(alias.getKey().toLowerCase())) {
//                    log.info("Matched alias: {} -> {}", alias.getKey(), alias.getValue());
//                    return alias.getValue();
//                }
//            }
//
//            // Step 2: Strip known prefixes
//            for (String prefix : DESCRIPTION_PREFIXES) {
//                if (trimmed.toLowerCase().startsWith(prefix.toLowerCase())) {
//                    trimmed = trimmed.substring(prefix.length()).trim();
//                    log.info("Stripped prefix, remaining: {}", trimmed);
//                    break;
//                }
//            }
//
//            int dashIndex = trimmed.indexOf(" - ");
//            if (dashIndex > 0) {
//                trimmed = trimmed.substring(0, dashIndex).trim();
//            }
//
//            // Step 3: Truncate at location
//            for (Locations location : Locations.values()) {
//                String locationValue = location.getValue();
//                if (trimmed.toLowerCase().contains(locationValue.toLowerCase())) {
//                    int index = trimmed.toLowerCase().indexOf(locationValue.toLowerCase());
//                    String candidate = trimmed.substring(0, index).trim();
//                    candidate = candidate.replaceAll("[\\s\\-*]+$", "").trim();
//                    if (!candidate.isEmpty()) {  // only accept if something meaningful remains
//                        trimmed = candidate;
//                        log.info("Trimmed at location: {}", trimmed);
//                        break;
//                    }
//                    // otherwise skip this location match and keep going
//                }
//            }
//
//            // Step 4: Truncate at date marker
//            int dateIndex = trimmed.toLowerCase().indexOf(" date ");
//            if (dateIndex > 0) {
//                trimmed = trimmed.substring(0, dateIndex).trim();
//            }
//
//            // Step 5: Truncate at card number pattern
//            trimmed = trimmed.replaceAll("\\s+XX-\\d+.*", "").trim();
//
//            // Step 6: Truncate at "Card NNNN" pattern (Mountain America specific)
//            int nameIndex = trimmed.indexOf(" Name:");
//            if (nameIndex > 0) {
//                trimmed = trimmed.substring(0, nameIndex).trim();
//            }
//
//            // Step 7: Strip CO: pattern for ACH withdrawals e.g. "State Farm Billg Name: King..."
//            int coIndex = trimmed.toLowerCase().indexOf(" name:");
//            if (coIndex > 0) {
//                trimmed = trimmed.substring(0, coIndex).trim();
//            }
//
//            log.info("Final Merchant Name: {}", trimmed);
//            return trimmed;
//
//        } catch (Exception ex) {
//            log.error("Error resolving merchant name from: {}", raw, ex);
//            throw ex;
//        }
//    }
//
//    public String getMerchantNameByExtendedDescription(String extendedDescription, String description)
//    {
//        if(extendedDescription == null || extendedDescription.trim().isEmpty())
//        {
//            log.info("Extended Description is null or empty");
//            return description != null ? description : " ";
//        }
//        try
//        {
//            String trimmedExtendedDescription = extendedDescription.trim();
//            log.info("Original Merchant Name: {}", trimmedExtendedDescription);
//            Locations[] locations = Locations.values();
//            for(Locations location : locations)
//            {
//                String locationValue = location.getValue();
//                log.info("Location Value: {}", locationValue);
//                String toLowerValue = locationValue.toLowerCase();
//                log.info("ToLower Value: {}", toLowerValue);
//                if(trimmedExtendedDescription.toLowerCase().contains(locationValue.toLowerCase()))
//                {
//                    log.info("Merchant Name contains: {}", locationValue);
//                    int toUpperIndex = trimmedExtendedDescription.indexOf(toLowerValue);
//                    int toUpperLength = toLowerValue.length();
//                    trimmedExtendedDescription = trimmedExtendedDescription.substring(0, toUpperIndex + toUpperLength + 1).trim();
//                    log.info("Trimmed Merchant Name substring: {}", trimmedExtendedDescription);
//                    break;
//                }
//            }
//            return trimmedExtendedDescription;
//        }catch(Exception ex){
//            log.error("There was an error converting extended description to merchant name", ex);
//            throw ex;
//        }
//    }
//}
