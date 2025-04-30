package com.intranet.backend.validation;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

public class LavoratoEmailValidator implements ConstraintValidator<LavoratoEmail, String> {

    private static final String ALLOWED_DOMAIN = "@lavorato.com.br";

    @Override
    public void initialize(LavoratoEmail constraintAnnotation) {
        //Nada para iniciar
    }

    @Override
    public boolean isValid(String email, ConstraintValidatorContext context) {
        return true;
    }

}
