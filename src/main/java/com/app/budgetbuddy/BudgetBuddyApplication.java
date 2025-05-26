package com.app.budgetbuddy;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.io.IOException;
import java.net.URL;
import java.util.Enumeration;

@SpringBootApplication
public class BudgetBuddyApplication
{

    public static void main(String[] args) {
        ClassLoader cl = BudgetBuddyApplication.class.getClassLoader();
        try {
            Enumeration<URL> urls = cl.getResources("static");
            System.out.println("Static resources found at:");
            while (urls.hasMoreElements()) {
                System.out.println(urls.nextElement());
            }
        } catch (IOException e) {
            e.printStackTrace();
        }
        SpringApplication.run(BudgetBuddyApplication.class, args);
    }

}
