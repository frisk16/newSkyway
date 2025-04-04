package com.example.newSkyWay.security;

import java.util.ArrayList;
import java.util.Collection;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.example.newSkyWay.entity.User;
import com.example.newSkyWay.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {
	
	private final UserRepository userRepository;
	
	@Override
	public UserDetails loadUserByUsername(String userName) throws UsernameNotFoundException {
		try {
			User user = this.userRepository.findByUserName(userName);
			String roleName = user.getRole().getRoleName();
			Collection<GrantedAuthority> authorities = new ArrayList<>();
			authorities.add(new SimpleGrantedAuthority(roleName));
			
			return new UserDetailsImpl(user, authorities);
		} catch(Exception e) {
			throw new UsernameNotFoundException("Login Error: "+e.getMessage());
		}
	}

}
