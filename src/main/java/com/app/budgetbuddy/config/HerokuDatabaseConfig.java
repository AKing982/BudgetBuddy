package com.app.budgetbuddy.config;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.net.URI;
import java.net.URISyntaxException;

@Profile("heroku")
@Configuration
public class HerokuDatabaseConfig
{
    @Value("${DATABASE_URL}")
    private String databaseUrl;

    @Bean
//    @Primary
    public DataSource dataSource() {
        URI dbUri;
        try {
            dbUri = new URI(databaseUrl);
        } catch (URISyntaxException e) {
            throw new RuntimeException("Invalid DATABASE_URL", e);
        }

        String username = dbUri.getUserInfo().split(":")[0];
        String password = dbUri.getUserInfo().split(":")[1];
        String dbUrl = "jdbc:postgresql://" + dbUri.getHost() + ':' + dbUri.getPort() + dbUri.getPath();

        HikariConfig config = new HikariConfig();
        config.setJdbcUrl(dbUrl);
        config.setUsername(username);
        config.setPassword(password);
        config.setMaximumPoolSize(5);

        return new HikariDataSource(config);
    }

    private URI parsedUri() {
        try {
            return new URI(databaseUrl);
        } catch (URISyntaxException e) {
            throw new RuntimeException("Invalid DATABASE_URL: " + databaseUrl, e);
        }
    }


    private HikariConfig baseConfig() {
        URI uri = parsedUri();
        String[] userInfo = uri.getUserInfo().split(":");
        String jdbcUrl = "jdbc:postgresql://" + uri.getHost()
                + ":" + uri.getPort() + uri.getPath()
                + "?sslmode=require";          // required on Heroku Postgres

        HikariConfig cfg = new HikariConfig();
        cfg.setJdbcUrl(jdbcUrl);
        cfg.setUsername(userInfo[0]);
        cfg.setPassword(userInfo[1]);
        cfg.setDriverClassName("org.postgresql.Driver");
        return cfg;
    }

    @Bean(name = "quartzDataSource")
    public DataSource quartzDataSource() {
        HikariConfig cfg = baseConfig();
        cfg.setPoolName("QuartzPool");
        cfg.setMaximumPoolSize(2);
        cfg.setMinimumIdle(1);
        return new HikariDataSource(cfg);
    }
}
