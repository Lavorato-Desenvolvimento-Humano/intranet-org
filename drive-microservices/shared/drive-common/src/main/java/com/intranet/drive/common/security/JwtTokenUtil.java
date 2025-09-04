package com.intranet.drive.common.security;

import com.intranet.drive.common.dto.UserDto;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@Component
public class JwtTokenUtil {

    @Value("${jwt.secret:MySecretKeyForJWTTokenGenerationThatShouldBeLongEnough}")
    private String secret;

    @Value("${jwt.expiration:86400}")
    private Long expiration;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes());
    }

    public String getUsernameFromToken(String token) {
        return getClaimFromToken(token, Claims::getSubject);
    }

    public Date getExpirationDateFromToken(String token) {
        return getClaimFromToken(token, Claims::getExpiration);
    }

    public <T> T getClaimFromToken(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = getAllClaimsFromToken(token);
        return claimsResolver.apply(claims);
    }

    private Claims getAllClaimsFromToken(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Boolean isTokenExpired(String token) {
        final Date expiration = getExpirationDateFromToken(token);
        return expiration.before(new Date());
    }

    public String generateToken(UserDto user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("id", user.getId());
        claims.put("email", user.getEmail());
        claims.put("nome", user.getNome());
        claims.put("roles", user.getRoles());
        claims.put("authorities", user.getAuthorities());

        return createToken(claims, user.getUsername());
    }

    private String createToken(Map<String, Object> claims, String subject) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expiration * 1000))
                .signWith(getSigningKey(), SignatureAlgorithm.HS512)
                .compact();
    }

    public Boolean validateToken(String token, String username) {
        final String tokenUsername = getUsernameFromToken(token);
        return (tokenUsername.equals(username) && !isTokenExpired(token));
    }

    public List<GrantedAuthority> getAuthoritiesFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);

        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) claims.get("roles");

        @SuppressWarnings("unchecked")
        List<String> authorities = (List<String>) claims.get("authorities");

        Set<GrantedAuthority> grantedAuthorities = new HashSet<>();

        if (roles != null) {
            grantedAuthorities.addAll(roles.stream()
                    .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                    .collect(Collectors.toList())
            );
        }

        if (authorities != null) {
            grantedAuthorities.addAll(authorities.stream()
                    .map(SimpleGrantedAuthority::new)
                    .collect(Collectors.toList()));
        }

        return new ArrayList<>(grantedAuthorities);
    }

    public UserDto getUserFromToken(String token) {
        Claims claims = getAllClaimsFromToken(token);

        UserDto user =  new UserDto();
        user.setId(Long.valueOf(claims.get("id").toString()));
        user.setUsername(claims.getSubject());
        user.setEmail((String) claims.get("email"));
        user.setNome((String) claims.get("nome"));

        @SuppressWarnings("unchecked")
        List<String> roles = (List<String>) claims.get("roles");
        if (roles != null) {
            user.setRoles(new HashSet<>(roles));
        }

        @SuppressWarnings("unchecked")
        List<String> authorities = (List<String>) claims.get("authorities");
        if (authorities != null) {
            user.setAuthorities(new HashSet<>(authorities));
        }

        return user;
    }
}
