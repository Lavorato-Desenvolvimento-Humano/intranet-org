package com.intranet.backend.validation;

import java.lang.annotation.*;
import jakarta.validation.Constraint;
import jakarta.validation.Payload;

@Documented
@Constraint(validatedBy = LavoratoEmailValidator.class)
@Target({ElementType.FIELD})
@Retention(RetentionPolicy.RUNTIME)
public @interface LavoratoEmail {
    String message() default "Apenas emails com domínio @lavorato.com.br são permitidos";
    Class<?>[] groups() default {};
    Class<? extends Payload>[] payload() default {};
}
