package com.app.budgetbuddy.workbench;

import com.app.budgetbuddy.domain.Locations;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

@Service
@Slf4j
public class GraniteExtractor implements MerchantNameExtractor
{
    @Override
    public boolean supports(String institution)
    {
        return "Granite Credit Union".equalsIgnoreCase(institution);
    }

    @Override
    public String extract(String description, String extendedDescription)
    {
        if(extendedDescription == null || extendedDescription.isBlank())
        {
            return description != null ? description.trim() : "";
        }

        String result = extendedDescription.trim();
        for(Locations loc : Locations.values())
        {
            String val = loc.getValue().toLowerCase();
            if (result.toLowerCase().contains(val))
            {
                int idx = result.toLowerCase().indexOf(val);
                return result.substring(0, idx + val.length()).trim();
            }
        }
        return result;
    }
}
