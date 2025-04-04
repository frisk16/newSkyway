package com.example.newSkyWay.security;

import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.newSkyWay.entity.User;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
public class UserDetailsImpl implements UserDetails {

	private final User user;
	private final Collection<GrantedAuthority> authorities;
	
	public User getUser() {
		return this.user;
	}
	
	@Override
	public String getUsername() {
		return this.user.getUserName();
	}
	
	@Override
	public String getPassword() {
		return this.user.getPassword();
	}
	
	@Override
	public Collection<? extends GrantedAuthority> getAuthorities() {
		return this.authorities;
	}
	
	@Override
	public boolean isAccountNonExpired() {
		return true;
	}
	
	@Override
	public boolean isAccountNonLocked() {
		return true;
	}
	
	@Override
	public boolean isCredentialsNonExpired() {
		return true;
	}
	
	@Override
	public boolean isEnabled() {
		return this.user.isEnabled();
	}
	
}
