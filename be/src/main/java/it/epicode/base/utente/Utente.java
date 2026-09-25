package it.epicode.base.utente;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

/**
 * Non esce mai dai controller: verso il client viaggia UtenteDto, dal client
 * arrivano solo i DTO di registrazione e profilo. Ruolo e hash non si toccano
 * da fuori.
 */
@Entity
@Table(name = "utenti")
public class Utente {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, unique = true, length = 254)
	private String email;

	@Column(nullable = false, length = 80)
	private String nome;

	@Column(name = "password_hash", nullable = false, length = 100)
	private String passwordHash;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 10)
	private Ruolo ruolo;

	@Column(name = "creato_il", nullable = false, updatable = false)
	private Instant creatoIl;

	protected Utente() {
	}

	public Utente(String email, String nome, String passwordHash, Ruolo ruolo) {
		this.email = email;
		this.nome = nome;
		this.passwordHash = passwordHash;
		this.ruolo = ruolo;
		this.creatoIl = Instant.now();
	}

	public Long getId() {
		return id;
	}

	public String getEmail() {
		return email;
	}

	public String getNome() {
		return nome;
	}

	public void setNome(String nome) {
		this.nome = nome;
	}

	public String getPasswordHash() {
		return passwordHash;
	}

	public Ruolo getRuolo() {
		return ruolo;
	}

	public Instant getCreatoIl() {
		return creatoIl;
	}
}
