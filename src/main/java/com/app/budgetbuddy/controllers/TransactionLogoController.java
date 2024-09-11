package com.app.budgetbuddy.controllers;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.net.URI;

@RestController
@RequestMapping(value="/api/logos")
@CrossOrigin(value="http://localhost:3000")
public class TransactionLogoController {

    private static final String PLAID_LOGO_URL = "https://plaid-merchant-logos.plaid.com/";

    @GetMapping("/{name}")
    public ResponseEntity<?> getTransactionLogo(@PathVariable String name) {
        try
        {
            RestTemplate restTemplate = new RestTemplate();
            URI uri = new URI(PLAID_LOGO_URL + name);
            byte[] imageBytes = restTemplate.getForObject(uri, byte[].class);
            MediaType contentType = MediaType.IMAGE_PNG;
            return ResponseEntity.ok().contentType(contentType).body(imageBytes);

        }catch(Exception e)
        {
            return ResponseEntity.notFound().build();
        }
    }
}
