package com.intranet.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
    // A anotação @EnableScheduling é suficiente para habilitar o agendamento de tarefas
}
