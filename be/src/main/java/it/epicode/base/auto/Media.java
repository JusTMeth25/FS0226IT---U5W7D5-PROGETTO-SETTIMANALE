package it.epicode.base.auto;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

/**
 * Foto reale (Wikimedia Commons) e modello 3D (Sketchfab) di un'auto, con i
 * crediti che le licenze Creative Commons chiedono di mostrare.
 *
 * Del modello 3D si salva solo l'identificativo: l'indirizzo dell'iframe lo
 * compone il frontend su sketchfab.com, quindi nessuno puo' far caricare una
 * pagina qualsiasi dentro il sito.
 */
@Embeddable
public class Media {

	@Column(name = "foto_url", length = 500)
	private String fotoUrl;

	@Column(name = "foto_autore", length = 200)
	private String fotoAutore;

	@Column(name = "foto_licenza", length = 60)
	private String fotoLicenza;

	@Column(name = "foto_fonte", length = 500)
	private String fotoFonte;

	@Column(name = "modello3d_uid", length = 32)
	private String modello3dUid;

	@Column(name = "modello3d_autore", length = 100)
	private String modello3dAutore;

	@Column(name = "modello3d_fonte", length = 300)
	private String modello3dFonte;

	public Media() {
	}

	public Media(String fotoUrl, String fotoAutore, String fotoLicenza, String fotoFonte,
				 String modello3dUid, String modello3dAutore, String modello3dFonte) {
		this.fotoUrl = fotoUrl;
		this.fotoAutore = fotoAutore;
		this.fotoLicenza = fotoLicenza;
		this.fotoFonte = fotoFonte;
		this.modello3dUid = modello3dUid;
		this.modello3dAutore = modello3dAutore;
		this.modello3dFonte = modello3dFonte;
	}

	public String getFotoUrl() {
		return fotoUrl;
	}

	public String getFotoAutore() {
		return fotoAutore;
	}

	public String getFotoLicenza() {
		return fotoLicenza;
	}

	public String getFotoFonte() {
		return fotoFonte;
	}

	public String getModello3dUid() {
		return modello3dUid;
	}

	public String getModello3dAutore() {
		return modello3dAutore;
	}

	public String getModello3dFonte() {
		return modello3dFonte;
	}
}
