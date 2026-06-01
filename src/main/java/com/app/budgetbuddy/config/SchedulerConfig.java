package com.app.budgetbuddy.config;

import com.app.budgetbuddy.workbench.scheduler.EnvelopeContributionJob;
import org.quartz.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.jdbc.DataSourceBuilder;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;
import org.springframework.scheduling.quartz.SpringBeanJobFactory;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
public class SchedulerConfig
{

    @Value("${quartz.datasource.jdbc-url}")
    private String quartzUrl;

    @Value("${quartz.datasource.username}")
    private String quartzUsername;

    @Value("${quartz.datasource.password}")
    private String quartzPassword;

    private final DataSource dataSource;
    private final ApplicationContext applicationContext;

    public SchedulerConfig(DataSource dataSource,
                           ApplicationContext applicationContext)
    {
        this.dataSource = dataSource;
        this.applicationContext = applicationContext;
    }


    @Bean
    @ConfigurationProperties("quartz.datasource")
    public DataSource quartzDataSource() {
        return DataSourceBuilder.create().build();
    }

    @Bean
    public SpringBeanJobFactory springBeanJobFactory(){
        AutowiringSpringBeanJobFactory jobFactory = new AutowiringSpringBeanJobFactory();
        jobFactory.setApplicationContext(applicationContext);
        return jobFactory;
    }

    @Bean
    public SchedulerFactoryBean schedulerFactoryBean()
    {
        SchedulerFactoryBean schedulerFactoryBean = new SchedulerFactoryBean();
        schedulerFactoryBean.setDataSource(quartzDataSource());
        schedulerFactoryBean.setJobFactory(springBeanJobFactory());
        schedulerFactoryBean.setAutoStartup(true);
        schedulerFactoryBean.setOverwriteExistingJobs(true);

        Properties quartzProperties = new Properties();
        quartzProperties.put("org.quartz.jobStore.driverDelegateClass", "org.quartz.impl.jdbcjobstore.PostgreSQLDelegate");
        quartzProperties.put("org.quartz.jobStore.tablePrefix", "QRTZ_");
        quartzProperties.setProperty("org.quartz.jobStore.isClustered", "false");
        schedulerFactoryBean.setQuartzProperties(quartzProperties);
        return schedulerFactoryBean;
    }

    @Bean
    public Scheduler scheduler(SchedulerFactoryBean schedulerFactoryBean) throws Exception
    {
        return schedulerFactoryBean.getScheduler();
    }

    @Bean(name="envelopeContributionJobDetail")
    public JobDetail myEnvelopeContributionJobDetail(){
        return JobBuilder.newJob(EnvelopeContributionJob.class)
                .withIdentity("envelope-contribution")
                .storeDurably()
                .build();
    }

    @Bean
    public Trigger myEnvelopeContributionTrigger(){
        return TriggerBuilder.newTrigger()
                .withIdentity("envelope-contribution-trigger")
                .forJob(myEnvelopeContributionJobDetail())
                .startNow()
                .build();
    }

}
